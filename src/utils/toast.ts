export type ToastType = 'success' | 'info' | 'warning' | 'error';

const activeToastDialog = () => Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]')).at(-1) ?? null;
const toastHost = (dialog: HTMLDialogElement | null) => dialog
  ? dialog.querySelector<HTMLDivElement>(':scope > .toast-stack') ?? dialog.appendChild(Object.assign(document.createElement('div'), { className: 'toast-stack' }))
  : document.querySelector<HTMLDivElement>('#toast');
const showToastHost = (host: HTMLDivElement) => {
  if ('showPopover' in host && host.isConnected) {
    host.setAttribute('popover', 'manual');
    if (host.matches(':popover-open')) host.hidePopover();
    host.showPopover();
  }
};
const clearToastHost = (host: HTMLDivElement) => {
  if (host.childElementCount) return;
  if ('hidePopover' in host && host.isConnected && host.matches(':popover-open')) host.hidePopover();
  if (host.id !== 'toast') host.remove();
};

export const displayToast = (type: ToastType, title: string, mes: string | readonly string[], duration: number = 3) => {
  let owner = activeToastDialog();
  // Đặt toast trong dialog để nút đóng vẫn tương tác được khi phần còn lại của trang bị inert.
  const initialHost = toastHost(owner);
  if (initialHost) {
    let toastElement = initialHost;
    const toast = document.createElement('div');

    const removeToast = () => {
      owner?.removeEventListener('close', moveToast);
      toast.remove();
      clearToastHost(toastElement);
    };
    // Giữ thông báo sau khi lưu/đóng form; nếu còn dialog cha thì toast vẫn tương tác được.
    const moveToast = () => {
      if (owner?.open) return;
      owner?.removeEventListener('close', moveToast);
      const previousHost = toastElement;
      owner = activeToastDialog();
      const nextHost = toastHost(owner);
      if (!nextHost) { removeToast(); return; }
      nextHost.appendChild(toast);
      toastElement = nextHost;
      owner?.addEventListener('close', moveToast);
      clearToastHost(previousHost);
      showToastHost(nextHost);
    };
    owner?.addEventListener('close', moveToast);
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
    const messages = typeof mes === 'string' ? [mes] : mes;
    const messageElement = toast.querySelector('.toast_msg')!;
    if (messages.length > 1) {
      const list = document.createElement('ul');
      list.className = 'toast_msg toast_msg--list';
      for (const message of messages) {
        const item = document.createElement('li');
        item.textContent = message;
        list.appendChild(item);
      }
      messageElement.replaceWith(list);
    } else messageElement.textContent = messages[0] ?? '';
    
    const progressRunning = toast.querySelector('.progress-running') as HTMLElement;
    if (progressRunning) {
      progressRunning.style.animation = `progress linear ${duration}s forwards`;
    }
    
    toastElement.appendChild(toast);
    // Dialog dùng top layer. Đưa toast lên cùng lớp để lỗi lưu vẫn nhìn thấy khi biểu mẫu mở.
    showToastHost(toastElement);
  }
};
