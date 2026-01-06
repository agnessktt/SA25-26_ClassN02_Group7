from flask import Flask, request, jsonify
from repository import CourseRepository
from models import Course
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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
            credits = int(data.get("credits", 0))
            if credits <= 0: 
                return jsonify({"error": "Invalid credits"}), 400
            
            course = Course(data["course_code"], data["name"], credits)
            repo.add_course(course)
            return jsonify(course.to_dict()), 201
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

# ==========================================
# 2. API LẤY CHI TIẾT 1 MÔN (GET)
# ==========================================
@app.route("/api/courses/<course_code>", methods=["GET"])
def get_course(course_code):
    try:
        course = repo.get_course_by_code(course_code)
        if course:
            return jsonify(course.to_dict())
        return jsonify({"error": "Not found"}), 404
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5002)