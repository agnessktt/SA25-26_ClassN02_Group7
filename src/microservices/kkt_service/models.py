class Kkt:
    def __init__(self, kkt_id, kkt_name, kkt_credits, course_id=None, course_name=None, courses=None):
        self.kkt_id = kkt_id
        self.kkt_name = kkt_name
        self.kkt_credits = kkt_credits
        self.course_id = course_id # Deprecated single link
        self.course_name = course_name
        self.courses = courses if courses else [] # List of {id, name}

    def to_dict(self):
        return {
            'kkt_id': self.kkt_id,
            'kkt_name': self.kkt_name,
            'kkt_credits': self.kkt_credits,
            'course_id': self.course_id,
            'course_name': self.course_name,
            'courses': self.courses
        }
