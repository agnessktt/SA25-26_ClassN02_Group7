from flask import Flask, request, jsonify
from src.engines.enrollment_engine import EnrollmentEngine

app = Flask(__name__)
engine = EnrollmentEngine()

@app.route("/api/enrollments", methods=["POST"])
def enroll():
    data = request.json
    try:
        e = engine.enroll_student(data["student_id"], data["course_code"])
        return jsonify(e.to_dict()), 201
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400

@app.route("/api/enrollments", methods=["GET"])
def get_all():
    return jsonify([e.to_dict() for e in engine.get_all_enrollments()])

@app.route("/api/enrollments/<int:id>/grade", methods=["PUT"])
def grade(id):
    try:
        e = engine.assign_grade(id, request.json["grade"])
        return jsonify(e.to_dict())
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400

@app.route("/api/enrollments/<int:id>", methods=["DELETE"])
def delete(id):
    try:
        engine.remove_enrollment(id)
        return jsonify({"message": "Deleted"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404

if __name__ == "__main__":
    app.run(debug=True)
