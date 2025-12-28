class Enrollment:
    def __init__(self, enrollment_id, student_id, course_code, grade):
        self.enrollment_id = enrollment_id
        self.student_id = student_id
        self.course_code = course_code
        self.grade = grade
        # Các thuộc tính bổ sung
        self.credits = 0
        self.component_scores = None
        self.weights = None

    def to_dict(self):
        data = {
            "enrollment_id": self.enrollment_id,
            "student_id": self.student_id,
            "course_code": self.course_code,
            "grade": self.grade
        }
        if self.credits:
            data['credits'] = self.credits
        if self.component_scores:
            data['component_scores'] = self.component_scores
        if self.weights:
            data['weights'] = self.weights
        return data

    @staticmethod
    def weighted_average(scores, weights):
        """
        Tính điểm trung bình có kiểm tra kỹ lưỡng đầu vào
        """
        # 1. Kiểm tra độ dài
        if not scores or not weights or len(scores) != len(weights):
            raise ValueError("Danh sách điểm và trọng số phải có cùng độ dài.")
        
        # 2. Kiểm tra điểm hợp lệ (0-10)
        if any(s < 0 or s > 10 for s in scores):
            raise ValueError("Điểm thành phần phải từ 0 đến 10.")

        total_weight = sum(weights)
        if total_weight <= 0:
            raise ValueError("Tổng trọng số phải lớn hơn 0.")
            
        # 3. Tính toán
        return round(sum(s * w for s, w in zip(scores, weights)) / total_weight, 2)

    @staticmethod
    def convert_to_letter(score):
        # Thang điểm chi tiết (Có dấu +)
        if score is None: return "F"
        if score >= 9.0: return "A+"
        if score >= 8.5: return "A"
        if score >= 8.0: return "B+"
        if score >= 7.0: return "B"
        if score >= 6.5: return "C+"
        if score >= 5.5: return "C"
        if score >= 5.0: return "D+"
        if score >= 4.0: return "D"
        return "F"

    @staticmethod
    def convert_to_gpa4(score):
        # Thang điểm 4 chi tiết tương ứng
        if score is None: return 0.0
        if score >= 9.0: return 4.0
        if score >= 8.5: return 3.7
        if score >= 8.0: return 3.5
        if score >= 7.0: return 3.0
        if score >= 6.5: return 2.5
        if score >= 5.5: return 2.0
        if score >= 5.0: return 1.5
        if score >= 4.0: return 1.0
        return 0.0