from flask import Flask, request, jsonify
from repository import StudentRepository
from models import Student
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
repo = StudentRepository()

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

@app.route("/api/students/<student_id>", methods=["GET"])
def get_student(student_id):
    student = repo.get_student_by_id(student_id)
    if student:
        return jsonify(student.to_dict())
    return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5001)