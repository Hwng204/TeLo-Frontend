# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Phó Hiệu trưởng (PHT)** — Hiệu trưởng có cùng quyền — của Trường Tiểu học Phạm Công Bình. Dùng trên máy tính ở trường.
- **Tổ trưởng** chuyên môn của cùng trường. Dùng trên máy tính ở trường.

## Product Purpose

Quản lý ma trận đề thi (exam matrix) theo quy trình giao việc và duyệt:

- PHT giao nhiệm vụ lập ma trận cho Tổ trưởng, tự tạo ma trận, xác nhận / từ chối / lưu trữ / xuất Excel / tạo phiên bản mới từ ma trận có sẵn.
- Tổ trưởng nhận nhiệm vụ, soạn ma trận theo tỷ lệ % điểm (tổng phải đủ 100% mới nộp được), rồi nộp cho PHT.

## Operating Context

- Ma trận gắn với một ngữ cảnh học thuật (Chương trình, Môn học, Khối lớp, Năm học) và tuỳ chọn Học kỳ. Mỗi dòng là một bài học, chia theo 3 mức nhận thức (Nhận biết, Thông hiểu, Vận dụng), mỗi ô có số câu và tỷ lệ % điểm.
- Trạng thái ma trận: Nháp, Đã nộp, Đã duyệt, Đã lưu trữ. Trạng thái nhiệm vụ: Đã giao, Đã nộp, Hoàn thành. Nhiệm vụ có hạn hoàn thành (tuỳ chọn).
- Backend quyết định quyền trên từng ma trận (`allowedActions`); giao diện chỉ hiện hành động mà backend cho phép.

## Capabilities and Constraints

- Nhiệm vụ chưa có API sửa/xoá; danh sách ma trận chưa trả quyền của từng dòng. Thao tác nhanh trên danh sách chỉ là điều hướng luôn đúng (xem, lập/mở ma trận), không có sửa/xoá ở danh sách.
- Tổ trưởng không vào được danh sách ma trận; họ đi qua danh sách nhiệm vụ.
- Toàn bộ nội dung giao diện bằng tiếng Việt.

## Brand Commitments

- Tên trường "Tiểu học Phạm Công Bình" và logo `public/logo-pcb.png`.
- Bảng màu, token và kiểu chữ Inter lấy từ thiết kế Figma của nhóm (`src/styles/tokens.css`, `--pcb-*`, `--sep-*`); các màn ma trận phải giữ đúng hệ màu này.

## Product Principles

1. Người dùng phải biết ngay việc nào đang chờ mình, việc nào quá hạn, việc nào đã xong.
2. Không hiển thị hành động mà backend không cho phép hoặc không tồn tại.
3. Giữ nguyên nghiệp vụ khi đổi giao diện: không bớt bước, không bớt kiểm tra.
