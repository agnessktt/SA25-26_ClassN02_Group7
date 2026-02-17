from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from repository import EnrollmentRepository
from models import Enrollment

app = Flask(__name__)
CORS(app)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = EnrollmentRepository()

STUDENT_SERVICE_URL = "http://127.0.0.1:5001/api/students"
COURSE_SERVICE_URL  = "http://127.0.0.1:5002/api/courses"

@app.route("/api/enrollments", methods=["POST", "GET"])
def handle_enrollments():
    if request.method == "GET":
        try:
            s_id = request.args.get('student_id')
            if s_id:
                results = repo.get_enrollments_by_student(s_id)
            else:
                results = repo.get_all_enrollments()
            return jsonify([e.to_dict() for e in results])
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    if request.method == "POST":
        data = request.get_json(force=True)
        student_id = data.get("student_id")
        course_id = data.get("course_id") or data.get("course_code")

        if not student_id or not course_id:
            return jsonify({"error": "Missing student_id or course_id"}), 400

        try:
            enrollment = Enrollment(None, student_id, course_id)
            new_id = repo.add_enrollment(enrollment)
            enrollment.enrollment_id = new_id
            return jsonify(enrollment.to_dict()), 201
        except Exception as ex:
            print(f"Error adding enrollment: {ex}")
            return jsonify({"error": f"Database error: {str(ex)}"}), 400

@app.route("/api/enrollments/<int:enrollment_id>", methods=["PUT", "DELETE"])
def enrollment_detail(enrollment_id):
    if request.method == "PUT":
        data = request.get_json(force=True)
        student_id = data.get("student_id")
        course_id = data.get("course_id") or data.get("course_code")
        
        if not student_id or not course_id:
            return jsonify({"error": "Missing student_id or course_id"}), 400

        try:
            success = repo.update_enrollment(enrollment_id, student_id, course_id)
            if success:
                return jsonify({"message": "Updated successfully"}), 200
            else:
                return jsonify({"error": "Enrollment not found"}), 404
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    if request.method == "DELETE":
        try:
            repo.delete_enrollment(enrollment_id)
            return jsonify({"message": "Deleted successfully"}), 200
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

@app.route("/api/enrollments/<int:enrollment_id>/approve", methods=["POST"])
def approve_enrollment(enrollment_id):
    try:
        success = repo.approve_enrollment(enrollment_id)
        if success:
            return jsonify({"message": "Approved successfully"}), 200
        else:
            return jsonify({"error": "Enrollment not found"}), 404
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    # Running on Port 5006 to avoid conflict with Grade Service (5003)
    app.run(debug=True, port=5006)
