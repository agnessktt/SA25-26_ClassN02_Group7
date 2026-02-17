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
            # 1. Check if already enrolled in 'enrollments' table
            cursor.execute("SELECT enrollment_id FROM enrollments WHERE student_id = %s AND course_id = %s", (enrollment.student_id, enrollment.course_id))
            if cursor.fetchone():
                raise Exception("Sinh viên đã đăng ký học phần này rồi")

            # 2. Insert into 'enrollments' table (default status is 'pending')
            sql_enroll = "INSERT INTO enrollments (student_id, course_id, enrollment_date, status) VALUES (%s, %s, CURDATE(), 'pending')"
            cursor.execute(sql_enroll, (enrollment.student_id, enrollment.course_id))
            
            # 3. DO NOT insert into 'grade' until approved
            
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
                SELECT e.enrollment_id, e.student_id, e.course_id, c.total_credits, e.enrollment_date, e.status
                FROM enrollments e
                JOIN courses c ON e.course_id = c.course_id
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2], r[4], r[5]) # ID, Student, Course, Date, Status
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
                SELECT e.enrollment_id, e.student_id, e.course_id, c.total_credits, e.enrollment_date, e.status
                FROM enrollments e
                JOIN courses c ON e.course_id = c.course_id
                WHERE e.student_id = %s
            """
            cursor.execute(sql, (student_id,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2], r[4], r[5])
                e.credits = r[3]
                results.append(e)
            return results
        finally:
            cursor.close()
            conn.close()

    def approve_enrollment(self, enrollment_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # 1. Update status to approved
            sql_update = "UPDATE enrollments SET status = 'approved' WHERE enrollment_id = %s"
            cursor.execute(sql_update, (enrollment_id,))
            
            # 2. Get student_id and course_id to insert into grade
            cursor.execute("SELECT student_id, course_id FROM enrollments WHERE enrollment_id = %s", (enrollment_id,))
            row = cursor.fetchone()
            if row:
                student_id, course_id = row
                # Check if already in grade table to avoid duplicates
                cursor.execute("SELECT grade_id FROM grade WHERE student_id = %s AND course_id = %s", (student_id, course_id))
                if not cursor.fetchone():
                    sql_grade = "INSERT INTO grade (student_id, course_id) VALUES (%s, %s)"
                    cursor.execute(sql_grade, (student_id, course_id))
            
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def update_enrollment(self, enrollment_id, student_id, course_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # 1. Get old info from enrollments table
            cursor.execute("SELECT student_id, course_id FROM enrollments WHERE enrollment_id = %s", (enrollment_id,))
            old_data = cursor.fetchone()
            if not old_data:
                return False
            
            # 2. Update 'enrollments' table
            sql_enroll = "UPDATE enrollments SET student_id = %s, course_id = %s WHERE enrollment_id = %s"
            cursor.execute(sql_enroll, (student_id, course_id, enrollment_id))
            
            # 3. Update 'grade' table if it exists (meaning it was approved)
            sql_grade = "UPDATE grade SET student_id = %s, course_id = %s WHERE student_id = %s AND course_id = %s"
            cursor.execute(sql_grade, (student_id, course_id, old_data[0], old_data[1]))
            
            conn.commit()
            return True
        finally:
            cursor.close()
            conn.close()

    def delete_enrollment(self, enrollment_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # 1. Get info to delete
            cursor.execute("SELECT student_id, course_id FROM enrollments WHERE enrollment_id = %s", (enrollment_id,))
            data = cursor.fetchone()
            
            # 2. Delete from enrollments
            cursor.execute("DELETE FROM enrollments WHERE enrollment_id = %s", (enrollment_id,))
            
            # 3. Delete from grade if exists
            if data:
                cursor.execute("DELETE FROM grade WHERE student_id = %s AND course_id = %s", (data[0], data[1]))
            
            conn.commit()
            return True
        finally:
            cursor.close()
            conn.close()
