import mysql.connector
import os
from dotenv import load_dotenv
from models import Student

# Load file .env từ thư mục gốc
from dotenv import load_dotenv

class StudentRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sgms_db')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_student(self, student):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO students (student_id, name) VALUES (%s, %s)"
            cursor.execute(sql, (student.student_id, student.name))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_student_by_id(self, s_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT student_id, name FROM students WHERE student_id = %s", (s_id,))
            row = cursor.fetchone()
            return Student(row[0], row[1]) if row else None
        finally:
            cursor.close()
            conn.close()