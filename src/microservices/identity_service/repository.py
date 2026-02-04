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
            'host': os.getenv('DB_HOST', '127.0.0.1'),
            'database': os.getenv('DB_NAME', 'sa')
        }
        self._init_db()

    def _get_conn(self):
        return mysql.connector.connect(**self.db_config)

    def _init_db(self):
        """Khởi tạo bảng user nếu chưa tồn tại"""
        try:
            conn = self._get_conn()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user (
                    username VARCHAR(50) PRIMARY KEY,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    email VARCHAR(100)
                )
            """)
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Warning: Could not initialize database table: {e}")

    def get_user(self, username):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # Check by username or email
            sql = "SELECT username, password, role, email FROM user WHERE username = %s OR email = %s"
            cursor.execute(sql, (username, username))
            row = cursor.fetchone()
            if row:
                return User(row[0], row[1], row[2], row[3])
            return None
        finally:
            cursor.close()
            conn.close()

    def validate_login(self, identifier, password):
        user = self.get_user(identifier)
        if user and str(user.password) == str(password):
            return user
        return None

    def add_user(self, user):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            # Assume email column exists.
            sql = "INSERT INTO user (username, password, role, email) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (user.username, user.password, user.role, user.email))
            conn.commit()
            return True
        except mysql.connector.Error as err:
            if err.errno == 1054: # Column 'email' not found if table existed without it
                sql = "INSERT INTO user (username, password, role) VALUES (%s, %s, %s)"
                cursor.execute(sql, (user.username, user.password, user.role))
                conn.commit()
                return True
            raise err
        finally:
            cursor.close()
            conn.close()

    def update_user(self, username, password=None, role=None, email=None):
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
            if email:
                updates.append("email = %s")
                params.append(email)
            
            if not updates:
                return False

            sql = f"UPDATE user SET {', '.join(updates)} WHERE username = %s"
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
            sql = "DELETE FROM user WHERE username = %s"
            cursor.execute(sql, (username,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conn.close()

    def get_all_users(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT username, role, email FROM user")
            rows = cursor.fetchall()
            return [{"username": row[0], "role": row[1], "email": row[2]} for row in rows]
        finally:
            cursor.close()
            conn.close()
