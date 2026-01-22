import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import Grade

# Load file .env từ thư mục gốc
load_dotenv(find_dotenv())

class GradeRepository:
    def __init__(self):
        # Cấu hình Database
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    # =========================
    # ENROLLMENT & GRADE LOGIC
    # =========================
    def add_grade(self, grade_obj: Grade):
        pass

    def update_grade(self, grade_id: int, grade_obj: Grade):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """UPDATE grade SET attendance1_score=%s, attendance2_score=%s, midterm_score=%s, 
                     final_score=%s, avg_score=%s WHERE grade_id=%s"""
            cursor.execute(sql, (grade_obj.attendance1_score, grade_obj.attendance2_score,
                                 grade_obj.midterm_score, grade_obj.final_score, grade_obj.avg_score, grade_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def get_grade_by_id(self, grade_id: int):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT g.grade_id, g.student_id, g.course_id, g.attendance1_score, g.attendance2_score, 
                       g.midterm_score, g.final_score, g.avg_score, c.total_credits
                FROM grade g
                JOIN courses c ON g.course_id = c.course_id
                WHERE g.grade_id = %s
            """
            cursor.execute(sql, (grade_id,))
            row = cursor.fetchone()
            if row:
                g = Grade(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7])
                # Note: Grade model doesn't strictly have 'credits' attribute in __init__ but we can add it dynamically or update __init__
                g.credits = row[8]
                return g
            return None
        finally:
            cursor.close()
            conn.close()

    def delete_grade(self, grade_id: int):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM grade WHERE grade_id = %s", (grade_id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_all_grades(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT g.grade_id, g.student_id, g.course_id, g.attendance1_score, g.attendance2_score, 
                       g.midterm_score, g.final_score, g.avg_score, c.total_credits
                FROM grade g
                JOIN courses c ON g.course_id = c.course_id
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            results = []
            for r in rows:
                g = Grade(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7])
                g.credits = r[8]
                results.append(g)
            return results
        finally:
            cursor.close()
            conn.close()

    def get_grades_by_student(self, student_id: str):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT g.grade_id, g.student_id, g.course_id, g.attendance1_score, g.attendance2_score, 
                       g.midterm_score, g.final_score, g.avg_score, c.total_credits
                FROM grade g
                JOIN courses c ON g.course_id = c.course_id
                WHERE g.student_id = %s
            """
            cursor.execute(sql, (student_id,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                g = Grade(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7])
                g.credits = r[8]
                results.append(g)
            return results
        finally:
            cursor.close()
            conn.close()

    def calculate_gpa_by_student(self, student_id: str):
        # Returns GPA (10-point), letter grade, and GPA (4-point)
        grades = self.get_grades_by_student(student_id)
        
        # Mặc định trả về 0 nếu chưa có điểm
        default_res = {
            "student_id": student_id, 
            "gpa": 0.0, 
            "grade": "F", 
            "gpa4": 0.0
        }

        if not grades:
            return default_res

        total_points = 0.0
        total_credits = 0
        
        for g in grades:
            # Chỉ tính những môn đã có điểm
            if g.avg_score is not None and g.credits:
                total_points += float(g.avg_score) * g.credits
                total_credits += g.credits

        if total_credits == 0:
            return default_res

        gpa10 = round(total_points / total_credits, 2)
        
        return {
            "student_id": student_id,
            "gpa": gpa10,
            "grade": Grade.convert_to_letter(gpa10), # Đổi sang chữ (A, B...)
            "gpa4": Grade.convert_to_gpa4(gpa10)     # Đổi sang hệ 4 (4.0, 3.0...)
        }
