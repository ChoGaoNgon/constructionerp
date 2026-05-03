# Kiến trúc & Bối cảnh dự án: Hệ thống Quản lý Xây dựng (Sử dụng Supabase)

## 🏗️ Tổng quan
Một hệ thống quản lý các dự án xây dựng dựa trên thời gian thực, được thiết kế cho Ban Giám đốc (PGD) và Ban Chỉ huy công trường (BCH). Hệ thống tập trung cung cấp khả năng đánh giá tiến độ, sức khoẻ tài chính dự án, thu hồi các kỳ thanh toán/tạm ứng, cũng như báo cáo hiện trường.

## 🛠️ Trạm công nghệ (Technical Stack)
- **Framework**: Vue 3 (Composition API) + Vite
- **Ngôn ngữ**: TypeScript
- **Giao diện (Styling)**: Tailwind CSS
- **Icons**: Lucide Vue Next
- **Backend / Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Biểu đồ (Charts)**: ApexCharts (vue3-apexcharts)
- **Triển khai (Deployment)**: AI Studio / Cloud Run

## 📂 Tính năng & Yêu cầu cốt lõi

### 1. Quản lý Dự án (Project Management)
- **Bảng điều khiển (Dashboard)**: Tổng quan KPI và thông số các dự án đang hoạt động.
- **Khởi tạo dữ liệu dự án (Registration)**: Thiết lập hợp đồng, ngân sách, tỷ lệ tạm ứng, lập trước kế hoạch các bước nhảy thanh toán.
- **Đánh giá tình trạng (Evaluation)**: Dự án có thể được quản lí đánh giá trạng thái thành (AN TOÀN, CẢNH BÁO, RỦI RO) đính kèm các báo cáo ghi chú để dễ nắm bắt những rắc rối khi thi công.

### 2. Nghiệm thu & Phân bổ Tài chính (Financials & Payment Allocation)
- **Tính toán thông minh**: Sổ cái tự động tính toán tổng dư nợ, tự phân tích ngưỡng thu hồi tạm ứng (VD: Bắt buộc thu hồi khi đạt 80% giá trị hợp đồng), cùng các dữ liệu thu hồi, nghiệm thu lũy kế các kì trước.
- **Dự toán các kì thanh toán**: Cho phép thiết lập dự toán lịch trình ở quá trình khởi tạo và truy xuất điền tự động khi chốt kỳ thanh toán mà không phải gõ số tài chính lại từ đầu.

### 3. Cấp bậc nhân sự & Chức vụ
- **Quyền theo hệ thống (System Roles)**: Mapping phân quyền điều hướng tổng quát (`ADMIN`, `CEO`, `LEADER`, `STAFF`).
- **Nhiệm vụ trên dự án (Project Roles)**: Bảng theo ngữ cảnh sẽ gán nhân sự vào vị trí tương ứng (`PGD`, `BCH`, `QS`, `Accountant`) nhằm mục đích thể hiện rõ đầu mối trên hợp đồng.

Để xem thêm luồng diễn giải kỹ thuật và logic nghiệp vụ, hãy xem tài liệu [Chi tiết Nghiệp Vụ](business_detail.md).

## 🗄️ Lược đồ cơ sở dữ liệu (Database Schema)

(Vui lòng mở file `SUPABASE_SCHEMA.sql` để xem thêm định nghĩa gốc về lược đồ, triggers và phân tích phân lớp bảo mật dữ liệu RLS)
- `departments`: Cơ cấu phòng ban hệ thống.
- `employees`: User (Đồng nhất mapping tài khoản với mục authentication) chứa thông tin vai trò.
- `projects`: Yếu tố gốc, quản lý ngân sách hợp đồng, giá trị nghiệm thu, thiết lập tỷ lệ và sơ đồ thanh toán trả góp (lưu mảng JSON), trạng thái đánh giá quản trị.
- `project_roles` & `project_assignments`: Mapping dữ liệu giữa quan hệ nhiều-nhiều gán nhân sự vào dự án với vai trò đặc thù.
- `payments`: Sổ cái tài chính báo cáo số lượng đợt, số nghiệm thu, tiền thu hồi tạm ứng.
- `reports`: Bảng nhật ký thời gian đo lường sức khỏe đánh giá của công trường hàng tuần/hàng ngày.