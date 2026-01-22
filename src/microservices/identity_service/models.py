class User:
    def __init__(self, username, password, role):
        self.username = username
        self.password = password
        self.role = role

    def to_dict(self):
        return {
            "username": self.username,
            "role": self.role
            # Password thường không trả về, hoặc trả về tùy logic
        }
