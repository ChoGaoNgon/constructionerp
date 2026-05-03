# Construction Project Management System

Dashboard quản lý và điều hành các dự án xây dựng, được thiết kế cho Ban Giám Đốc (PGD) và Ban Chỉ Huy (BCH). Hệ thống tập trung vào việc theo dõi tiến độ, sức khoẻ tài chính, đánh giá tình trạng dự án, và báo cáo hiện trường.

## Mục lục tài liệu

Để giúp mọi người (từ developers đến team nghiệp vụ và users mới) dễ dàng nắm bắt dự án, toàn bộ thông tin được chia thành 2 phần chính:

1. **[Business Detail / Nghiệp vụ dự án](business_detail.md)**
   > Tài liệu này mô tả chi tiết từng tính năng, luồng đi của dự án, logic tính toán (ví dụ: cách tính thu hồi tạm ứng, phân ngưỡng thu hồi, kế hoạch thanh toán). Rất thích hợp cho người mới vào để hiểu được mục đích và quy trình kinh doanh của hệ thống.

2. **[Project Context / Technical Architecture](project_context.md)**
   > Tài liệu này mô tả tổng quan về mặt Technical (stack công nghệ: Vue 3, Vite, Supabase, RLS), danh sách các bảng tính, cách triển khai và sơ đồ cơ sở dữ liệu.

## Các module chính

- **Quản lý danh mục**: Nhân sự, Phòng ban, Vai trò trong dự án.
- **Quản lý dự án**: Khởi tạo dự án, hợp đồng, định mức tạm ứng, trạng thái dự án, dự tính các lần thanh toán.
- **Nghiệm thu & Phân bổ (Payments)**: Quản lý chi tiết việc ghi nhận giá trị nghiệm thu thực tế, và tự động hóa thuật toán thu hồi tạm ứng (dư nợ).
- **Báo cáo hiện trường (Reports)**: Báo cáo ngày/tuần về tiến độ, chi phí, vấn đề và hướng giải quyết.

## Hướng dẫn cài đặt & chạy nội bộ

Dự án sử dụng Npm và Vite.

```bash
# Cài đặt dependencies
npm install

# Khởi chạy dev server
npm run dev

# Build production
npm run build
```

## Database Setup
Sử dụng file `SUPABASE_SCHEMA.sql` để khởi tạo bảng và Row Level Security trên Supabase. Đừng quên cấu hình `firebase-applet-config.json` nếu có dùng các dịch vụ của Firebase, hoặc các biến môi trường cho Supabase trong biến `.env`.
