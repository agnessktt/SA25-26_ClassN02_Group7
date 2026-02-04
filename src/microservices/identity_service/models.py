class User:
    def __init__(self, username, password, role, email=None):
        self.username = username
        self.password = password
        self.role = role
        self.email = email

    def to_dict(self):
        return {
            "username": self.username,
            "role": self.role,
            "email": self.email
        }
