class Grade:
    def __init__(self, grade_id, student_id, course_id, attendance1_score, attendance2_score, midterm_score, final_score, avg_score):
        self.grade_id = grade_id
        self.student_id = student_id
        self.course_id = course_id
        self.attendance1_score = attendance1_score
        self.attendance2_score = attendance2_score
        self.midterm_score = midterm_score
        self.final_score = final_score
        self.avg_score = avg_score

    def to_dict(self):
        return {
            "grade_id": self.grade_id,
            "student_id": self.student_id,
            "course_id": self.course_id,
            "attendance1_score": str(self.attendance1_score) if self.attendance1_score is not None else None,
            "attendance2_score": str(self.attendance2_score) if self.attendance2_score is not None else None,
            "midterm_score": str(self.midterm_score) if self.midterm_score is not None else None,
            "final_score": str(self.final_score) if self.final_score is not None else None,
            "avg_score": str(self.avg_score) if self.avg_score is not None else None
        }

    @staticmethod
    def weighted_average(scores, weights):
        """
        Tính điểm trung bình có trọng số.
        Ví dụ: scores=[8, 9, 7.5], weights=[20, 30, 50]
        """
        if not scores or not weights or len(scores) != len(weights):
            return 0.0
            
        total_weight = sum(weights)
        if total_weight == 0:
            return 0.0

        # Filter out None values just in case
        valid_pairs = [(s, w) for s, w in zip(scores, weights) if s is not None]
        if not valid_pairs:
             return 0.0

        weighted_sum = sum(s * w for s, w in valid_pairs)
        return round(weighted_sum / total_weight, 2)

    @staticmethod
    def convert_to_letter(gpa10):
        if gpa10 is None: return "F"
        if gpa10 >= 8.5: return "A"
        if gpa10 >= 8.0: return "B+"
        if gpa10 >= 7.0: return "B"
        if gpa10 >= 6.5: return "C+"
        if gpa10 >= 5.5: return "C"
        if gpa10 >= 5.0: return "D+"
        if gpa10 >= 4.0: return "D"
        return "F"

    @staticmethod
    def convert_to_gpa4(gpa10):
        """Chuyển điểm hệ 10 sang hệ 4"""
        if gpa10 >= 8.5: return 4.0
        if gpa10 >= 8.0: return 3.5
        if gpa10 >= 7.0: return 3.0
        if gpa10 >= 6.5: return 2.5
        if gpa10 >= 5.5: return 2.0
        if gpa10 >= 5.0: return 1.5
        if gpa10 >= 4.0: return 1.0
        return 0.0

class Enrollment:
    def __init__(self, enrollment_id=None, student_id=None, course_code=None, grade=None):
        self.enrollment_id = enrollment_id
        self.student_id = student_id
        self.course_code = course_code
        self.grade = grade
        self.component_scores = {}

    def to_dict(self):
        return {
            "enrollment_id": self.enrollment_id,
            "id": self.enrollment_id,  # Compatibility
            "student_id": self.student_id,
            "course_code": self.course_code,
            "grade": self.grade,
            "component_scores": self.component_scores
        }