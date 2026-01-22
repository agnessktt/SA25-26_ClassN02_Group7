class Course:
    def __init__(self, course_id, course_name, total_credits, theory_credits, practical_credits, prerequisite, co_requisite, previous):
        self.course_id = course_id
        self.course_name = course_name
        self.total_credits = total_credits
        self.theory_credits = theory_credits
        self.practical_credits = practical_credits
        self.prerequisite = prerequisite
        self.co_requisite = co_requisite
        self.previous = previous

    def to_dict(self):
        return {
            "course_id": self.course_id,
            "course_name": self.course_name,
            "total_credits": self.total_credits,
            "theory_credits": self.theory_credits,
            "practical_credits": self.practical_credits,
            "prerequisite": self.prerequisite,
            "co_requisite": self.co_requisite,
            "previous": self.previous
        }