from src.arch.models import Enrollment

_enrollment_db = {}
_next_id = 1

class EnrollmentRepository:
    def create(self, student_id, course_code):
        global _next_id
        enrollment = Enrollment(_next_id, student_id, course_code)
        _enrollment_db[_next_id] = enrollment
        _next_id += 1
        return enrollment

    def find_all(self):
        return list(_enrollment_db.values())

    def update_grade(self, enrollment_id, grade):
        enrollment = _enrollment_db.get(enrollment_id)
        if enrollment:
            enrollment.grade = grade
            return enrollment
        return None

    def delete(self, enrollment_id):
        return _enrollment_db.pop(enrollment_id, None)
