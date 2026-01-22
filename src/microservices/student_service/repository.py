import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import Student

# Load file .env từ thư mục gốc
load_dotenv(find_dotenv())

class StudentRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_student(self, student):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO students (student_id, student_name, date_of_birth, gender, student_class, student_email, cohort) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (student.student_id, student.student_name, student.date_of_birth, student.gender, student.student_class, student.student_email, student.cohort))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_student_by_id(self, s_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT student_id, student_name, date_of_birth, gender, student_class, student_email, cohort FROM students WHERE student_id = %s", (s_id,))
            row = cursor.fetchone()
            return Student(row[0], row[1], row[2], row[3], row[4], row[5], row[6]) if row else None
        finally:
            cursor.close()
            conn.close()

    def get_all_students(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT student_id, student_name, date_of_birth, gender, student_class, student_email, cohort FROM students")
            rows = cursor.fetchall()
            return [Student(row[0], row[1], row[2], row[3], row[4], row[5], row[6]) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def update_student(self, student):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "UPDATE students SET student_name = %s, date_of_birth = %s, gender = %s, student_class = %s, student_email = %s, cohort = %s WHERE student_id = %s"
            cursor.execute(sql, (student.student_name, student.date_of_birth, student.gender, student.student_class, student.student_email, student.cohort, student.student_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_student(self, s_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM students WHERE student_id = %s", (s_id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()