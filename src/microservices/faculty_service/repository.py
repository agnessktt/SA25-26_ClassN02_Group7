import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import Faculty

# Load file .env from root
load_dotenv(find_dotenv())

class FacultyRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_faculty(self, faculty):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO faculty (fac_id, fac_name, fac_address, fac_email, fac_number, mem_school_id) VALUES (%s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (faculty.fac_id, faculty.fac_name, faculty.fac_address, faculty.fac_email, faculty.fac_number, faculty.mem_school_id))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_faculty_by_id(self, f_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT fac_id, fac_name, fac_address, fac_email, fac_number, mem_school_id FROM faculty WHERE fac_id = %s", (f_id,))
            row = cursor.fetchone()
            return Faculty(row[0], row[1], row[2], row[3], row[4], row[5]) if row else None
        finally:
            cursor.close()
            conn.close()

    def get_all_faculties(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT f.fac_id, f.fac_name, f.fac_address, f.fac_email, f.fac_number, f.mem_school_id, u.mem_school_name 
                FROM faculty f
                LEFT JOIN uni u ON f.mem_school_id = u.mem_school_id
            """
            cursor.execute(sql)
            rows = cursor.fetchall()
            return [Faculty(row[0], row[1], row[2], row[3], row[4], row[5], row[6]) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def update_faculty(self, faculty):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "UPDATE faculty SET fac_name = %s, fac_address = %s, fac_email = %s, fac_number = %s, mem_school_id = %s WHERE fac_id = %s"
            cursor.execute(sql, (faculty.fac_name, faculty.fac_address, faculty.fac_email, faculty.fac_number, faculty.mem_school_id, faculty.fac_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_faculty(self, f_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM faculty WHERE fac_id = %s", (f_id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_all_schools(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT mem_school_id, mem_school_name, mem_school_websit FROM uni")
            rows = cursor.fetchall()
            return [{'id': row[0], 'name': row[1], 'website': row[2]} for row in rows]
        finally:
            cursor.close()
            conn.close()

    def get_faculties_by_school(self, school_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = """
                SELECT f.fac_id, f.fac_name, f.fac_address, f.fac_email, f.fac_number, f.mem_school_id, u.mem_school_name 
                FROM faculty f
                LEFT JOIN uni u ON f.mem_school_id = u.mem_school_id
                WHERE f.mem_school_id = %s
            """
            cursor.execute(sql, (school_id,))
            rows = cursor.fetchall()
            return [Faculty(row[0], row[1], row[2], row[3], row[4], row[5], row[6]) for row in rows]
        finally:
            cursor.close()
            conn.close()
