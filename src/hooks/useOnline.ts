import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

/** Trình duyệt có đang báo có mạng không. `true` chưa chắc tới được máy chủ, nhưng `false` thì chắc chắn không. */
export const useOnline = (): boolean => useSyncExternalStore(subscribe, () => navigator.onLine);
