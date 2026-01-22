# Hướng dẫn sử dụng Khối Kiến Thức (Knowledge Blocks)

## Tổng quan

Tính năng "Khối Kiến Thức" cho phép bạn tổ chức các học phần của một ngành học thành 5 khối kiến thức khác nhau:

1. **Khối kiến thức cơ sở ngành** - Các môn học cơ bản của ngành
2. **Khối kiến thức bổ trợ** - Các môn học bổ sung, hỗ trợ
3. **Khối kiến thức giáo dục đại cương** - Các môn học đại cương bắt buộc
4. **Khối kiến thức chuyên ngành** - Các môn học chuyên sâu của ngành
5. **Khối thực tập** - Các hoạt động thực tập, thực hành

## Cài đặt

### 1. Tạo bảng cơ sở dữ liệu

Chạy migration script để tạo bảng cần thiết:

```bash
mysql -u [user] -p [database] < SQL_MIGRATIONS/knowledge_blocks_migration.sql
```

Hoặc chạy trực tiếp trong MySQL client:

```sql
CREATE TABLE IF NOT EXISTS major_knowledge_block_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    major_id INT NOT NULL,
    block_type VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_credits INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_major_block_course (major_id, block_type, course_id),
    FOREIGN KEY (major_id) REFERENCES major(marjor_id) ON DELETE CASCADE
);

CREATE INDEX idx_major_block_type ON major_knowledge_block_courses(major_id, block_type);
CREATE INDEX idx_course_lookup ON major_knowledge_block_courses(course_id);
```

### 2. Cấu hình API

Đảm bảo major_service đang chạy trên port 5009. Hệ thống sẽ tự động kết nối thông qua các endpoint:

- `GET /api/majors/<major_id>/knowledge-blocks` - Lấy tất cả khối kiến thức
- `POST /api/majors/<major_id>/knowledge-blocks/<block_type>/courses` - Thêm học phần
- `DELETE /api/majors/<major_id>/knowledge-blocks/<block_type>/courses/<course_id>` - Xóa học phần
- `GET /api/majors/<major_id>/total-credits` - Lấy tổng tín chỉ

## Hướng dẫn sử dụng

### Bước 1: Truy cập trang Quản lý ngành học

1. Mở giao diện hệ thống
2. Nhấp vào tab "Quản lý ngành học"

### Bước 2: Xem khối kiến thức của một ngành

1. Trong bảng danh sách ngành học, nhấp vào nút **"Khối kiến thức"** tương ứng với ngành bạn muốn quản lý
2. Giao diện sẽ hiển thị:
   - Danh sách 5 khối kiến thức
   - Các học phần trong mỗi khối
   - Tổng tín chỉ của từng khối
   - **Tổng tín chỉ toàn ngành** (ở trên cùng)

### Bước 3: Thêm học phần vào khối kiến thức

1. Nhấp vào nút **"+ Thêm học phần vào khối kiến thức"**
2. Điền thông tin:
   - **Ngành học** (bắt buộc)
   - **Khối kiến thức** (bắt buộc)
   - **Mã học phần** (bắt buộc)
   - **Tên học phần** (bắt buộc)
   - **Tín chỉ** (tùy chọn)
3. Nhấp "Thêm học phần"
4. Hệ thống sẽ:
   - Thêm học phần vào khối kiến thức
   - Tự động tính toán lại tín chỉ cho khối
   - Cập nhật tổng tín chỉ toàn ngành

### Bước 4: Xóa học phần từ khối kiến thức

1. Trong danh sách khối kiến thức, tìm học phần cần xóa
2. Nhấp vào nút **"Xóa"** bên cạnh học phần
3. Xác nhận xóa
4. Hệ thống sẽ:
   - Xóa học phần khỏi khối kiến thức
   - Tự động tính toán lại tín chỉ

## Tính năng tự động

### Tính tổng tín chỉ

Hệ thống **tự động**:

- Tính tổng tín chỉ cho mỗi khối kiến thức
- Tính tổng tín chỉ **toàn ngành** (tổng của tất cả 5 khối)
- Cập nhật hiển thị ngay lập tức khi thêm/xóa học phần

### Tính năng Cập nhật Thực thời

Khi bạn thêm hoặc xóa một học phần:
1. Số tín chỉ khối được cập nhật ngay
2. Tổng tín chỉ toàn ngành được cập nhật ngay
3. Không cần làm mới trang

## Lưu ý

- Mỗi học phần chỉ có thể xuất hiện một lần trong mỗi khối kiến thức
- Một học phần có thể xuất hiện trong nhiều khối kiến thức khác nhau
- Xóa một ngành học sẽ tự động xóa tất cả các học phần liên quan
- Tín chỉ mặc định là 0 nếu không nhập

## Cấu trúc Dữ liệu Backend

### Model KnowledgeBlock (Python)

```python
class KnowledgeBlock:
    def __init__(self, block_id, block_name, block_type, credits=0):
        self.block_id = block_id
        self.block_name = block_name
        self.block_type = block_type
        self.credits = credits
        self.courses = []
```

### API Response Format

```json
{
  "major_id": "1",
  "knowledge_blocks": {
    "cso_nganh": {
      "block_id": "cso_nganh",
      "block_name": "Khối kiến thức cơ sở ngành",
      "block_type": "cso_nganh",
      "credits": 30,
      "courses": [
        {
          "course_id": "101",
          "course_name": "Lập trình cơ bản",
          "course_credits": 3
        }
      ]
    }
  },
  "total_credits": 120
}
```

## Xử lý Sự cố

### Khối kiến thức không hiển thị

- Kiểm tra xem major_service có đang chạy không
- Kiểm tra cơ sở dữ liệu có bảng `major_knowledge_block_courses` không
- Mở Console (F12) để xem lỗi chi tiết

### Thêm học phần thất bại

- Kiểm tra các trường bắt buộc đã điền đầy đủ
- Kiểm tra kết nối mạng
- Xem thông báo lỗi trong Toast notification

### Tính tín chỉ không đúng

- Làm mới trang để đồng bộ dữ liệu
- Kiểm tra giá trị tín chỉ của mỗi học phần

## API Documentation

Xem tệp `src/microservices/major_service/app.py` để biết chi tiết về các endpoint.

### Endpoints Chính

#### GET /api/majors/{major_id}/knowledge-blocks
Lấy tất cả khối kiến thức của một ngành

**Response:**
```json
{
  "major_id": "1",
  "knowledge_blocks": {...},
  "total_credits": 120
}
```

#### POST /api/majors/{major_id}/knowledge-blocks/{block_type}/courses
Thêm học phần vào khối kiến thức

**Body:**
```json
{
  "course_id": "101",
  "course_name": "Lập trình cơ bản",
  "course_credits": 3
}
```

#### DELETE /api/majors/{major_id}/knowledge-blocks/{block_type}/courses/{course_id}
Xóa học phần khỏi khối kiến thức

## Thường Xuyên Hỏi

**Q: Có thể thêm khối kiến thức mới không?**
A: Hiện tại có 5 khối cố định. Để thêm khối mới, cần sửa code backend và frontend.

**Q: Có thể sao chép ngành học khác không?**
A: Chưa có tính năng này. Bạn cần thêm thủ công từng học phần.

**Q: Tín chỉ có bao gồm cái gì?**
A: Tín chỉ được tính từ tất cả học phần trong tất cả 5 khối, không phân biệt.
