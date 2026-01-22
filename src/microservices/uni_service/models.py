class Uni:
    def __init__(self, mem_school_id, mem_school_name, mem_school_websit):
        self.mem_school_id = mem_school_id
        self.mem_school_name = mem_school_name
        self.mem_school_websit = mem_school_websit

    def to_dict(self):
        return {
            'mem_school_id': self.mem_school_id,
            'mem_school_name': self.mem_school_name,
            'mem_school_websit': self.mem_school_websit
        }
