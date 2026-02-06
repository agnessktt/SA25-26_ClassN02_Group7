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

            # 2. Insert into 'enrollments' table
            sql_enroll = "INSERT INTO enrollments (student_id, course_id, enrollment_date) VALUES (%s, %s, CURDATE())"
            cursor.execute(sql_enroll, (enrollment.student_id, enrollment.course_id))
            
            # 3. ALSO Insert into 'grade' table to ensure visibility in Grade Service
            sql_grade = "INSERT INTO grade (student_id, course_id) VALUES (%s, %s)"
            cursor.execute(sql_grade, (enrollment.student_id, enrollment.course_id))
            
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
                SELECT g.grade_id, g.student_id, g.course_id, c.total_credits, e.enrollment_date
                FROM grade g
                JOIN courses c ON g.course_id = c.course_id
                LEFT JOIN enrollments e ON g.student_id = e.student_id AND g.course_id = e.course_id
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2], r[4]) # ID, Student, Course, Date
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
                SELECT g.grade_id, g.student_id, g.course_id, c.total_credits, e.enrollment_date
                FROM grade g
                JOIN courses c ON g.course_id = c.course_id
                LEFT JOIN enrollments e ON g.student_id = e.student_id AND g.course_id = e.course_id
                WHERE g.student_id = %s
            """
            cursor.execute(sql, (student_id,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2], r[4])
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
            # 1. Get old info to update 'enrollments' table
            cursor.execute("SELECT student_id, course_id FROM grade WHERE grade_id = %s", (enrollment_id,))
            old_data = cursor.fetchone()
            
            # 2. Update 'grade' table
            sql_grade = "UPDATE grade SET student_id = %s, course_id = %s WHERE grade_id = %s"
            cursor.execute(sql_grade, (student_id, course_id, enrollment_id))
            
            # 3. Update 'enrollments' table if old data exists
            if old_data:
                sql_enroll = "UPDATE enrollments SET student_id = %s, course_id = %s WHERE student_id = %s AND course_id = %s"
                cursor.execute(sql_enroll, (student_id, course_id, old_data[0], old_data[1]))
            
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_enrollment(self, e_id: int):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # 1. Get info to delete from 'enrollments' table
            cursor.execute("SELECT student_id, course_id FROM grade WHERE grade_id = %s", (e_id,))
            data = cursor.fetchone()
            
            # 2. Delete from 'grade' table
            cursor.execute("DELETE FROM grade WHERE grade_id = %s", (e_id,))
            
            # 3. Delete from 'enrollments' table if data exists
            if data:
                cursor.execute("DELETE FROM enrollments WHERE student_id = %s AND course_id = %s", (data[0], data[1]))
                
            conn.commit()
            return True
        finally:
            cursor.close()
            conn.close()
