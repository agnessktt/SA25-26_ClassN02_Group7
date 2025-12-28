import mysql.connector
import os
from dotenv import load_dotenv
from models import Enrollment

# Load file .env từ thư mục gốc
load_dotenv()

class EnrollmentRepository:
    def __init__(self):
        # Cấu hình Database
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sgms_db')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    # =========================
    # ENROLLMENT & GRADE LOGIC
    # =========================
    def add_enrollment(self, enrollment: Enrollment):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO enrollments (student_id, course_code, grade) VALUES (%s, %s, %s)"
            cursor.execute(sql, (enrollment.student_id, enrollment.course_code, enrollment.grade))
            conn.commit()
            return cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

    def update_grade(self, enrollment_id: int, grade: float):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE enrollments SET grade = %s WHERE enrollment_id = %s", (grade, enrollment_id))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_enrollment_by_id(self, e_id: int):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # JOIN để lấy credits phục vụ hiển thị
            sql = """
                SELECT e.enrollment_id, e.student_id, e.course_code, e.grade, c.credits
                FROM enrollments e
                JOIN courses c ON e.course_code = c.course_code
                WHERE e.enrollment_id = %s
            """
            cursor.execute(sql, (e_id,))
            row = cursor.fetchone()
            if row:
                e = Enrollment(row[0], row[1], row[2], row[3])
                e.credits = row[4]
                return e
            return None
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

    def get_all_enrollments(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT e.enrollment_id, e.student_id, e.course_code, e.grade, c.credits
                FROM enrollments e
                JOIN courses c ON e.course_code = c.course_code
                ORDER BY e.student_id ASC, e.course_code ASC
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2], r[3])
                e.credits = r[4]
                results.append(e)
            return results
        finally:
            cursor.close()
            conn.close()

    def get_enrollments_by_student(self, student_id: str):
        # Hàm này hỗ trợ lấy danh sách điểm của SV
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT e.enrollment_id, e.student_id, e.course_code, e.grade, c.credits
                FROM enrollments e
                JOIN courses c ON e.course_code = c.course_code
                WHERE e.student_id = %s
            """
            cursor.execute(sql, (student_id,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                e = Enrollment(r[0], r[1], r[2], r[3])
                e.credits = r[4]
                results.append(e)
            return results
        finally:
            cursor.close()
            conn.close()

    def calculate_gpa_by_student(self, student_id: str):
        # Returns GPA (10-point), letter grade, and GPA (4-point)
        enrollments = self.get_enrollments_by_student(student_id)
        
        # Mặc định trả về 0 nếu chưa có điểm
        default_res = {
            "student_id": student_id, 
            "gpa": 0.0, 
            "grade": "F", 
            "gpa4": 0.0
        }

        if not enrollments:
            return default_res

        total_points = 0.0
        total_credits = 0
        
        for e in enrollments:
            # Chỉ tính những môn đã có điểm
            if e.grade is not None and e.credits:
                total_points += e.grade * e.credits
                total_credits += e.credits

        if total_credits == 0:
            return default_res

        gpa10 = round(total_points / total_credits, 2)
        
        return {
            "student_id": student_id,
            "gpa": gpa10,
            "grade": Enrollment.convert_to_letter(gpa10), # Đổi sang chữ (A, B...)
            "gpa4": Enrollment.convert_to_gpa4(gpa10)     # Đổi sang hệ 4 (4.0, 3.0...)
        }