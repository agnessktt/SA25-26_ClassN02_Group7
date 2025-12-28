class Student:
    def __init__(self, student_id, name):
        self.student_id = student_id
        self.name = name

    def to_dict(self):
        return {"student_id": self.student_id, "name": self.name}