import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import Uni

# Load file .env from root
load_dotenv(find_dotenv())

class UniRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def add_uni(self, uni):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO uni (mem_school_id, mem_school_name, mem_school_website, fanpage) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (uni.mem_school_id, uni.mem_school_name, uni.mem_school_website, uni.fanpage))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    def get_uni_by_id(self, u_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT mem_school_id, mem_school_name, mem_school_website, fanpage FROM uni WHERE mem_school_id = %s", (u_id,))
            row = cursor.fetchone()
            return Uni(row[0], row[1], row[2], row[3]) if row else None
        finally:
            cursor.close()
            conn.close()

    def get_all_unis(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT mem_school_id, mem_school_name, mem_school_website, fanpage FROM uni")
            rows = cursor.fetchall()
            return [Uni(row[0], row[1], row[2], row[3]) for row in rows]
        finally:
            cursor.close()
            conn.close()

    def update_uni(self, uni):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "UPDATE uni SET mem_school_name = %s, mem_school_website = %s, fanpage = %s WHERE mem_school_id = %s"
            cursor.execute(sql, (uni.mem_school_name, uni.mem_school_website, uni.fanpage, uni.mem_school_id))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_uni(self, u_id):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM uni WHERE mem_school_id = %s", (u_id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()
