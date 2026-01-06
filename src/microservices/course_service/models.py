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