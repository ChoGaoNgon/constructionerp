# Chi tiết Nghiệp vụ & Luồng hệ thống

Tài liệu này phác thảo các logic nghiệp vụ và luồng quy trình được triển khai trong Hệ thống Quản lý Dự án Xây dựng. Nó đóng vai trò là một hướng dẫn toàn diện cho các lập trình viên, quản lý sản phẩm và các thành viên mới để hiểu *cách thức* hệ thống hoạt động từ góc nhìn kinh doanh.

## 1. Tổng quan các phân hệ (Modules) cốt lõi

Hệ thống được xây dựng với các phân hệ liên kết chặt chẽ:
-   **Bảng điều khiển (Dashboard)**: Cung cấp góc nhìn tổng quan cấp cao và hiển thị bộ chỉ số KPIs trên toàn tổ chức.
-   **Nhân sự (Employees)**: Sơ đồ tổ chức, quản lý hồ sơ nhân sự, và các vai trò phân quyền.
-   **Dự án (Projects)**: Phân hệ trung tâm quản lý các dự án xây dựng, dòng tiền và biểu đồ thi công.
-   **Nghiệm thu & Phân bổ (Payments)**: Theo dõi dữ liệu tài chính của những phần công việc hoàn thiện và bài toán thu hồi dòng tiền tạm ứng.
-   **Báo cáo (Reports)**: Tổng hợp, tạo biểu đồ hiển thị và cho xuất dữ liệu.

---

## 2. Thuật ngữ & Các khái niệm chính

Để hiểu luồng công việc, bạn cần nắm vững các từ khóa về hệ thống tài chính và quy trình vận hành sau:

-   **Giá trị hợp đồng (Contract Value)**: Mức ngân sách tổng đã chốt và thỏa thuận cho dự án.
-   **Tỷ lệ tạm ứng (Advance Rate)**: Phần trăm (thường từ 20-30%) của Giá trị Hợp đồng được nhà thầu trả trước ngay lúc ký.
-   **Số tiền tạm ứng (Advance Amount)**: Tính bằng `Giá trị Hợp đồng * Tỷ lệ tạm ứng`.
-   **Định mức thu hồi (Recovery Deadline Ratio)**: Ngưỡng tỷ lệ (thường 80% hoặc 100%) quy định mốc dự án. Ngay khi `Giá trị nghiệm thu lũy kế` đạt mốc này thì mọi nợ tạm ứng trước đó đều bắt buộc phải được thu hồi dứt điểm.
-   **Giá trị nghiệm thu (Completed Value)**: Quy đổi thành tiền tệ các khối lượng công việc đã làm xong của từng đợt giải ngân.
-   **Thực thanh (Paid Amount)**: Là phần được thanh toán sau cùng ở từng đợt giải ngân. Công thức tính là: `Giá trị nghiệm thu đợt này - Thu hồi tạm ứng thực tế đợt này`.
-   **Dự tính các lần thanh toán (Payment Plan)**: Danh mục lịch trình thanh toán tạo lập từ lúc ký hợp đồng/tạo dự án, chỉ ra dự toán chi tiết về thời gian, phí giá trị nghiệm thu dự kiến và phí thu hồi tạm ứng tương lai.

---

## 3. Quy trình làm việc & Logic Nghiệp Vụ

### A. Quản lý dự án & Khởi tạo

1.  **Quy trình mở mới dự án (Creation Flow)**:
    -   Người dùng điền các thuộc tính dữ liệu (`tên`, `ngày_bắt_đầu`, `ngày_kết_thúc`, `ngày_kết_thúc_dự_kiến`).
    -   **Khởi tạo bộ chỉ số tài chính**: Thiết định `Giá trị hợp đồng` và `Tỷ lệ tạm ứng`. Hệ thống tự nhẩm và xuất ra `Số tiền tạm ứng`.
    -   **Giới hạn thu hồi**: Chỉ định thông số ngưỡng hoàn thiện, mặc định thường rơi vào mốc là `Định mức thu hồi` 80%.
    -   **Kế hoạch thanh toán (Payment Planning)**: Người dùng có thể thêm danh sách các lần dự kiến thanh toán, giá trị nghiệm thu tương ứng và tiền dự định thu hồi từng giai đoạn đó, bộ này dùng như "bản mẫu" khi điền báo cáo các phiếu chi nghiệm thu trong tương lai.
2.  **Đánh giá Tình trạng Dự án (Status Evaluation)**:
    -   Một dự án linh động thay đổi qua 3 trạng thái có thể tự set: `AN TOÀN`, `CẢNH BÁO`, `RỦI RO`.
    -   Phần đánh giá đính kèm một ô cho "Note" kèm thông tin thời gian cụ thể người chấm đánh giá. Tính năng này đóng vai trò cho Ban Lãnh đạo kịp thời dò lỗi các quy trình gặp đình trệ.
3.  **Xóa Mềm (Soft Deletion)**: Lịch sử tiền tệ không bao giờ được phép xóa. Nếu không cần quản lý bảng dự án thay vì xóa bỏ cứng, mã code tự ghim đánh dấu nó bằng cờ flag `is_deleted = true`.

