from flask import Flask, request, jsonify
from repository import CourseRepository
from models import Course
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all domains on all routes
CORS(app, resources={r"/*": {"origins": "*"}})

@app.before_request
def log_request_info():
    print('Headers: %s', request.headers)
    print('Body: %s', request.get_data())

# Tắt tự động xuống dòng để JSON gọn (cho đồng bộ với các service kia)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = CourseRepository()

# ==========================================
# 1. API ĐA NĂNG: TẠO MÔN (POST) & LẤY LIST (GET)
# ==========================================
@app.route("/api/courses", methods=["POST", "GET"])
def handle_courses():
    # --- TRƯỜNG HỢP 1: LẤY DANH SÁCH (GET) ---
    # (Đây là phần bổ sung để fix lỗi 405)
    if request.method == "GET":
        try:
            courses = repo.get_all_courses()
            # Chuyển đổi list object Course thành list dict
            return jsonify([c.to_dict() for c in courses])
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    # --- TRƯỜNG HỢP 2: TẠO MÔN HỌC MỚI (POST) ---
    if request.method == "POST":
        data = request.get_json(force=True)
        try:
            # Helper to convert empty string to None
            def opt_val(val):
                return val if val and str(val).strip() else None

            course = Course(
                data["course_id"], 
                data["course_name"], 
                int(data.get("total_credits", 0)),
                int(data.get("theory_credits", 0)),
                int(data.get("practical_credits", 0)),
                opt_val(data.get("prerequisite")),
                opt_val(data.get("co_requisite")),
                opt_val(data.get("previous"))
            )
            
            repo.add_course(course)
            return jsonify(course.to_dict()), 201
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

# ==========================================
# 2. API LẤY CHI TIẾT 1 MÔN (GET), UPDATE (PUT) & XÓA (DELETE)
# ==========================================
@app.route("/api/courses/<course_id>", methods=["GET", "PUT", "DELETE"])
def get_course(course_id):
    try:
        if request.method == "GET":
            course = repo.get_course_by_id(course_id)
            if course:
                return jsonify(course.to_dict())
            return jsonify({"error": "Not found"}), 404
        
        if request.method == "PUT":
            data = request.get_json(force=True)
            try:
                # Helper to convert empty string to None
                def opt_val(val):
                    return val if val and str(val).strip() else None

                course_update = Course(
                    course_id,
                    data.get("course_name"), 
                    int(data.get("total_credits", 0)),
                    int(data.get("theory_credits", 0)),
                    int(data.get("practical_credits", 0)),
                    opt_val(data.get("prerequisite")),
                    opt_val(data.get("co_requisite")),
                    opt_val(data.get("previous"))
                )
                
                success = repo.update_course(course_id, course_update)
                if success:
                    return jsonify({"message": "Updated successfully"}), 200
                else:
                    return jsonify({"error": "Course not found or update failed"}), 404
            except Exception as ex:
                return jsonify({"error": str(ex)}), 500

        if request.method == "DELETE":
            try:
                success = repo.delete_course(course_id)
                if success:
                    return jsonify({"message": "Deleted successfully"}), 200
                else:
                    return jsonify({"error": "Course not found"}), 404
            except Exception as ex:
                return jsonify({"error": str(ex)}), 500
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5002)