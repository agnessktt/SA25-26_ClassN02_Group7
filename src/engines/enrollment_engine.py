from src.arch.repository import EnrollmentRepository

class EnrollmentEngine:
    def __init__(self):
        self.repo = EnrollmentRepository()

    def enroll_student(self, student_id, course_code):
        if not student_id or not course_code:
            raise ValueError("Student ID and Course Code are required.")
        return self.repo.create(student_id, course_code)

    def get_all_enrollments(self):
        return self.repo.find_all()

    def assign_grade(self, enrollment_id, grade):
        if grade < 0 or grade > 4:
            raise ValueError("Grade must be between 0 and 4.")
        enrollment = self.repo.update_grade(enrollment_id, grade)
        if not enrollment:
            raise ValueError("Enrollment not found.")
        return enrollment

    def remove_enrollment(self, enrollment_id):
        if not self.repo.delete(enrollment_id):
            raise ValueError("Enrollment not found.")
