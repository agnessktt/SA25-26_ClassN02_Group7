# src/UI/app.py

from flask import Flask, request, jsonify
from src.engines.enrollment_engine import EnrollmentEngine

app = Flask(__name__)
engine = EnrollmentEngine()

# ==========================
# 1. ADMIN API
# ==========================
@app.route("/api/students", methods=["POST"])
def create_student():
    data = request.get_json(force=True)
    try:
        student = engine.create_student(data["student_id"], data["name"])
        return jsonify(student), 201
    except (KeyError, ValueError) as ex:
        return jsonify({"error": str(ex)}), 400

@app.route("/api/courses", methods=["POST"])
def create_course():
    data = request.get_json(force=True)
    try:
        credits = int(data.get("credits", 3))
        course = engine.create_course(data["course_code"], data["name"], credits)
        return jsonify(course), 201
    except (KeyError, ValueError) as ex:
        return jsonify({"error": str(ex)}), 400

# ==========================
# 2. ENROLLMENTS API
# ==========================
@app.route("/api/enrollments", methods=["POST"])
def enroll():
    data = request.get_json(force=True)
    try:
        e = engine.enroll_student(data["student_id"], data["course_code"])
        return jsonify(e.to_dict()), 201
    except (KeyError, ValueError) as ex:
        return jsonify({"error": str(ex)}), 400

@app.route("/api/enrollments", methods=["GET"])
def get_all():
    return jsonify([e.to_dict() for e in engine.get_all_enrollments()])

@app.route("/api/enrollments/<int:eid>/grade", methods=["PUT"])
def grade(eid):
    """
    Accepts payloads:
    - {"grade": 8.2}
    - {"scores": [..], "weights": [..]}
    """
    data = request.get_json(force=True)
    try:
        e = engine.assign_grade(eid, data)
        return jsonify(e.to_dict())
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400

@app.route("/api/enrollments/<int:eid>", methods=["DELETE"])
def delete(eid):
    try:
        engine.remove_enrollment(eid)
        return jsonify({"message": "Deleted"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404

# ==========================
# 3. GPA API
# ==========================
@app.route("/api/students/<student_id>/gpa", methods=["GET"])
def get_gpa(student_id):
    try:
        result = engine.calculate_gpa(student_id)
        return jsonify(result)
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500


if __name__ == "__main__":
    app.run(debug=True)