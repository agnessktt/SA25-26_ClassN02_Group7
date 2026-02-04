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
            sql = "INSERT INTO kkt (kkt_id, kkt_name, kkt_credits) VALUES (%s, %s, %s)"
            cursor.execute(sql, (kkt.kkt_id, kkt.kkt_name, kkt.kkt_credits))
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
            return Kkt(row[0], row[1], row[2])
        finally:
            cursor.close()
            conn.close()

    def get_all_kkts(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT kkt_id, kkt_name, kkt_credits FROM kkt")
            rows = cursor.fetchall()
            return [Kkt(row[0], row[1], row[2]) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def update_kkt(self, kkt_id, kkt):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "UPDATE kkt SET kkt_name = %s, kkt_credits = %s WHERE kkt_id = %s"
            cursor.execute(sql, (kkt.kkt_name, kkt.kkt_credits, kkt_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_kkt(self, k_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM kkt WHERE kkt_id = %s", (k_id,))
            conn.commit()
            return cursor.rowcount > 0
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
