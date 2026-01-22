import mysql.connector
import os
from dotenv import load_dotenv, find_dotenv
from models import User

load_dotenv(find_dotenv())

class UserRepository:
    def __init__(self):
        self.db_config = {
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Tienquynh!1312'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'sa')
        }

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def get_user(self, username):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "SELECT username, password, role FROM users WHERE username = %s"
            cursor.execute(sql, (username,))
            row = cursor.fetchone()
            if row:
                return User(row[0], row[1], row[2])
            return None
        finally:
            cursor.close()
            conn.close()

    def validate_login(self, username, password):
        user = self.get_user(username)
        if user and user.password == password:
            return user
        return None

    def add_user(self, user):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)"
            cursor.execute(sql, (user.username, user.password, user.role))
            conn.commit()
            return True
        finally:
            cursor.close()
            conn.close()

    def update_user(self, username, password=None, role=None):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # Xây dựng câu query động
            updates = []
            params = []
            if password:
                updates.append("password = %s")
                params.append(password)
            if role:
                updates.append("role = %s")
                params.append(role)
            
            if not updates:
                return False

            sql = f"UPDATE users SET {', '.join(updates)} WHERE username = %s"
            params.append(username)
            
            cursor.execute(sql, tuple(params))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def delete_user(self, username):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            sql = "DELETE FROM users WHERE username = %s"
            cursor.execute(sql, (username,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()