### B. Nghiệm Thu Đầu Ra & Hoàn Trả Ngân Sách (Nghiệm thu & Phân bổ)

Đây là chức năng quan trọng nhất về mặt chi trả. Tính toán thiết lập hệ thống logic ràng buộc thu hồi tự động dòng tiền ngay khi nó tiến hành vào sâu trong luồng tiến trình làm việc.

1.  **Tạo một kỳ thanh toán / Phiếu chi (Forming a Payment)**:
    -   User nhấp chọn dự án ở menu xổ xuống.
    -   Bạn nạp số tiền *Giá trị nghiệm thu đợt này*.
    -   Một lựa chọn khác, có thể tự lấy mẫu bằng công cụ **"Xuất từ dự tính"**: Công cụ sẽ nhảy cái bảng liệt kê lịch sử bản dự toán Kế hoạch lúc định danh dự án. Sau đó, app tự lấy form dữ liệu khớp đúng 100% hai ô bao gồm `Giá trị nghiệm thu` và kèm luân chuyển mức `Thu hồi tạm ứng`.
2.  **Tự động đưa ra đề xuất số tiền phải thu hồi (base_recover)**:
    -   Mã lệnh dò đếm thông số dự án lấy trích xuất thông tin `Tổng Nghiệm Thu Lũy Kế` (Cumulative Completed) và `Tổng Thu Hồi Lũy Kế` (Cumulative Recovered) cũ.
    -   **Dư nợ (Remaining Advance)**: Tính bằng `Tổng Số Tiền Tạm Ứng dự án ban đầu - Tổng Thu Hồi Lũy Kế (lần trước)`.
    -   **Bẫy ngưỡng đo định mức (Threshold Check)**: Phép thử xét mốc lũy kế nghiệm thu mới (giá trị lũy kế cũ lưu lại + thêm thông số mới vửa tải nhập đợt này) đo với cái `Định mức thu hồi %` (tức 80% quy chuẩn ra tỷ lệ giá trị dự án). 
    -   **Trường hợp 1: Còn dưới ngưỡng**:
        -   Tiền tạm ứng lần này trả mặc định (Base Recover) trả đều tịnh tiến theo tỷ giá: Tính theo `Thuộc trị Giá trị nghiệm thu * Tỷ lệ tạm ứng của dự án`.
        -   Số thu hồi không thể vượt ngưỡng trần `Dư nợ tạm ứng` còn nợ (Giới hạn trả không thể nhiều hơn vốn ban đầu).
    -   **Trường hợp 2: Khi bị đụng ngưỡng, mấp mé qua ngưỡng hoặc vượt quá ngưỡng**:
        -   Hệ thống ràng buộc tính năng chặn yêu cầu bù hoàn một lần 100%. Mức tiền phải đề xuất thu là toàn bộ số khoản giá `Dư nợ tạm ứng` hiện hữu còn thiếu lại.
3.  **Thay số bằng tay tự can thiệp (Manual Override)**:
    -   Bảng tính tự trích phân phối (calculated `base_recover`) chỉ đóng chức năng khuyến cáo con số dựa theo tư vấn quản lý. Khách sử dụng vẫn tự điền số đề đè lên tại khoá mục `Thu hồi tạm ứng thực tế` nếu có phát sinh khác ngoài tính quy đồng.
    -   Khi khách rỗng hộp `Giá trị nghiệm thu` nhưng muốn hoàn trả một cục tiền bồi hoàn, user chỉ việc cập nhật mỗi ô gầm dữ liệu thu hồi.
4.  **Chốt Sổ (Finalization)**:
    -   Phần `Thực thanh` = `Giá trị nghiệm thu - Số tiền thu hồi tạm ứng thực tế`.
    -   Sau khi in và lưu dữ liệu, bộ thẻ số được đẩy thêm một thông báo dãy chỉ số "Lần xới" kế cận (Sequence Lần 1, Lần 2...) lưu đè luân dòng số đo tích lũy thuận tiện xử lý bước tính theo dòng.

### C. Quản Nguồn Nhân Lực & Các Ban Tổ Chức Hành Chính

1.  **Thuộc Tính Phòng Ban (Department)**: Từng một phòng ban độc lập có những đặc quyền và nhãn hiển thị lọc tra cứu.
2.  **Vai Trò Do Hệ Thống (System Roles) VS Vai Trò Trong Dự Án (Project Roles)**:
    -   **Quyền Hệ Thống** (`ADMIN`, `CEO`, `LEADER`, `STAFF`): Mapping giới hạn giao thức ở menu ngoài hệ thống (Ví dụ chỉ ADMIN và CEO được cung quyền thấy sổ phân hạng tài chính toàn quyền của danh sách các dự án).
    -   **Quyền Đóng Dự Án** (`PGD`, `BCH`, `QS`, `ACCOUNTANT`): Ở tính năng thuộc `project_assignments` giới hạn chức phân chức danh cụ thể định mức công vụ mà 1 user chuyên lo. Hiện lúc này vai trò là dạng tag phân luồng ghi lại công danh là chính yếu, chưa đi sâu chặn luồng truy cập từng file.
