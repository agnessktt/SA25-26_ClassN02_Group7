from flask import Flask, request, jsonify
import time
import json

app = Flask(__name__)

def process_email(student_id, grade, course_id):
    """Giả lập việc gửi email thực sự"""
    time.sleep(2)
    print("\n" + "="*40)
    print(f"[EMAIL SYSTEM]  NOTIFYING STUDENT: {student_id}")
    print(f"[EMAIL SYSTEM] Subject: Grade Notification")
    print(f"[EMAIL SYSTEM] Body: Your grade for {course_id} is: {grade}")
    print(f"[EMAIL SYSTEM] Status: SENT via HTTP API")
    print("="*40 + "\n")

# API nhận yêu cầu gửi mail
@app.route("/api/email/send", methods=["POST"])
def send_email():
    # 1. Lấy dữ liệu 
    data = request.get_json(force=True)
    student_id = data.get("student_id")
    grade = data.get("grade")
    course_id = data.get("course_id") or data.get("course_code") or "Unknown Course"

    # Gửi mail (giả lập)
    process_email(student_id, grade, course_id)
    
    return jsonify({"message": "Email sent successfully (via HTTP API)"}), 200

if __name__ == "__main__":
    # Chạy Flask ở Port 5005
    app.run(debug=True, port=5005, use_reloader=False)
