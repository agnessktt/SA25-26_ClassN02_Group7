import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import Course

load_dotenv(find_dotenv())

class CourseRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_course(self, course):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """INSERT INTO courses (course_id, course_name, total_credits, theory_credits, practical_credits, prerequisite, co_requisite, previous) 
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql, (course.course_id, course.course_name, course.total_credits, course.theory_credits, 
                                 course.practical_credits, course.prerequisite, course.co_requisite, course.previous))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_course_by_id(self, course_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """SELECT course_id, course_name, total_credits, theory_credits, practical_credits, prerequisite, co_requisite, previous 
                     FROM courses WHERE course_id = %s"""
            cursor.execute(sql, (course_id,))
            row = cursor.fetchone()
            if row:
                return Course(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7])
            return None
        finally:
            cursor.close()
            conn.close()

    # --- BỔ SUNG HÀM LẤY TẤT CẢ ---
    def get_all_courses(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "SELECT course_id, course_name, total_credits, theory_credits, practical_credits, prerequisite, co_requisite, previous FROM courses"
            cursor.execute(sql)
            rows = cursor.fetchall()
            results = []
            for row in rows:
                results.append(Course(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]))
            return results
        finally:
            cursor.close()
            conn.close()

    def update_course(self, course_id, course):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """UPDATE courses SET course_name = %s, total_credits = %s, theory_credits = %s, 
                     practical_credits = %s, prerequisite = %s, co_requisite = %s, previous = %s 
                     WHERE course_id = %s"""
            cursor.execute(sql, (course.course_name, course.total_credits, course.theory_credits,
                                 course.practical_credits, course.prerequisite, course.co_requisite,
                                 course.previous, course_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_course(self, course_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "DELETE FROM courses WHERE course_id = %s"
            cursor.execute(sql, (course_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()
