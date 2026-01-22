from flask import Flask, request, jsonify
from flask_cors import CORS
from repository import FacultyRepository
from models import Faculty

app = Flask(__name__)

# Enable CORS
CORS(app)

app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = FacultyRepository()

@app.route("/api/faculties", methods=["POST", "GET"])
def handle_faculties():
    if request.method == "GET":
        faculties = repo.get_all_faculties()
        return jsonify([f.to_dict() for f in faculties])
        
    if request.method == "POST":
        data = request.get_json(force=True)
        try:
            f_id = data.get("fac_id")
            f_name = data.get("fac_name")
            
            if not f_id or not f_name:
                return jsonify({"error": "Missing info"}), 400
                
            faculty = Faculty(
                fac_id=f_id,
                fac_name=f_name,
                fac_address=data.get("fac_address"),
                fac_email=data.get("fac_email"),
                fac_number=data.get("fac_number"),
                mem_school_id=data.get("mem_school_id")
            )
            repo.add_faculty(faculty)
            return jsonify(faculty.to_dict()), 201
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

@app.route("/api/faculties/<fac_id>", methods=["GET", "PUT", "DELETE"])
def faculty_detail(fac_id):
    if request.method == "GET":
        faculty = repo.get_faculty_by_id(fac_id)
        if faculty:
            return jsonify(faculty.to_dict())
        return jsonify({"error": "Not found"}), 404
    
    if request.method == "PUT":
        data = request.get_json(force=True)
        try:
            faculty = Faculty(
                fac_id=fac_id, 
                fac_name=data.get("fac_name"),
                fac_address=data.get("fac_address"),
                fac_email=data.get("fac_email"),
                fac_number=data.get("fac_number"),
                mem_school_id=data.get("mem_school_id")
            )
            success = repo.update_faculty(faculty)
            if success:
                return jsonify({"message": "Updated successfully"}), 200
            else:
                return jsonify({"error": "Faculty not found"}), 404
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    if request.method == "DELETE":
        try:
            repo.delete_faculty(fac_id)
            return jsonify({"message": "Deleted"}), 200
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

@app.route('/api/schools', methods=['GET'])
def get_schools():
    schools = repo.get_all_schools()
    return jsonify(schools)

@app.route('/api/schools/<school_id>/faculties', methods=['GET'])
def get_school_faculties(school_id):
    faculties = repo.get_faculties_by_school(school_id)
    return jsonify([f.to_dict() for f in faculties])

if __name__ == "__main__":
    app.run(debug=True, port=5007)
