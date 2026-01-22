class Faculty:
    def __init__(self, fac_id, fac_name, fac_address, fac_email, fac_number, mem_school_id, school_name=None):
        self.fac_id = fac_id
        self.fac_name = fac_name
        self.fac_address = fac_address
        self.fac_email = fac_email
        self.fac_number = fac_number
        self.mem_school_id = mem_school_id
        self.school_name = school_name

    def to_dict(self):
        return {
            'fac_id': self.fac_id,
            'fac_name': self.fac_name,
            'fac_address': self.fac_address,
            'fac_email': self.fac_email,
            'fac_number': self.fac_number,
            'mem_school_id': self.mem_school_id,
            'school_name': self.school_name
        }
