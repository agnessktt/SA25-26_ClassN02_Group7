from flask import Flask, request, jsonify
from flask_cors import CORS
from repository import UniRepository
from models import Uni

app = Flask(__name__)

# Enable CORS
CORS(app)

app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = UniRepository()

@app.route("/api/unis", methods=["POST", "GET"])
def handle_unis():
    if request.method == "GET":
        unis = repo.get_all_unis()
        return jsonify([u.to_dict() for u in unis])
        
    if request.method == "POST":
        data = request.get_json(force=True)
        try:
            u_id = data.get("mem_school_id")
            u_name = data.get("mem_school_name")
            
            if not u_id or not u_name:
                return jsonify({"error": "Missing info"}), 400
                
            uni = Uni(
                mem_school_id=u_id,
                mem_school_name=u_name,
                mem_school_websit=data.get("mem_school_websit")
            )
            repo.add_uni(uni)
            return jsonify(uni.to_dict()), 201
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

@app.route("/api/unis/<u_id>", methods=["GET", "PUT", "DELETE"])
def uni_detail(u_id):
    if request.method == "GET":
        uni = repo.get_uni_by_id(u_id)
        if uni:
            return jsonify(uni.to_dict())
        return jsonify({"error": "Not found"}), 404
    
    if request.method == "PUT":
        data = request.get_json(force=True)
        try:
            uni = Uni(
                mem_school_id=u_id, 
                mem_school_name=data.get("mem_school_name"),
                mem_school_websit=data.get("mem_school_websit")
            )
            success = repo.update_uni(uni)
            if success:
                return jsonify({"message": "Updated successfully"}), 200
            else:
                return jsonify({"error": "Uni not found"}), 404
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    if request.method == "DELETE":
        try:
            repo.delete_uni(u_id)
            return jsonify({"message": "Deleted"}), 200
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5008)
