import mysql.connector
import os
from models import Notification

class NotificationRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_notification(self, student_id, title, message):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO notifications (student_id, title, message) VALUES (%s, %s, %s)"
            cursor.execute(sql, (student_id, title, message))
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def get_notifications_by_student(self, student_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "SELECT id, student_id, title, message, is_read, created_at FROM notifications WHERE student_id = %s ORDER BY created_at DESC"
            cursor.execute(sql, (student_id,))
            rows = cursor.fetchall()
            return [Notification(*row) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def mark_as_read(self, notification_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "UPDATE notifications SET is_read = TRUE WHERE id = %s"
            cursor.execute(sql, (notification_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_notification(self, notification_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "DELETE FROM notifications WHERE id = %s"
            cursor.execute(sql, (notification_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()
