# src/_legacy_src/persistence/models.py

class Student:
    def __init__(self, student_id, name):
        self.student_id = student_id
        self.name = name

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "name": self.name
        }


class Course:
    def __init__(self, course_code, name, credits):
        self.course_code = course_code
        self.name = name
        self.credits = credits

    def to_dict(self):
        return {
            "course_code": self.course_code,
            "name": self.name,
            "credits": self.credits
        }


class Enrollment:
    def __init__(self, enrollment_id, student_id, course_code, grade):
        self.enrollment_id = enrollment_id
        self.student_id = student_id
        self.course_code = course_code
        self.grade = grade
        # Extended attributes (optional)
        self.credits = 0
        self.component_scores = None  # e.g., {"Score1 (5%)": 7.5, ...} or list [7.5, 8.0, 9.0]
        self.weights = None           # e.g., [5, 5, 30, 60]

    def to_dict(self):
        data = {
            "enrollment_id": self.enrollment_id,
            "student_id": self.student_id,
            "course_code": self.course_code,
            "grade": self.grade
        }
        if hasattr(self, 'credits') and self.credits is not None:
            data['credits'] = self.credits
        if hasattr(self, 'component_scores') and self.component_scores is not None:
            data['component_scores'] = self.component_scores
        if hasattr(self, 'weights') and self.weights is not None:
            data['weights'] = self.weights
        return data

    @staticmethod
    def convert_to_letter(score_10_scale):
        # 9-level grading scale to letter
        if score_10_scale is None:
            return "F"
        if score_10_scale >= 9: return "A+"
        elif score_10_scale >= 8.5: return "A"
        elif score_10_scale >= 8: return "B+"
        elif score_10_scale >= 7: return "B"
        elif score_10_scale >= 6.5: return "C+"
        elif score_10_scale >= 5.5: return "C"
        elif score_10_scale >= 5: return "D+"
        elif score_10_scale >= 4: return "D"
        else: return "F"

    @staticmethod
    def convert_to_gpa4(score_10_scale):
        # 9-level grading scale to 4-point GPA
        if score_10_scale is None:
            return 0.0
        if score_10_scale >= 9: return 4.0
        elif score_10_scale >= 8.5: return 3.7
        elif score_10_scale >= 8: return 3.5
        elif score_10_scale >= 7: return 3.0
        elif score_10_scale >= 6.5: return 2.5
        elif score_10_scale >= 5.5: return 2.0
        elif score_10_scale >= 5: return 1.5
        elif score_10_scale >= 4: return 1.0
        else: return 0.0

    @staticmethod
    def weighted_average(scores, weights):
        if not scores or not weights or len(scores) != len(weights):
            raise ValueError("Scores and weights must be non-empty and have equal length.")
        if any(s < 0 or s > 10 for s in scores):
            raise ValueError("Each score must be between 0 and 10.")
        total_weight = sum(weights)
        if total_weight <= 0:
            raise ValueError("Total weight must be greater than 0.")
        return round(sum(s * w for s, w in zip(scores, weights)) / total_weight, 2)