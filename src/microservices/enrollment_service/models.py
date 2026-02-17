class Enrollment:
    def __init__(self, enrollment_id, student_id, course_id, enrollment_date=None, status="pending"):
        self.enrollment_id = enrollment_id
        self.student_id = student_id
        self.course_id = course_id
        self.enrollment_date = enrollment_date
        self.status = status
        
    def to_dict(self):
        return {
            "enrollment_id": self.enrollment_id,
            "student_id": self.student_id,
            "course_id": self.course_id,
            "enrollment_date": str(self.enrollment_date) if self.enrollment_date else None,
            "status": self.status
        }
