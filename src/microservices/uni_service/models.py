class Uni:
    def __init__(self, mem_school_id, mem_school_name, mem_school_website, fanpage=None):
        self.mem_school_id = mem_school_id
        self.mem_school_name = mem_school_name
        self.mem_school_website = mem_school_website
        self.fanpage = fanpage

    def to_dict(self):
        return {
            'mem_school_id': self.mem_school_id,
            'mem_school_name': self.mem_school_name,
            'mem_school_website': self.mem_school_website,
            'fanpage': self.fanpage
        }
