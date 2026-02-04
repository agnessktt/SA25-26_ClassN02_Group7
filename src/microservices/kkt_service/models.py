class Kkt:
    def __init__(self, kkt_id, kkt_name, kkt_credits):
        self.kkt_id = kkt_id
        self.kkt_name = kkt_name
        self.kkt_credits = kkt_credits

    def to_dict(self):
        return {
            'kkt_id': self.kkt_id,
            'kkt_name': self.kkt_name,
            'kkt_credits': self.kkt_credits
        }
