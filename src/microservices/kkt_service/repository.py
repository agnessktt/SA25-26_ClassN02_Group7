import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import Kkt

# Load file .env from root
load_dotenv(find_dotenv())

class KktRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_kkt(self, kkt):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # Insert KKT info
            # We treat course_id in kkt table as optional or first course if any, 
            # but primary storage is now kkt_courses
            first_course = kkt.courses[0]['id'] if kkt.courses else kkt.course_id
            
            sql = "INSERT INTO kkt (kkt_id, kkt_name, kkt_credits, course_id) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (kkt.kkt_id, kkt.kkt_name, kkt.kkt_credits, first_course))
            
            # Insert linked courses
            if kkt.courses:
                sql_items = "INSERT INTO kkt_courses (kkt_id, course_id) VALUES (%s, %s)"
                # Prepare list of tuples
                vals = [(kkt.kkt_id, c['id']) for c in kkt.courses]
                cursor.executemany(sql_items, vals)
                
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_kkt_by_id(self, k_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT kkt_id, kkt_name, kkt_credits FROM kkt WHERE kkt_id = %s", (k_id,))
            row = cursor.fetchone()
            if not row:
                return None
                
            kid, kname, kcredits = row
            
            cursor.execute("""
                SELECT c.course_id, c.course_name 
                FROM kkt_courses kc
                JOIN courses c ON kc.course_id = c.course_id
                WHERE kc.kkt_id = %s
            """, (kid,))
            course_rows = cursor.fetchall()
            course_list = [{'id': cr[0], 'name': cr[1]} for cr in course_rows]
            
            first_c_id = course_list[0]['id'] if course_list else None
            
            return Kkt(kid, kname, kcredits, first_c_id, None, course_list)
        finally:
            cursor.close()
            conn.close()

    def get_all_kkts(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # 1. Get KKTs
            cursor.execute("SELECT kkt_id, kkt_name, kkt_credits FROM kkt")
            kkt_rows = cursor.fetchall()
            
            kkts = []
            for r in kkt_rows:
                kid, kname, kcredits = r
                
                # 2. Get Courses for this KKT
                # We Join with courses table to get names
                cursor.execute("""
                    SELECT c.course_id, c.course_name 
                    FROM kkt_courses kc
                    JOIN courses c ON kc.course_id = c.course_id
                    WHERE kc.kkt_id = %s
                """, (kid,))
                course_rows = cursor.fetchall()
                
                course_list = [{'id': cr[0], 'name': cr[1]} for cr in course_rows]
                
                # For backward compatibility or display, allow single course access if needed
                first_c_id = course_list[0]['id'] if course_list else None
                first_c_name = course_list[0]['name'] if course_list else None
                
                kkts.append(Kkt(kid, kname, kcredits, first_c_id, first_c_name, course_list))
                
            return kkts
        finally:
            cursor.close()
            conn.close()

    def update_kkt(self, kkt):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # Update main info
            # We ignore course_id column in kkt table now
            sql = "UPDATE kkt SET kkt_name = %s, kkt_credits = %s WHERE kkt_id = %s"
            cursor.execute(sql, (kkt.kkt_name, kkt.kkt_credits, kkt.kkt_id))
            
            # Update courses: Delete all then re-insert
            cursor.execute("DELETE FROM kkt_courses WHERE kkt_id = %s", (kkt.kkt_id,))
            
            if kkt.courses:
                sql_items = "INSERT INTO kkt_courses (kkt_id, course_id) VALUES (%s, %s)"
                vals = [(kkt.kkt_id, c['id']) for c in kkt.courses]
                cursor.executemany(sql_items, vals)
                
            conn.commit()
            return True
        except Exception as e:
            print(e)
            return False
        finally:
            cursor.close()
            conn.close()

    def delete_kkt(self, k_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM kkt_courses WHERE kkt_id = %s", (k_id,))
            cursor.execute("DELETE FROM kkt WHERE kkt_id = %s", (k_id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_all_courses(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT course_id, course_name FROM courses")
            rows = cursor.fetchall()
            return [{'id': row[0], 'name': row[1]} for row in rows]
        finally:
            cursor.close()
            conn.close()
