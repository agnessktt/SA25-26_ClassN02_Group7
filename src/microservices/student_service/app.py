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
# 1. API TẠO SINH VIÊN (POST)
# ==========================================
@app.route("/api/students", methods=["POST"])
def create_student():
    data = request.get_json(force=True)
    try:
        if not data.get("student_id") or not data.get("name"):
            return jsonify({"error": "Missing info"}), 400
        student = Student(data["student_id"], data["name"])
        repo.add_student(student)
        return jsonify(student.to_dict()), 201
    except Exception as ex:
        return jsonify({"error": str(ex)}), 400

# ==========================================
# 2. API LẤY THÔNG TIN SINH VIÊN (GET)
# ==========================================
@app.route("/api/students/<student_id>", methods=["GET"])
def get_student(student_id):
    student = repo.get_student_by_id(student_id)
    if student:
        return jsonify(student.to_dict())
    return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    # Chạy Port 5001
    app.run(debug=True, port=5001)