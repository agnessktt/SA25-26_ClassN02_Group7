class Enrollment:
    def __init__(self, enrollment_id, student_id, course_code, grade=None):
        self.enrollment_id = enrollment_id
        self.student_id = student_id
        self.course_code = course_code
        self.grade = grade

    def to_dict(self):
        return {
            "enrollment_id": self.enrollment_id,
            "student_id": self.student_id,
            "course_code": self.course_code,
            "grade": self.grade
        }
