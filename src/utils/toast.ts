export type ToastType = 'success' | 'info' | 'warning' | 'error';

export const displayToast = (type: ToastType, title: string, mes: string, duration: number = 3) => {
  const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog[open]');
  const activeDialog = dialogs.item(dialogs.length - 1);
  // Đặt toast trong dialog để nút đóng vẫn tương tác được khi phần còn lại của trang bị inert.
  const toastElement = activeDialog
    ? activeDialog.querySelector<HTMLDivElement>(':scope > .toast-stack') ?? activeDialog.appendChild(Object.assign(document.createElement('div'), { className: 'toast-stack' }))
    : document.getElementById('toast');
  if (toastElement) {
    const toast = document.createElement('div');

    const removeToast = () => {
      toast.remove();
      if (!toastElement.childElementCount) {
        if (toastElement.hasAttribute('popover')) toastElement.hidePopover();
        if (activeDialog) toastElement.remove();
      }
    };
    const autoRemove = setTimeout(removeToast, duration * 1000 + 1000);

    toast.onclick = function (e: MouseEvent) {
      if ((e.target as HTMLElement).closest('.toast_close')) {
        if (toastElement.contains(toast)) {
          removeToast();
          clearTimeout(autoRemove);
        }
      }
    };

    const icons = {
      success: 'fa-solid fa-circle-check',
      info: 'fa-solid fa-circle-info',
      warning: 'fa-solid fa-circle-exclamation',
      error: 'fa-solid fa-circle-exclamation',
    };
    const icon = icons[type];
    const delay = duration;
    
    toast.classList.add('toast', `toast--${type}`);
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.style.animation = `slideInLeft ease 0.3s, fadeOut ease .5s ${delay}s forwards`;
    toast.innerHTML = `
      <div class='toast_icon'>
          <i class="${icon}"></i>
      </div>    
      <div class='toast_body'>
          <h3 class='toast_title'></h3>
          <p class='toast_msg'></p>
      </div> 
      <button type="button" class='toast_close' aria-label="Đóng thông báo">
          <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="progress-track"></div>
      <div class="progress-running progress--${type}"></div>
    `;
    // Nội dung có thể đến từ tên vai trò hoặc lỗi API; luôn hiển thị dưới dạng văn bản.
    toast.querySelector('.toast_title')!.textContent = title;
    toast.querySelector('.toast_msg')!.textContent = mes;
    
    const progressRunning = toast.querySelector('.progress-running') as HTMLElement;
    if (progressRunning) {
      progressRunning.style.animation = `progress linear ${duration}s forwards`;
    }
    
    toastElement.appendChild(toast);
    // Dialog dùng top layer. Đưa toast lên cùng lớp để lỗi lưu vẫn nhìn thấy khi biểu mẫu mở.
    if ('showPopover' in toastElement) {
      toastElement.setAttribute('popover', 'manual');
      toastElement.hidePopover();
      toastElement.showPopover();
    }
  }
};
