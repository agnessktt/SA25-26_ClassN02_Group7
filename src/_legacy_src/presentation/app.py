# File: src/_legacy_src/presentation/app.py

from flask import Flask, request, jsonify
from src._legacy_src.business_logic.enrollment_service import EnrollmentService

app = Flask(__name__)
service = EnrollmentService()

# ==========================
# 1. ADMIN API
# ==========================
@app.route("/api/students", methods=["POST"])
def create_student():
    data = request.get_json(force=True)
    try:
        student = service.create_student(data["student_id"], data["name"])
        return jsonify(student), 201
    except (KeyError, ValueError) as ex:
        return jsonify({"error": str(ex)}), 400

@app.route("/api/courses", methods=["POST"])
def create_course():
    data = request.get_json(force=True)
    try:
        credits = int(data.get("credits", 3))
        course = service.create_course(data["course_code"], data["name"], credits)
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
        e = service.enroll_student(data["student_id"], data["course_code"])
        return jsonify(e.to_dict()), 201
    except (KeyError, ValueError) as ex:
        return jsonify({"error": str(ex)}), 400

@app.route("/api/enrollments", methods=["GET"])
def get_all():
    return jsonify([e.to_dict() for e in service.get_all_enrollments()])

@app.route("/api/enrollments/<int:eid>/grade", methods=["PUT"])
def grade(eid):
    """
    Accepts payloads:
    - {"grade": 8.2}
    - {"scores": [..], "weights": [..]}
    """
    data = request.get_json(force=True)
    try:
        e = service.assign_grade(eid, data)
        return jsonify(e.to_dict())
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400

@app.route("/api/enrollments/<int:eid>", methods=["DELETE"])
def delete(eid):
    try:
        service.remove_enrollment(eid)
        return jsonify({"message": "Deleted"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404

# ==========================
# 3. GPA API
# ==========================
@app.route("/api/students/<student_id>/gpa", methods=["GET"])
def get_gpa(student_id):
    try:
        result = service.calculate_gpa(student_id)
        return jsonify(result)
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500


if __name__ == "__main__":
    app.run(debug=True)