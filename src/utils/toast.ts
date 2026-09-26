export type ToastType = 'success' | 'info' | 'warning' | 'error';

export const displayToast = (type: ToastType, title: string, mes: string, duration: number = 3) => {
  const toastElement = document.getElementById('toast');
  if (toastElement) {
    const toast = document.createElement('div');

    const autoRemove = setTimeout(function () {
      if (toast.parentNode === toastElement) {
        toastElement.removeChild(toast);
      }
    }, duration * 1000 + 1000);

    toast.onclick = function (e: MouseEvent) {
      if ((e.target as HTMLElement).closest('.toast_close')) {
        if (toastElement.contains(toast)) {
          toastElement.removeChild(toast);
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
    toast.style.animation = `slideInLeft ease 0.3s, fadeOut ease .5s ${delay}s forwards`;
    toast.innerHTML = `
      <div class='toast_icon'>
          <i class="${icon}"></i>
      </div>    
      <div class='toast_body'>
          <h3 class='toast_title'>${title}</h3>
          <p class='toast_msg'>${mes}</p>
      </div> 
      <div class='toast_close'>
          <i class="fa-solid fa-xmark"></i>
      </div>
      <div class="progress-track"></div>
      <div class="progress-running progress--${type}"></div>
    `;
    
    const progressRunning = toast.querySelector('.progress-running') as HTMLElement;
    if (progressRunning) {
      progressRunning.style.animation = `progress linear ${duration}s forwards`;
    }
    
    toastElement.appendChild(toast);
  }
};
