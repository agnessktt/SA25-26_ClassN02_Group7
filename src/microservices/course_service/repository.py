import mysql.connector
import os
from dotenv import load_dotenv
from models import Course

from dotenv import load_dotenv

class CourseRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sgms_db')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_course(self, course):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO courses (course_code, name, credits) VALUES (%s, %s, %s)"
            cursor.execute(sql, (course.course_code, course.name, course.credits))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_course_by_code(self, code):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT course_code, name, credits FROM courses WHERE course_code = %s", (code,))
            row = cursor.fetchone()
            return Course(row[0], row[1], row[2]) if row else None
        finally:
            cursor.close()
            conn.close()

    # --- BỔ SUNG HÀM LẤY TẤT CẢ ---
    def get_all_courses(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "SELECT course_code, name, credits FROM courses"
            cursor.execute(sql)
            rows = cursor.fetchall()
            results = []
            for row in rows:
                # Chuyển đổi từng dòng SQL thành object Course
                results.append(Course(row[0], row[1], row[2]))
            return results
        finally:
            cursor.close()
            conn.close()