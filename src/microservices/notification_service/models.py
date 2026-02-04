class Notification:
    def __init__(self, id=None, student_id=None, title=None, message=None, is_read=False, created_at=None):
        self.id = id
        self.student_id = student_id
        self.title = title
        self.message = message
        self.is_read = is_read
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "title": self.title,
            "message": self.message,
            "is_read": bool(self.is_read),
            "created_at": str(self.created_at) if self.created_at else None
        }
