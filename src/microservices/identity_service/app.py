import json
import os
from flask import Flask, request, jsonify
from repository import UserRepository
from models import User
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

repo = UserRepository()

# Hỗ trợ FAKE_USERS cho trường hợp Database chưa có bảng user (Dự phòng)
# Bạn nên tạo bảng user: CREATE TABLE user (username VARCHAR(50) PRIMARY KEY, password VARCHAR(255), role VARCHAR(50), email VARCHAR(100));
FALLBACK_FILE = os.path.join(os.path.dirname(__file__), "users_fallback.json")

def load_fallback_users():
    if os.path.exists(FALLBACK_FILE):
        try:
            with open(FALLBACK_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {
        "admin": {"password": "123", "role": "Admin"},
        "gv01":  {"password": "123", "role": "Faculty"}
    }

def save_fallback_users(users):
    try:
        with open(FALLBACK_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=4)
    except Exception as e:
        print(f"Error saving fallback users: {e}")

FAKE_USERS = load_fallback_users()

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "Identity Service is running", "db_fallback": True}), 200

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    # 1. Thử xác thực qua Database
    try:
        user = repo.validate_login(username, password)
        if user:
             return jsonify({
                "message": "Login successful",
                "token": f"fake-jwt-token-for-{user.username}",
                "role": user.role,
                "user": user.username,
                "email": user.email
            }), 200
    except Exception as e:
        print(f"DB Error: {e}")
        # Chờ fallback xuống FAKE_USERS
        pass

    # 2. Fallback về FAKE_USERS (Nếu không thấy trong DB hoặc lỗi DB)
    user_match = None
    username_lower = username.lower()
    
    # Check by key (username)
    if username_lower in FAKE_USERS:
        user_match = FAKE_USERS[username_lower]
        user_id = username_lower
    else:
        # Check by email field inside FAKE_USERS
        for uid, udata in FAKE_USERS.items():
            if udata.get("email") == username_lower:
                user_match = udata
                user_id = uid
                break
    
    if user_match and str(user_match["password"]) == str(password):
        print(f"Login success via Fallback: {user_id}")
        return jsonify({
            "message": "Login successful (Fallback)",
            "token": f"fake-jwt-token-for-{user_id}",
            "role": user_match["role"],
            "user": user_id,
            "email": user_match.get("email")
        }), 200
    
    print(f"Login failed: {username}")
    return jsonify({"error": "Invalid credentials"}), 401

# API LẤY TẤT CẢ USER
@app.route("/api/users", methods=["GET"])
def get_users():
    try:
        users = repo.get_all_users()
        # Mix with FAKE_USERS for local dev consistency
        all_users = users + [{"username": k, "role": v["role"], "email": v.get("email")} for k, v in FAKE_USERS.items()]
        return jsonify(all_users), 200
    except Exception as e:
        return jsonify([{"username": k, "role": v["role"], "email": v.get("email")} for k, v in FAKE_USERS.items()]), 200

# API TẠO USER MỚI (POST)
@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")
    role = data.get("role", "Student") # Mặc định là Student

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    try:
        # Kiểm tra tồn tại
        if repo.get_user(username) or (email and repo.get_user(email)):
            return jsonify({"error": "User already exists"}), 409
        
        new_user = User(username, password, role, email)
        repo.add_user(new_user)
        return jsonify({"message": "User created", "username": username}), 201
    except Exception as ex:
        # Fallback logic update dict and SAVE TO FILE for persistent fallback
        print(f"Registration DB Error: {ex}. Falling back to persistent storage.")
        FAKE_USERS[username] = {"password": password, "role": role, "email": email}
        save_fallback_users(FAKE_USERS)
        return jsonify({"message": "User created (Persistent Fallback)", "username": username}), 201

# API GET / UPDATE / DELETE USER
@app.route("/api/users/<username>", methods=["GET", "PUT", "DELETE"])
def user_ops(username):
    # --- GET ---
    if request.method == "GET":
        try:
            user = repo.get_user(username)
            if user:
                return jsonify(user.to_dict())
        except:
             pass
        
        # Fallback
        user = FAKE_USERS.get(username)
        if user:
            return jsonify({"username": username, "role": user["role"]})
        return jsonify({"error": "User not found"}), 404

    # --- PUT ---
    if request.method == "PUT":
        data = request.get_json(force=True)
        password = data.get("password")
        role = data.get("role")
        
        try:
            success = repo.update_user(username, password, role)
            if success:
                 return jsonify({"message": "User updated"}), 200
        except:
             pass

        # Fallback
        user = FAKE_USERS.get(username)
        if user:
            if password: user["password"] = password
            if role: user["role"] = role
            save_fallback_users(FAKE_USERS)
            return jsonify({"message": "User updated (Fallback)"}), 200
            
        return jsonify({"error": "User not found or DB Error"}), 404

    # --- DELETE ---
    if request.method == "DELETE":
        try:
            success = repo.delete_user(username)
            if success:
                return jsonify({"message": "User deleted"}), 200
        except:
             pass
        
        # Fallback
        if username in FAKE_USERS:
            del FAKE_USERS[username]
            save_fallback_users(FAKE_USERS)
            return jsonify({"message": "User deleted (Fallback)"}), 200
            
        return jsonify({"error": "User not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5004)