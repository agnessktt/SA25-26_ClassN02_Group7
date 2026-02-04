from flask import Flask, request, jsonify
import time
import pika
import json
import threading

app = Flask(__name__)

# RabbitMQ Config
RABBITMQ_HOST = 'localhost'
QUEUE_NAME = 'grade_events'

def process_email(student_id, grade, course_id):
    """Giả lập việc gửi email thực sự"""
    time.sleep(2)
    print("\n" + "="*40)
    print(f"[EMAIL SYSTEM]  NOTIFYING STUDENT: {student_id}")
    print(f"[EMAIL SYSTEM] Subject: Grade Notification")
    print(f"[EMAIL SYSTEM] Body: Your grade for {course_id} is: {grade}")
    print(f"[EMAIL SYSTEM] Status: SENT via RabbitMQ Event")
    print("="*40 + "\n")

def rabbitmq_consumer():
    """Hàm lắng nghe các sự kiện từ RabbitMQ"""
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME)

        def callback(ch, method, properties, body):
            data = json.loads(body)
            student_id = data.get("student_id")
            grade = data.get("grade")
            course_id = data.get("course_id")
            
            print(f" [x] [RabbitMQ] Received Grade Update for {student_id}")
            process_email(student_id, grade, course_id)
            ch.basic_ack(delivery_tag=method.delivery_tag)

        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

        print(' [*] Waiting for grade events. To exit press CTRL+C')
        channel.start_consuming()
    except Exception as e:
        print(f" [!] RabbitMQ Consumer Error: {e}")

# API nhận yêu cầu gửi mail
@app.route("/api/email/send", methods=["POST"])
def send_email():
    # 1. Lấy dữ liệu từ Grade Service gửi sang
    data = request.get_json(force=True)
    student_id = data.get("student_id")
    grade = data.get("grade")
    course_id = data.get("course_id") or data.get("course_code") or "Unknown Course"

    # Gửi mail (giả lập)
    process_email(student_id, grade, course_id)
    
    return jsonify({"message": "Email sent successfully (via HTTP API)"}), 200

if __name__ == "__main__":
    # Khởi chạy RabbitMQ Consumer trong một luồng riêng
    consumer_thread = threading.Thread(target=rabbitmq_consumer, daemon=True)
    consumer_thread.start()

    # Chạy Flask ở Port 5005
    app.run(debug=True, port=5005, use_reloader=False)
