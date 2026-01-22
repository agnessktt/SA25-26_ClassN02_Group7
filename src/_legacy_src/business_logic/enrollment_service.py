# File: src/_legacy_src/business_logic/enrollment_service.py

from src._legacy_src.persistence.repository import Repository
from src._legacy_src.business_logic.models import Student, Course, Enrollment


class EnrollmentService: 
    def __init__(self):
        self.repo = Repository()

    # --- ADMIN ---
    def create_student(self, student_id, name):
        if not student_id or not name:
            raise ValueError("Student ID and Name are required")
        student = Student(student_id, name)
        self.repo.add_student(student)
        return student.to_dict()

    def create_course(self, course_code, name, credits):
        if not course_code or not name:
            raise ValueError("Course Code and Name are required")
        if credits is None or int(credits) <= 0:
            raise ValueError("Credits must be a positive integer")
        course = Course(course_code, name, int(credits))
        self.repo.add_course(course)
        return course.to_dict()

    # --- USER ---
    def enroll_student(self, student_id, course_code):
        # validate existence
        if not self.repo.get_student_by_id(student_id):
            raise ValueError(f"Student {student_id} does not exist")
        course = self.repo.get_course_by_code(course_code)
        if not course:
            raise ValueError(f"Course {course_code} does not exist")

        enrollment = Enrollment(None, student_id, course_code, None)
        new_id = self.repo.add_enrollment(enrollment)
        enrollment.enrollment_id = new_id
        enrollment.credits = course.credits
        return enrollment

    def assign_grade(self, enrollment_id, grade_payload):
        """
        grade_payload supports:
        - {"grade": 8.2}                        # final grade directly
        - {"scores": [..], "weights": [..]}     # compute weighted final grade
        """
        if isinstance(grade_payload, dict) and "scores" in grade_payload:
            scores = grade_payload.get("scores", [])
            weights = grade_payload.get("weights", [5, 5, 30, 60])  # default
            final_grade = Enrollment.weighted_average(scores, weights)
            details = {f"Score{i+1} ({w}%)": s for i, (s, w) in enumerate(zip(scores, weights))}
        elif isinstance(grade_payload, dict) and "grade" in grade_payload:
            final_grade = float(grade_payload["grade"])
            if final_grade < 0 or final_grade > 10:
                raise ValueError("Grade must be between 0 and 10")
            details = {"Manual Input": final_grade}
            weights = None
        else:
            # Backward compatible: raw float
            final_grade = float(grade_payload)
            if final_grade < 0 or final_grade > 10:
                raise ValueError("Grade must be between 0 and 10")
            details = {"Manual Input": final_grade}
            weights = None

        # Persist final grade
        self.repo.update_grade(enrollment_id, final_grade)

        # Fetch enriched enrollment
        result = self.repo.get_enrollment_by_id(enrollment_id)
        if result:
            result.component_scores = details
            # attach weights if present
            if 'weights' in locals() and weights is not None:
                result.weights = weights
            # ensure credits present
            if not hasattr(result, 'credits') or not result.credits:
                course = self.repo.get_course_by_code(result.course_code)
                if course:
                    result.credits = course.credits

        return result

    def get_all_enrollments(self):
        return self.repo.get_all_enrollments()

    def remove_enrollment(self, enrollment_id):
        self.repo.delete_enrollment(enrollment_id)

    # --- GPA LOGIC ---
    def calculate_gpa(self, student_id):
        """
        Returns dict: {"student_id": ..., "gpa": <10-scale>, "grade": <letter>, "gpa4": <4-scale>}
        """
        summary = self.repo.calculate_gpa_by_student(student_id)
        gpa10 = summary["gpa"]
        return {
            "student_id": student_id,
            "gpa": gpa10,
            "grade": Enrollment.convert_to_letter(gpa10),
            "gpa4": Enrollment.convert_to_gpa4(gpa10)
        }