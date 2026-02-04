import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import Major, KnowledgeBlock

# Load file .env from root
load_dotenv(find_dotenv())

class MajorRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_major(self, major, courses=None):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO major (major_id, major_name, major_credits, fac_id) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (major.major_id, major.major_name, major.major_credits, major.fac_id))
            
            if courses:
                course_sql = "INSERT INTO major_knowledge_block_courses (major_id, block_type, course_id, course_name, course_credits) VALUES (%s, %s, %s, %s, %s)"
                for c in courses:
                    cursor.execute(course_sql, (
                        major.major_id,
                        c.get('block_type'),
                        c.get('course_id'),
                        c.get('course_name'),
                        c.get('course_credits', 0)
                    ))
            
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_major_by_id(self, m_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT major_id, major_name, major_credits, fac_id FROM major WHERE major_id = %s", (m_id,))
            row = cursor.fetchone()
            return Major(row[0], row[1], row[2], row[3]) if row else None
        finally:
            cursor.close()
            conn.close()

    def get_all_majors(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT m.major_id, m.major_name, m.major_credits, m.fac_id, f.fac_name 
                FROM major m
                LEFT JOIN faculty f ON m.fac_id = f.fac_id
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            return [Major(row[0], row[1], row[2], row[3], row[4]) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def update_major(self, major, courses=None):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "UPDATE major SET major_name = %s, major_credits = %s, fac_id = %s WHERE major_id = %s"
            cursor.execute(sql, (major.major_name, major.major_credits, major.fac_id, major.major_id))
            
            # Cập nhật courses nếu có
            if courses is not None:
                # Xóa các course cũ
                cursor.execute("DELETE FROM major_knowledge_block_courses WHERE major_id = %s", (major.major_id,))
                # Thêm course mới
                if courses:
                    course_sql = "INSERT INTO major_knowledge_block_courses (major_id, block_type, course_id, course_name, course_credits) VALUES (%s, %s, %s, %s, %s)"
                    for c in courses:
                        cursor.execute(course_sql, (
                            major.major_id,
                            c.get('block_type'),
                            c.get('course_id'),
                            c.get('course_name'),
                            c.get('course_credits', 0)
                        ))
            
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_major(self, m_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM major WHERE major_id = %s", (m_id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_all_faculties(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT fac_id, fac_name FROM faculty")
            rows = cursor.fetchall()
            return [{'id': row[0], 'name': row[1]} for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_majors_by_faculty(self, fac_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT m.major_id, m.major_name, m.major_credits, m.fac_id, f.fac_name
                FROM major m
                LEFT JOIN faculty f ON m.fac_id = f.fac_id
                WHERE m.fac_id = %s
            """
            cursor.execute(sql, (fac_id,))
            rows = cursor.fetchall()
            return [Major(row[0], row[1], row[2], row[3], row[4]) for row in rows]
        finally:
            cursor.close()
            conn.close()
    # Methods for Knowledge Blocks
    def add_course_to_knowledge_block(self, major_id, block_type, course_id, course_name, course_credits):
        """Thêm học phần vào khối kiến thức"""
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                INSERT INTO major_knowledge_block_courses (major_id, block_type, course_id, course_name, course_credits)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (major_id, block_type, course_id, course_name, course_credits))
            
            # Update total credits in major table for consistency (COALESCE to handle 0 courses)
            cursor.execute("UPDATE major SET major_credits = (SELECT COALESCE(SUM(course_credits), 0) FROM major_knowledge_block_courses WHERE major_id = %s) WHERE major_id = %s", (major_id, major_id))
            
            conn.commit()
            return True
        except Exception as e:
            print(f"Error adding course to knowledge block: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def get_courses_by_knowledge_block(self, major_id, block_type):
        """Lấy danh sách học phần trong khối kiến thức"""
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT course_id, course_name, course_credits
                FROM major_knowledge_block_courses
                WHERE major_id = %s AND block_type = %s
            """
            cursor.execute(sql, (major_id, block_type))
            rows = cursor.fetchall()
            return [
                {
                    'course_id': row[0],
                    'course_name': row[1],
                    'course_credits': row[2]
                }
                for row in rows
            ]
        finally:
            cursor.close()
            conn.close()

    def get_all_courses_by_major(self, major_id):
        """Lấy tất cả học phần theo ngành học"""
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT block_type, course_id, course_name, course_credits
                FROM major_knowledge_block_courses
                WHERE major_id = %s
                ORDER BY block_type, course_id
            """
            cursor.execute(sql, (major_id,))
            rows = cursor.fetchall()
            
            # Organize by knowledge blocks
            knowledge_blocks = {
                'cso_nganh': [],
                'bo_tro': [],
                'giao_duc_dai_cuong': [],
                'chuyen_nganh': [],
                'thuc_tap': []
            }
            
            total_credits = 0
            for row in rows:
                block_type, course_id, course_name, course_credits = row
                knowledge_blocks[block_type].append({
                    'course_id': course_id,
                    'course_name': course_name,
                    'course_credits': course_credits
                })
                total_credits += course_credits
            
            return {
                'knowledge_blocks': knowledge_blocks,
                'total_credits': total_credits
            }
        finally:
            cursor.close()
            conn.close()

    def remove_course_from_knowledge_block(self, major_id, block_type, course_id):
        """Xóa học phần khỏi khối kiến thức"""
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                DELETE FROM major_knowledge_block_courses
                WHERE major_id = %s AND block_type = %s AND course_id = %s
            """
            cursor.execute(sql, (major_id, block_type, course_id))
            
            # Update total credits in major table for consistency (COALESCE to handle 0 courses)
            cursor.execute("UPDATE major SET major_credits = (SELECT COALESCE(SUM(course_credits), 0) FROM major_knowledge_block_courses WHERE major_id = %s) WHERE major_id = %s", (major_id, major_id))
            
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def get_total_credits_by_major(self, major_id):
        """Tính tổng tín chỉ của ngành học"""
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT SUM(course_credits)
                FROM major_knowledge_block_courses
                WHERE major_id = %s
            """
            cursor.execute(sql, (major_id,))
            row = cursor.fetchone()
            return row[0] if row and row[0] else 0
        finally:
            cursor.close()
            conn.close()