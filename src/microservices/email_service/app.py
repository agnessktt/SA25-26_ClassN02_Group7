from flask import Flask, request, jsonify
import time
import json
import requests

app = Flask(__name__)

STUDENT_SERVICE_URL = "http://127.0.0.1:5001/api/students"

def process_email(student_id, student_email, grade, course_id):
    """Giả lập việc gửi email thực sự"""
    time.sleep(1)
    print("\n" + "="*50)
    print(f"[EMAIL SYSTEM]  SENDING NOTIFICATION")
    print(f"[EMAIL SYSTEM] To: {student_email} (ID: {student_id})")
    print(f"[EMAIL SYSTEM] Subject: Grade Notification - {course_id}")
    print(f"[EMAIL SYSTEM] Body: Hello {student_id}, your grade for {course_id} is: {grade}")
    print(f"[EMAIL SYSTEM] Status: SUCCESS")
    print("="*50 + "\n")

# API nhận yêu cầu gửi mail
@app.route("/api/email/send", methods=["POST"])
def send_email():
    # 1. Lấy dữ liệu 
    data = request.get_json(force=True)
    student_id = data.get("student_id")
    grade = data.get("grade")
    course_id = data.get("course_id") or data.get("course_code") or "Unknown Course"

    # 2. Lấy email sinh viên từ Student Service
    student_email = "unknown@student.edu"
    try:
        response = requests.get(f"{STUDENT_SERVICE_URL}/{student_id}")
        if response.status_code == 200:
            student_data = response.json()
            student_email = student_data.get("student_email") or student_data.get("email") or student_email
    except Exception as e:
        print(f"[Email Service Error] Could not fetch student email: {e}")

    # Gửi mail (giả lập)
    process_email(student_id, student_email, grade, course_id)
    
    return jsonify({
        "message": "Email sent successfully",
        "to": student_email
    }), 200

if __name__ == "__main__":
    # Chạy Flask ở Port 5005
    app.run(debug=True, port=5005, use_reloader=False)
