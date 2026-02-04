from flask import Flask, request, jsonify
from flask_cors import CORS
import pika
import json
import threading
import requests
from repository import NotificationRepository
from models import Notification

app = Flask(__name__)
CORS(app)

repo = NotificationRepository()

# RabbitMQ Config
RABBITMQ_HOST = 'localhost'
QUEUE_NAME = 'grade_events'
EMAIL_SERVICE_URL = "http://localhost:5005/api/email/send"

def rabbitmq_consumer():
    """Lắng nghe sự kiện điểm số từ RabbitMQ và gọi Email Service"""
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()
        channel.queue_declare(queue=QUEUE_NAME)

        def callback(ch, method, properties, body):
            try:
                data = json.loads(body)
                student_id = data.get("student_id")
                grade = data.get("grade")
                course_id = data.get("course_id")
                
                print(f" [x] [Notification Service] Received Grade Update for {student_id}")
                
                # 1. Lưu thông báo vào Database để sinh viên xem trên Web
                title = "Cập nhật điểm mới"
                message = f"Bạn vừa có điểm mới cho học phần {course_id}. Kết quả: {grade}"
                try:
                    notif_id = repo.add_notification(student_id, title, message)
                    print(f" [v] Notification saved to DB with ID: {notif_id}")
                except Exception as e:
                    print(f" [!] Error saving notification to DB: {e}")

                # 2. Gọi sang Email Service để gửi thông báo (Nếu cần)
                payload = {
                    "student_id": student_id,
                    "grade": grade,
                    "course_id": course_id
                }
                
                try:
                    response = requests.post(EMAIL_SERVICE_URL, json=payload)
                    if response.status_code == 200:
                        print(f" [v] Email Service notified successfully")
                    else:
                        print(f" [!] Email Service returned error: {response.text}")
                except Exception as e:
                    print(f" [!] Error calling Email Service: {e}")
                
                ch.basic_ack(delivery_tag=method.delivery_tag)
            except Exception as e:
                print(f" [!] Error processing message: {e}")

        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

        print(' [*] Notification Service waiting for events...')
        channel.start_consuming()
    except Exception as e:
        print(f" [!] RabbitMQ Consumer Error: {e}")

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    student_id = request.args.get('student_id')
    if not student_id:
        return jsonify({"error": "Missing student_id"}), 400
    
    notifications = repo.get_notifications_by_student(student_id)
    return jsonify([n.to_dict() for n in notifications])

@app.route("/api/notifications/read/<int:notification_id>", methods=["POST"])
def mark_read(notification_id):
    success = repo.mark_as_read(notification_id)
    if success:
        return jsonify({"message": "Marked as read"}), 200
    return jsonify({"error": "Notification not found"}), 404

if __name__ == "__main__":
    # Chạy Consumer trong thread riêng
    consumer_thread = threading.Thread(target=rabbitmq_consumer, daemon=True)
    consumer_thread.start()

    # Chạy Flask ở Port 5010
    app.run(debug=True, port=5010, use_reloader=False)
