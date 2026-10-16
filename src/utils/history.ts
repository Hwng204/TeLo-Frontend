/**
 * Trước trang hiện tại có mục lịch sử nào của app không. React Router ghi `idx` vào history.state: 0 là trang
 * mở đầu tab và giữ nguyên khi replace, nên mở thẳng link rồi bị replace vẫn ra 0 (`location.key` thì không).
 *
 * shortcut: dựa vào `idx` nội bộ của React Router 6/7; kiểm lại khi nâng phiên bản lớn.
 */
export const canGoBack = (): boolean => ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
