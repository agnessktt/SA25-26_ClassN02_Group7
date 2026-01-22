from flask import Flask, request, jsonify
from repository import UserRepository
from models import User
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# CORS(app)

repo = UserRepository()

# Hỗ trợ FAKE_USERS cho trường hợp Database chưa có bảng users (Dự phòng)
# Bạn nên tạo bảng users: CREATE TABLE users (username VARCHAR(50) PK, password VARCHAR(255), role VARCHAR(50));
FAKE_USERS = {
    "admin": {"password": "123", "role": "Admin"},
    "sv01":  {"password": "123", "role": "Student"},
    "gv01":  {"password": "123", "role": "Faculty"}
}

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    try:
        # Ưu tiên dùng DB
        user = repo.validate_login(username, password)
        if user:
             return jsonify({
                "message": "Login successful",
                "token": f"fake-jwt-token-for-{username}",
                "role": user.role,
                "user": user.username
            }), 200
    except:
        # Fallback về FAKE_USERS nếu lỗi DB
        user = FAKE_USERS.get(username)
        if user and user["password"] == password:
            return jsonify({
                "message": "Login successful (Fallback)",
                "token": f"fake-jwt-token-for-{username}",
                "role": user["role"],
                "user": username
            }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

# API TẠO USER MỚI (POST)
@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json(force=True)
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "Student") # Mặc định là Student

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    try:
        # Kiểm tra tồn tại
        if repo.get_user(username):
            return jsonify({"error": "User already exists"}), 409
        
        new_user = User(username, password, role)
        repo.add_user(new_user)
        return jsonify({"message": "User created", "username": username}), 201
    except Exception as ex:
        # Fallback logic update dict
        FAKE_USERS[username] = {"password": password, "role": role}
        return jsonify({"message": "User created (Fallback)", "username": username}), 201

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
            return jsonify({"message": "User deleted (Fallback)"}), 200
            
        return jsonify({"error": "User not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5004)