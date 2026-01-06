from flask import Flask, request, jsonify

app = Flask(__name__)

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

    # Kiểm tra user giả
    user = FAKE_USERS.get(username)
    if user and user["password"] == password:
        # Trả về token giả và role
        return jsonify({
            "message": "Login successful",
            "token": f"fake-jwt-token-for-{username}",
            "role": user["role"],
            "user": username
        }), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/users/<username>", methods=["GET"])
def get_user_role(username):
    user = FAKE_USERS.get(username)
    if user:
        return jsonify({"username": username, "role": user["role"]})
    return jsonify({"error": "User not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5004)