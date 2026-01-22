class KnowledgeBlock:
    """Khối kiến thức của ngành học"""
    def __init__(self, block_id, block_name, block_type, credits=0):
        self.block_id = block_id
        self.block_name = block_name
        self.block_type = block_type  # cơ sở ngành, bổ trợ, giáo dục đại cương, chuyên ngành, thực tập
        self.credits = credits
        self.courses = []  # Danh sách học phần trong khối

    def add_course(self, course_id, course_name, course_credits):
        """Thêm học phần vào khối kiến thức"""
        self.courses.append({
            'course_id': course_id,
            'course_name': course_name,
            'course_credits': course_credits
        })
        self.credits += course_credits

    def remove_course(self, course_id):
        """Xóa học phần khỏi khối kiến thức"""
        for course in self.courses:
            if course['course_id'] == course_id:
                self.credits -= course['course_credits']
                self.courses.remove(course)
                break

    def to_dict(self):
        return {
            'block_id': self.block_id,
            'block_name': self.block_name,
            'block_type': self.block_type,
            'credits': self.credits,
            'courses': self.courses
        }


class Major:
    def __init__(self, major_id, major_name, major_credits, fac_id, fac_name=None):
        self.major_id = major_id
        self.major_name = major_name
        self.major_credits = major_credits
        self.fac_id = fac_id
        self.fac_name = fac_name
        
        # Khởi tạo các khối kiến thức
        self.knowledge_blocks = {
            'cso_nganh': KnowledgeBlock('cso_nganh', 'Khối kiến thức cơ sở ngành', 'cso_nganh'),
            'bo_tro': KnowledgeBlock('bo_tro', 'Khối kiến thức bổ trợ', 'bo_tro'),
            'giao_duc_dai_cuong': KnowledgeBlock('giao_duc_dai_cuong', 'Khối kiến thức giáo dục đại cương', 'giao_duc_dai_cuong'),
            'chuyen_nganh': KnowledgeBlock('chuyen_nganh', 'Khối kiến thức chuyên ngành', 'chuyen_nganh'),
            'thuc_tap': KnowledgeBlock('thuc_tap', 'Khối thực tập', 'thuc_tap')
        }

    def get_total_credits(self):
        """Tính tổng tín chỉ từ tất cả khối kiến thức"""
        total = sum(block.credits for block in self.knowledge_blocks.values())
        return total

    def add_course_to_block(self, block_type, course_id, course_name, course_credits):
        """Thêm học phần vào khối kiến thức"""
        if block_type in self.knowledge_blocks:
            self.knowledge_blocks[block_type].add_course(course_id, course_name, course_credits)
            self.major_credits = self.get_total_credits()
            return True
        return False

    def remove_course_from_block(self, block_type, course_id):
        """Xóa học phần từ khối kiến thức"""
        if block_type in self.knowledge_blocks:
            self.knowledge_blocks[block_type].remove_course(course_id)
            self.major_credits = self.get_total_credits()
            return True
        return False

    def to_dict(self):
        return {
            'major_id': self.major_id,
            'major_name': self.major_name,
            'major_credits': self.major_credits,
            'total_credits': self.get_total_credits(),
            'fac_id': self.fac_id,
            'fac_name': self.fac_name,
            'knowledge_blocks': {
                block_key: block.to_dict() 
                for block_key, block in self.knowledge_blocks.items()
            }
        }
