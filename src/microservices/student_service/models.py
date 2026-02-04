class Student:
    def __init__(self, student_id, student_name, student_email, gender, date_of_birth, cohort, student_class):
        self.student_id = student_id
        self.student_name = student_name
        self.student_email = student_email
        self.gender = gender
        self.date_of_birth = date_of_birth
        self.cohort = cohort
        self.student_class = student_class

    def to_dict(self):
        return {
            'student_id': self.student_id,
            'student_name': self.student_name,
            'student_email': self.student_email,
            'gender': self.gender,
            'date_of_birth': self.date_of_birth,
            'cohort': self.cohort,
            'student_class': self.student_class
        }
