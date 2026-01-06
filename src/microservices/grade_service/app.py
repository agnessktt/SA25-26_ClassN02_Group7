from flask import Flask, request, jsonify
import requests  # Thư viện để gọi API khác
from repository import EnrollmentRepository
from models import Enrollment

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = EnrollmentRepository()

# ĐỊA CHỈ CỦA 2 SERVICE KIA
STUDENT_SERVICE_URL = "http://127.0.0.1:5001/api/students"
COURSE_SERVICE_URL = "http://127.0.0.1:5002/api/courses"

# =======================================================
# 1. API ĐA NĂNG: LẤY DANH SÁCH (LỌC THEO SV) & ĐĂNG KÝ
# =======================================================
@app.route("/api/enrollments", methods=["POST", "GET"])
def handle_enrollments():
    # --- TRƯỜNG HỢP 1: LẤY DANH SÁCH (GET) ---
    if request.method == "GET":
        try:
            # Kiểm tra xem có tham số ?student_id=SV01 trên URL không?
            s_id = request.args.get('student_id')
            
            if s_id:
                # Nếu có student_id -> Chỉ lấy môn của SV đó
                results = repo.get_enrollments_by_student(s_id)
            else:
                # Nếu không có -> Lấy tất cả
                results = repo.get_all_enrollments()
                
            return jsonify([e.to_dict() for e in results])
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    # --- TRƯỜNG HỢP 2: ĐĂNG KÝ MỚI (POST) ---
    if request.method == "POST":
        data = request.get_json(force=True)
        student_id = data.get("student_id")
        course_code = data.get("course_code")

        if not student_id or not course_code:
            return jsonify({"error": "Missing student_id or course_code"}), 400

        # Bước 1: Gọi sang Student Service (Port 5001) để kiểm tra
        try:
            s_resp = requests.get(f"{STUDENT_SERVICE_URL}/{student_id}")
            if s_resp.status_code != 200:
                return jsonify({"error": "Student not found (checked via Microservice)"}), 400
        except requests.exceptions.ConnectionError:
            return jsonify({"error": "Student Service is down"}), 503

        # Bước 2: Gọi sang Course Service (Port 5002) để lấy credits
        try:
            c_resp = requests.get(f"{COURSE_SERVICE_URL}/{course_code}")
            if c_resp.status_code != 200:
                return jsonify({"error": "Course not found (checked via Microservice)"}), 400
            course_data = c_resp.json()
        except requests.exceptions.ConnectionError:
            return jsonify({"error": "Course Service is down"}), 503
        
        # Bước 3: Lưu vào DB
        try:
            enrollment = Enrollment(None, student_id, course_code, None)
            new_id = repo.add_enrollment(enrollment)
            
            # Gán lại thông tin để trả về client
            enrollment.enrollment_id = new_id
            enrollment.credits = course_data.get('credits') 
            return jsonify(enrollment.to_dict()), 201
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

# ==========================================
# 2. API NHẬP ĐIỂM (Tính điểm thành phần & Format đẹp)
# ==========================================
@app.route("/api/enrollments/<int:eid>/grade", methods=["PUT"])
def grade(eid):
    data = request.get_json(force=True)
    try:
        final_grade = None
        scores = []
        weights = []
        
        # Case A: Nhập danh sách điểm và trọng số
        if "scores" in data:
            scores = data.get("scores", [])
            # Nếu không gửi weights, dùng mặc định 5-5-30-60
            weights = data.get("weights", [5, 5, 30, 60]) 
            final_grade = Enrollment.weighted_average(scores, weights)
            
        # Case B: Nhập thẳng điểm tổng kết
        elif "grade" in data:
            final_grade = float(data["grade"])
        else:
            return jsonify({"error": "Invalid payload. Provide 'scores' or 'grade'."}), 400

        if final_grade < 0 or final_grade > 10:
            return jsonify({"error": "Grade must be between 0 and 10"}), 400

        repo.update_grade(eid, final_grade)
        
        # Lấy lại bản ghi để trả về
        updated = repo.get_enrollment_by_id(eid)
        if updated:
            formatted_components = {}
            if scores and weights:
                for i, (s, w) in enumerate(zip(scores, weights)):
                    formatted_components[f"Score{i+1} ({w}%)"] = s
            else:
                formatted_components = {"Final": final_grade}
            
            updated.component_scores = formatted_components
            return jsonify(updated.to_dict())
            
        return jsonify({"message": "Grade updated successfully"}), 200

    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        return jsonify({"error": "Internal Error: " + str(ex)}), 500

# ==========================================
# 3. API TÍNH GPA (Trả về Hệ 10, Chữ và Hệ 4)
# ==========================================
@app.route("/api/students/<student_id>/gpa", methods=["GET"])
def get_gpa(student_id):
    try:
        result = repo.calculate_gpa_by_student(student_id)
        return jsonify(result)
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

# ==========================================
# 4. API XÓA ĐĂNG KÝ
# ==========================================
@app.route("/api/enrollments/<int:eid>", methods=["DELETE"])
def delete_enrollment(eid):
    try:
        repo.delete_enrollment(eid)
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5003)