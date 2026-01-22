class Student:
    def __init__(self, student_id, student_name, date_of_birth, gender, student_class, student_email, cohort=None):
        self.student_id = student_id
        self.student_name = student_name
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.student_class = student_class
        self.student_email = student_email
        self.cohort = cohort

    def to_dict(self):
        return {
            'student_id': self.student_id,
            'student_name': self.student_name,
            'date_of_birth': self.date_of_birth,
            'gender': self.gender,
            'student_class': self.student_class,
            'student_email': self.student_email,
            'cohort': self.cohort
        }
