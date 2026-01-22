from flask import Flask, request, jsonify
import requests  # Thư viện để gọi API khác
import threading # Thư viện để chạy đa luồng (cho Email)
from flask_cors import CORS # Thư viện xử lý CORS cho Frontend
from repository import GradeRepository
from models import Grade, Enrollment

app = Flask(__name__)
# 1. Kích hoạt CORS cho toàn bộ ứng dụng
CORS(app)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = GradeRepository()

# =======================================================
# CẤU HÌNH ĐỊA CHỈ CÁC MICROSERVICES KHÁC
# =======================================================
STUDENT_SERVICE_URL = "http://127.0.0.1:5001/api/students"
COURSE_SERVICE_URL  = "http://127.0.0.1:5002/api/courses"
EMAIL_SERVICE_URL   = "http://127.0.0.1:5005/api/email/send"

# =======================================================
# HÀM HỖ TRỢ: GỬI EMAIL BẤT ĐỒNG BỘ (BACKGROUND TASK)
# =======================================================
def send_email_async(student_id, grade, course_code):
    """
    Hàm này chạy trong một luồng (Thread) riêng biệt.
    Nó giúp API trả về kết quả ngay lập tức mà không cần chờ gửi mail xong.
    """
    try:
        payload = {
            "student_id": student_id,
            "grade": grade,
            "course_code": course_code
        }
        # Gọi sang Email Service (Port 5005)
        requests.post(EMAIL_SERVICE_URL, json=payload)
    except Exception as ex:
        # Chỉ in lỗi ra console server, không ảnh hưởng client
        print(f"[Async Error] Failed to send email: {ex}")

# =======================================================
# 1. API ĐA NĂNG: LẤY DANH SÁCH (LỌC THEO SV) & ĐĂNG KÝ
# =======================================================
@app.route("/api/grades", methods=["GET"])
def handle_grades():
    # --- TRƯỜNG HỢP 1: LẤY DANH SÁCH ĐIỂM (GET) ---
    try:
        # Kiểm tra xem có tham số ?student_id=SV01 trên URL không?
        s_id = request.args.get('student_id')
        
        if s_id:
            # Nếu có student_id -> Chỉ lấy môn của SV đó
            results = repo.get_grades_by_student(s_id)
        else:
            # Nếu không có -> Lấy tất cả
            results = repo.get_all_grades()
            
        return jsonify([g.to_dict() for g in results])
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500


# ==========================================
# 2. API QUẢN LÝ ĐĂNG KÝ (ENROLLMENTS)
# ==========================================
@app.route("/api/enrollments", methods=["POST"])
def add_enrollment():
    data = request.get_json()
    try:
        enrollment = Enrollment(
            student_id=data.get("student_id"),
            course_code=data.get("course_code")
        )
        enrollment_id = repo.add_enrollment(enrollment)
        enrollment.enrollment_id = enrollment_id
        return jsonify(enrollment.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/enrollments/<int:enrollment_id>", methods=["DELETE"])
def delete_enrollment(enrollment_id):
    try:
        success = repo.delete_enrollment(enrollment_id)
        if success:
            return jsonify({"message": "Enrollment deleted"}), 200
        else:
            return jsonify({"error": "Enrollment not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 3. API CẬP NHẬT ĐIỂM (PUT)
# ==========================================
@app.route("/api/grades/<int:enrollment_id>", methods=["PUT"])
def update_grade(enrollment_id):
    data = request.get_json()
    try:
        # Assuming the backend calculates the final grade
        # The frontend might send component scores
        scores = data.get("scores")
        weights = data.get("weights") # e.g., [0.1, 0.4, 0.5]

        if scores and weights and len(scores) == len(weights):
            # Basic weighted calculation
            final_grade = sum(s * w for s, w in zip(scores, weights))
            success = repo.update_grade(enrollment_id, final_grade, scores)
        else:
            # Fallback for direct grade update
            final_grade = data.get("grade")
            if final_grade is None:
                return jsonify({"error": "Grade or scores/weights required"}), 400
            success = repo.update_grade(enrollment_id, final_grade)

        if success:
            # Lấy lại bản ghi để trả về (và để lấy info gửi mail)
            updated = repo.get_enrollment_by_id(enrollment_id)
            if updated:
                # Format hiển thị điểm thành phần (cho đẹp)
                formatted_components = {}
                if scores and weights:
                    for i, (s, w) in enumerate(zip(scores, weights)):
                        formatted_components[f"Score{i+1} ({w}%)"] = s
                else:
                    formatted_components = {"Final": final_grade}
                updated.component_scores = formatted_components

                # ---------------------------------------------------------
                # [QUAN TRỌNG] GỌI EMAIL SERVICE (ASYNCHRONOUS)
                # ---------------------------------------------------------
                # Tạo luồng mới để gửi mail, không bắt Client phải chờ 2s
                email_thread = threading.Thread(
                    target=send_email_async, 
                    args=(updated.student_id, final_grade, updated.course_code)
                )
                email_thread.start()
                # ---------------------------------------------------------
                
                return jsonify(updated.to_dict()), 200
            else:
                return jsonify({"error": "Enrollment not found"}), 404
        else:
            return jsonify({"error": "Enrollment not found"}), 404
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        return jsonify({"error": "Internal Error: " + str(ex)}), 500

# ==========================================
# 4. API TÍNH GPA (Trả về Hệ 10, Chữ và Hệ 4)
# ==========================================
@app.route("/api/students/<student_id>/gpa", methods=["GET"])
def get_gpa(student_id):
    try:
        result = repo.calculate_gpa_by_student(student_id)
        return jsonify(result)
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    # Chạy Service ở Port 5003
    app.run(debug=True, port=5003)