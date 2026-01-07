from flask import Flask, request, jsonify
import time

app = Flask(__name__)

# API nhận yêu cầu gửi mail
@app.route("/api/email/send", methods=["POST"])
def send_email():
    # 1. Lấy dữ liệu từ Grade Service gửi sang
    data = request.get_json(force=True)
    student_id = data.get("student_id")
    grade = data.get("grade")
    course_code = data.get("course_code", "Unknown Course")

    # 2. Giả lập độ trễ (delay) như thật (mất 2 giây để gửi mail)
    time.sleep(2)
    
    # 3. Thay vì gửi mail thật, ta in log ra màn hình console
    print("\n" + "="*40)
    print(f"[EMAIL SYSTEM] 📨 PROCESSING EMAIL FOR: {student_id}")
    print(f"[EMAIL SYSTEM] Subject: Notification of Grade Update")
    print(f"[EMAIL SYSTEM] Body: Dear {student_id}, your grade for {course_code} has been updated to: {grade}")
    print(f"[EMAIL SYSTEM] Status: SENT SUCCESSFULLY")
    print("="*40 + "\n")
    
    return jsonify({"message": "Email sent successfully"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5005)