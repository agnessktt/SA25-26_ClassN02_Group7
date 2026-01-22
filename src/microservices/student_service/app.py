from flask import Flask, request, jsonify
from flask_cors import CORS
from repository import StudentRepository
from models import Student

app = Flask(__name__)

# 1. Kích hoạt CORS (Quan trọng cho Frontend)
CORS(app)

# 2. Tắt tự động xuống dòng để JSON gọn gàng, đồng bộ với các service khác (Bổ sung)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = StudentRepository()

# ==========================================
# 1. API TẠO SINH VIÊN (POST) & LẤY LIST (GET)
# ==========================================
@app.route("/api/students", methods=["POST", "GET"])
def handle_students():
    if request.method == "GET":
        students = repo.get_all_students()
        return jsonify([s.to_dict() for s in students])
        
    if request.method == "POST":
        data = request.get_json(force=True)
        try:
            # Check for required fields (support both new and old keys)
            s_id = data.get("student_id")
            s_name = data.get("student_name") or data.get("name")
            
            if not s_id or not s_name:
                return jsonify({"error": "Missing info"}), 400
                
            student = Student(
                student_id=s_id, 
                student_name=s_name,
                date_of_birth=data.get("date_of_birth") or data.get("dob"),
                gender=data.get("gender"),
                student_class=data.get("student_class") or data.get("class_name") or data.get("class"),
                student_email=data.get("student_email") or data.get("email"),
                cohort=data.get("cohort")
            )
            repo.add_student(student)
            return jsonify(student.to_dict()), 201
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

# ==========================================
# 2. API LẤY THÔNG TIN SINH VIÊN (GET), UPDATE (PUT) & XÓA (DELETE)
# ==========================================
@app.route("/api/students/<student_id>", methods=["GET", "PUT", "DELETE"])
def student_detail(student_id):
    if request.method == "GET":
        student = repo.get_student_by_id(student_id)
        if student:
            return jsonify(student.to_dict())
        return jsonify({"error": "Not found"}), 404
    
    if request.method == "PUT":
        data = request.get_json(force=True)
        try:
            student = Student(
                student_id=student_id, 
                student_name=data.get("student_name") or data.get("name"),
                date_of_birth=data.get("date_of_birth") or data.get("dob"),
                gender=data.get("gender"),
                student_class=data.get("student_class") or data.get("class_name") or data.get("class"),
                student_email=data.get("student_email") or data.get("email"),
                cohort=data.get("cohort")
            )
            success = repo.update_student(student)
            if success:
                return jsonify({"message": "Updated successfully"}), 200
            else:
                return jsonify({"error": "Student not found"}), 404
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    if request.method == "DELETE":
        try:
            repo.delete_student(student_id)
            return jsonify({"message": "Deleted"}), 200
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    # Chạy Port 5001
    app.run(debug=True, port=5001)