3.  **Cơ Chế Bảo Mật & Hiệu Năng**:
    -   **Phân Quyền Phía Client (Permission Caching)**: Hệ thống sử dụng `localStorage` để lưu trữ bộ quyền và vai trò sau khi đăng nhập thành công. Điều này giúp giảm thiểu việc gọi database (read spam) mỗi khi chuyển trang, đảm bảo tốc độ phản hồi tức thì cho giao diện. Bộ nhớ đệm được xóa sạch (clear) ngay khi người dùng đăng xuất.
    -   **Quản Lý Tài Khoản (Session Isolation)**: Khi Admin tạo nhân viên mới, hệ thống sử dụng một thực thể Supabase Client tạm thời (`persistSession: false`). Kỹ thuật này giúp Admin khởi tạo tài khoản Auth mới cho nhân viên mà không bị "đá" phiên đăng nhập hiện tại, đảm bảo luồng công việc liên tục.

### D. Hệ Sổ Công Trình Cấp Tuần/Ngày (Báo cáo hiện trường)

1.  **Phân Loại Biên Bản (Report Categorization)**: Nhật ký hiện trường được chia thành 3 nhóm: `HÀNG NGÀY`, `HÀNG TUẦN`, `HÀNG THÁNG`. Việc phân loại này giúp Ban quản lý dễ dàng lọc dữ liệu theo kỳ báo cáo mong muốn.
2.  **Quản Lý Danh Sách & Phân Trang**: Trong chi tiết dự án, danh sách báo cáo được hiển thị qua hệ thống Tab và cơ chế phân trang (5 bản ghi/trang). Dữ liệu được sắp xếp giảm dần (Mới nhất lên trên cùng) để người dùng nắm bắt biến động gần nhất.
3.  **Các thuộc tính tính toán**:
    -   `progress_percent` (Trăm tiến độ): Tỉ lệ tính tay đo thông số tiến trình đã đóng hoàn tất.
    -   `actual_cost` (Chi Phí Mất Đi / Tốn kém): Thu vào số hụt chi phí tại chổ hiện thời.
    -   Mã số quy chuẩn lưu lại đánh giá text văn bản: `issues` (những phát sinh rủi ro), `resolutions` (giải trình phương án sửa lỗi), `next_tasks` (Bảng kê khai công việc sẽ thi công).
3.  **So Nhóm Hiển Thị Lên Bảng (Aggregations)**: Ở tập văn bản bản thảo này, các thông số không tham gia kết tụ vô hệ hạch toán sổ chi mà chỉ để làm các kim bài đo lường sự an toàn công việc chung. Chúng cho truy cập từ mục tab thanh menu điều khiển để báo những diễn tiến tiến triển trong ngày/tuần nhanh.

---

## 4. Đặc thù và Kiến trúc UI/UX Giao Diện

-   **Mật Độ Thể Hiện Tốc Độ Thông Tin Cao (High Density)**: Do bộ phận dự án yêu cầu lượng số liệu lớn và chập chững, giao diện thiết kết thu hẹp diện tích table, tạo kiểu bảng mác thu hẹp (VD kiểu font chữ dùng thông số Tailwind CSS tracking `text-[10px] tracking-widest`) kết tập vào luân lý đổ phân màu làm rõ (Tím đậm cho màu tổng tiền nhận giá trị mới thanh toán, Xanh lá cho việc nhận/bù hoàn vốn tạm ứng, Vàng rủi ro cho mốc cảnh biến và đo số nợ nần vượt thời tính).
-   **Tối Ưu Mobile (Mobile-First Experience)**: Phân hệ Báo cáo công việc và Form lập báo cáo được thiết kế ưu tiên cho thiết bị di động. Các nút bấm có kích thước lớn (Min 44px), Modal dạng Slide-up từ dưới lên trên mobile, và bảng biểu được chuyển đổi thành dạng Card Layout giúp cán bộ hiện trường thao tác nhanh bằng một tay ngay trên công trường.
-   **Tích hợp Popup Window Modal Window (Contextual Interactions)**: Các phân nhóm quy chuẩn có độ sâu can thiệp cao (ví dụ chèn bảng tự chép tự trích số liệu lên Form Kế Hoạch Đợt Thanh Toán) đều dùng kĩ xảo nhấc Pop-up cửa nhô (`z-[110]`), như vậy khiến trang app form chính thức không bao giờ bị trôi nền xóa số hiện đang dỡ.
-   **Máy Trình Tòa Toán Real-time Live Calculate (Real-time Math)**: Sự kiện trích sổ form ném theo chu trình live real-time ở cấp tốc 1 mili-giây khi click chuột gõ dòng, thông qua `watch` và `computed` trong lõi lập trình máy con của Vue theo dấu mọi dao động tính toán số tiền chuẩn về trả kết quả tương ứng luôn lập tức mà chẳng phải click refresh nút xem giá thử.
