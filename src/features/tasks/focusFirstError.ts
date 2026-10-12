/**
 * Sau khi gắn lỗi vào form: cuộn tới và đặt con trỏ vào ô lỗi đầu tiên theo thứ tự trên trang.
 * Chạy ở khung hình kế tiếp để React kịp vẽ viền lỗi.
 */
export const focusFirstError = () =>
  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLElement>(
      '.sep-page .pcb-control--error :is(input, button, textarea), .sep-page [aria-invalid="true"]',
    );
    field?.scrollIntoView({ block: 'center' });
    field?.focus({ preventScroll: true });
  });
