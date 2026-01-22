from flask import Flask, request, jsonify
from flask_cors import CORS
from repository import MajorRepository
from models import Major

app = Flask(__name__)

# Enable CORS
CORS(app)

app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

repo = MajorRepository()

@app.route("/api/majors", methods=["POST", "GET"])
def handle_majors():
    if request.method == "GET":
        majors = repo.get_all_majors()
        return jsonify([m.to_dict() for m in majors])
        
    if request.method == "POST":
        data = request.get_json(force=True)
        try:
            m_id = data.get("major_id")
            m_name = data.get("major_name")
            courses = data.get("courses", []) # Lấy danh sách học phần nếu có
            
            if not m_id or not m_name:
                return jsonify({"error": "Missing info"}), 400
                
            major = Major(
                major_id=m_id,
                major_name=m_name,
                major_credits=data.get("major_credits"),
                fac_id=data.get("fac_id")
            )
            repo.add_major(major, courses) # Truyền courses vào repo
            return jsonify(major.to_dict()), 201
        except Exception as ex:
            return jsonify({"error": str(ex)}), 400

@app.route("/api/majors/<major_id>", methods=["GET", "PUT", "DELETE"])
def major_detail(major_id):
    if request.method == "GET":
        major = repo.get_major_by_id(major_id)
        if major:
            major_dict = major.to_dict()
            # Load knowledge blocks for the major
            knowledge_blocks_data = repo.get_all_courses_by_major(major_id)
            major_dict['knowledge_blocks'] = knowledge_blocks_data['knowledge_blocks']
            major_dict['total_credits'] = knowledge_blocks_data['total_credits']
            return jsonify(major_dict)
        return jsonify({"error": "Not found"}), 404
    
    if request.method == "PUT":
        data = request.get_json(force=True)
        try:
            major = Major(
                major_id=major_id, 
                major_name=data.get("major_name"),
                major_credits=data.get("major_credits"),
                fac_id=data.get("fac_id")
            )
            courses = data.get("courses", [])  # Lấy danh sách học phần nếu có
            success = repo.update_major(major, courses)  # Truyền courses vào repo
            if success:
                return jsonify({"message": "Updated successfully"}), 200
            else:
                return jsonify({"error": "Major not found"}), 404
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

    if request.method == "DELETE":
        try:
            repo.delete_major(major_id)
            return jsonify({"message": "Deleted"}), 200
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

@app.route('/api/faculties', methods=['GET'])
def get_faculties():
    faculties = repo.get_all_faculties()
    return jsonify(faculties)

@app.route('/api/faculties/<int:fac_id>/majors', methods=['GET'])
def get_faculty_majors(fac_id):
    majors = repo.get_majors_by_faculty(fac_id)
    return jsonify([m.to_dict() for m in majors])

# Knowledge Block Endpoints
@app.route('/api/majors/<major_id>/knowledge-blocks/<block_type>/courses', methods=['GET', 'POST'])
def handle_knowledge_block_courses(major_id, block_type):
    if request.method == 'GET':
        courses = repo.get_courses_by_knowledge_block(major_id, block_type)
        return jsonify({
            'major_id': major_id,
            'block_type': block_type,
            'courses': courses,
            'total_credits': sum(c['course_credits'] for c in courses)
        })
    
    if request.method == 'POST':
        data = request.get_json(force=True)
        try:
            course_id = data.get('course_id')
            course_name = data.get('course_name')
            course_credits = data.get('course_credits', 0)
            
            if not course_id or not course_name:
                return jsonify({"error": "Missing course info"}), 400
            
            success = repo.add_course_to_knowledge_block(major_id, block_type, course_id, course_name, course_credits)
            if success:
                total_credits = repo.get_total_credits_by_major(major_id)
                return jsonify({
                    "message": "Course added successfully",
                    "course_id": course_id,
                    "total_major_credits": total_credits
                }), 201
            else:
                return jsonify({"error": "Failed to add course"}), 400
        except Exception as ex:
            return jsonify({"error": str(ex)}), 500

@app.route('/api/majors/<major_id>/knowledge-blocks/<block_type>/courses/<course_id>', methods=['DELETE'])
def delete_course_from_knowledge_block(major_id, block_type, course_id):
    try:
        success = repo.remove_course_from_knowledge_block(major_id, block_type, course_id)
        if success:
            total_credits = repo.get_total_credits_by_major(major_id)
            return jsonify({
                "message": "Course removed successfully",
                "total_major_credits": total_credits
            }), 200
        else:
            return jsonify({"error": "Course not found"}), 404
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

@app.route('/api/majors/<major_id>/knowledge-blocks', methods=['GET'])
def get_all_knowledge_blocks(major_id):
    """Lấy tất cả khối kiến thức của ngành học"""
    try:
        knowledge_blocks_data = repo.get_all_courses_by_major(major_id)
        return jsonify({
            'major_id': major_id,
            'knowledge_blocks': knowledge_blocks_data['knowledge_blocks'],
            'total_credits': knowledge_blocks_data['total_credits']
        }), 200
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

@app.route('/api/majors/<major_id>/total-credits', methods=['GET'])
def get_major_total_credits(major_id):
    """Lấy tổng tín chỉ của ngành học"""
    try:
        total_credits = repo.get_total_credits_by_major(major_id)
        return jsonify({
            'major_id': major_id,
            'total_credits': total_credits
        }), 200
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5009)


