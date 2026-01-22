from flask import Flask, request, jsonify
from flask_cors import CORS
from repository import KktRepository
from models import Kkt

app = Flask(__name__)

# Enable CORS
CORS(app)

app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = KktRepository()

@app.route("/api/kkts", methods=["POST", "GET"])
def handle_kkts():
    if request.method == "GET":
        kkts = repo.get_all_kkts()
        return jsonify([k.to_dict() for k in kkts])
        
    if request.method == "POST":
        data = request.get_json(force=True)
        try:
            k_id = data.get("kkt_id")
            k_name = data.get("kkt_name")
            
            if not k_id or not k_name:
                return jsonify({"error": "Missing info"}), 400
                
            # Map course_ids list to list of dicts for model
            course_ids = data.get("course_ids", [])
            # Fallback for old single course_id
            if not course_ids and data.get("course_id"):
                course_ids = [data.get("course_id")]
            
            courses_objs = [{'id': cid} for cid in course_ids]

            kkt = Kkt(
                kkt_id=k_id,
                kkt_name=k_name,
                kkt_credits=data.get("kkt_credits"),
                courses=courses_objs
            )
            repo.add_kkt(kkt)
            return jsonify(kkt.to_dict()), 201
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

@app.route("/api/kkts/<kkt_id>", methods=["GET", "PUT", "DELETE"])
def kkt_detail(kkt_id):
    if request.method == "GET":
        kkt = repo.get_kkt_by_id(kkt_id)
        if kkt:
            return jsonify(kkt.to_dict())
        return jsonify({"error": "Not found"}), 404
    
    if request.method == "PUT":
        data = request.get_json(force=True)
        try:
            course_ids = data.get("course_ids", [])
            if not course_ids and data.get("course_id"):
                course_ids = [data.get("course_id")]
            courses_objs = [{'id': cid} for cid in course_ids]

            kkt = Kkt(
                kkt_id=kkt_id, 
                kkt_name=data.get("kkt_name"),
                kkt_credits=data.get("kkt_credits"),
                courses=courses_objs
            )
            success = repo.update_kkt(kkt)
            if success:
                return jsonify({"message": "Updated successfully"}), 200
            else:
                return jsonify({"error": "Kkt not found"}), 404
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    if request.method == "DELETE":
        try:
            repo.delete_kkt(kkt_id)
            return jsonify({"message": "Deleted"}), 200
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = repo.get_all_courses()
    return jsonify(courses)

if __name__ == "__main__":
    app.run(debug=True, port=5010)
