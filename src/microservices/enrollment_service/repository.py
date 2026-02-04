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
            # 1. Check if already enrolled
            cursor.execute("SELECT grade_id FROM grade WHERE student_id = %s AND course_id = %s", (enrollment.student_id, enrollment.course_id))
            if cursor.fetchone():
                raise Exception("Sinh viên đã đăng ký học phần này rồi")

            # 2. Insert into 'grade' table
            sql = "INSERT INTO grade (student_id, course_id) VALUES (%s, %s)"
            cursor.execute(sql, (enrollment.student_id, enrollment.course_id))
            conn.commit()
            return cursor.lastrowid
        except mysql.connector.Error as err:
            if err.errno == 1452: # Foreign key constraint fails
                raise Exception("Mã sinh viên hoặc Mã học phần không tồn tại trong hệ thống")
            raise err
        finally:
            cursor.close()
            conn.close()

    def get_all_enrollments(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT g.grade_id, g.student_id, g.course_id, c.total_credits
                FROM grade g
                JOIN courses c ON g.course_id = c.course_id
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2]) # ID, Student, Course
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
                SELECT g.grade_id, g.student_id, g.course_id, c.total_credits
                FROM grade g
                JOIN courses c ON g.course_id = c.course_id
                WHERE g.student_id = %s
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
            sql = "UPDATE grade SET student_id = %s, course_id = %s WHERE grade_id = %s"
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
            cursor.execute("DELETE FROM grade WHERE grade_id = %s", (e_id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()
