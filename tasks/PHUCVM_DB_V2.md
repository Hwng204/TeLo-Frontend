# Phucvm — FE với DB v2

Thực hiện trên nhánh `phucvm` có sẵn, nền main `75191eb47a9e2eade479f63770eff5a22790fa3e`. Code chưa commit/push. BE cùng workspace: `TeLo-Backend-phucvm`.

Tài liệu đầy đủ về phase, mapping, journal/API, UI và checklist nghiệm thu: [triển khai DB v2](../../TeLo-Backend-phucvm/tasks/implementation.md). Đặc tả/bản chụp source cũ: [phucvm-rebuild](../../docs/phucvm-rebuild/README.md).

- Academic Year giữ bố cục cũ, chỉ quản lý tên năm và trạng thái; bỏ ngày/học kỳ, hỗ trợ dropdown catalog không startDate.
- Role dùng toàn hệ thống, giữ CRUD/thành viên/phân trang, bỏ scope và mô tả; bảo vệ 6 nhóm theo BE. GET kiểm tra role thiếu không ghi dữ liệu; nút bổ sung gọi POST riêng sau xác nhận Admin.
- Module là phân hệ ứng dụng, ví dụ Thi; giữ tên/mô tả/trạng thái/navbar count/CRUD, bỏ mã và tìm theo tên. Màn chọn module sau đăng nhập do người khác triển khai, không sửa trong phần phucvm.
- Question giữ editor/import/review/bank/picker; tên chương/bài native khi không có mã. Snapshot/revision do BE journal xử lý.
- Exam Package: PHT chọn ma trận sinh đề tự động trước; sau khi xem đề mới giao giáo viên hoặc tổ trưởng chỉnh sửa/review; PHT review cuối và chốt. Cả đường vào Nhiệm vụ/Kho đề dùng luồng này. URL tạo task đề cũ chuyển hướng sang tạo tự động, không giao tổ trưởng tạo đề trống.
- Kết quả success/error dùng toast như đăng nhập; ConfirmDialog dành cho xác nhận, FormDialog cho nhập liệu; RequiredLabel dùng dấu * đỏ.
- Teacher year filter và Email chưa triển khai theo quyết định người dùng.

Kiểm chứng port ban đầu: `npm run build`; ESLint các TS/TSX trong diff; self-check `adminAcademicYear`, `academicYear`, `academicYearV2`, `identity` đều đạt. Sau khi người dùng cho phép thêm dữ liệu đã có [workflow persistence TiDB](../../TeLo-Backend-phucvm/tasks/online-test-data-20261015/README.md). Lượt [hiệu chỉnh mới](../../TeLo-Backend-phucvm/tasks/PHUCVM_WORKFLOW_CORRECTION.md) build/lint lại đạt, bổ sung toast lưu câu hỏi/task và Excel; không ghi dữ liệu online. Cảnh báo bundle >500 kB còn nguyên. Chưa xác nhận giao diện trực quan vì browser tool không có phiên khả dụng.

Không dùng dữ liệu mock để tuyên bố đã chạy luồng thực tế; không tạo file seed, không sửa nghiệp vụ các màn hình khác. Các patch component dùng chung cần smoke-test màn hình đại diện trước merge như checklist trong tài liệu BE.
