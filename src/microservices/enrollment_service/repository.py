import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import Enrollment

load_dotenv(find_dotenv())

class EnrollmentRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_enrollment(self, enrollment: Enrollment):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO enrollments (student_id, course_id) VALUES (%s, %s)"
            cursor.execute(sql, (enrollment.student_id, enrollment.course_id))
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def get_all_enrollments(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT e.enrollment_id, e.student_id, e.course_id, c.total_credits
                FROM enrollments e
                JOIN courses c ON e.course_id = c.course_id
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2])
                e.credits = r[3]
                results.append(e)
            return results
        finally:
            cursor.close()
            conn.close()

    def get_enrollments_by_student(self, student_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT e.enrollment_id, e.student_id, e.course_id, c.total_credits
                FROM enrollments e
                JOIN courses c ON e.course_id = c.course_id
                WHERE e.student_id = %s
            """
            cursor.execute(sql, (student_id,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2])
                e.credits = r[3]
                results.append(e)
            return results
        finally:
            cursor.close()
            conn.close()

    def update_enrollment(self, enrollment_id, student_id, course_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "UPDATE enrollments SET student_id = %s, course_id = %s WHERE enrollment_id = %s"
            cursor.execute(sql, (student_id, course_id, enrollment_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_enrollment(self, e_id: int):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM enrollments WHERE enrollment_id = %s", (e_id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()
