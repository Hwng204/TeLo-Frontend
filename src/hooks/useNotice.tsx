import { useState } from 'react';
import { NoticeDialog, type Notice } from '../components/common/NoticeDialog';

/** `error/success/confirm` mở popup, `dialog` là phần tử cần đặt trong JSX của màn. */
export const useNotice = () => {
  const [notice, setNotice] = useState<Notice | null>(null);
  const close = () => setNotice(null);
  const lines = (message: string | string[]) => (Array.isArray(message) ? message : [message]);
  return {
    error: (message: string | string[]) => setNotice({ kind: 'error', messages: lines(message) }),
    success: (message: string) => setNotice({ kind: 'success', messages: [message] }),
    confirm: (message: string, onConfirm: () => void, confirmLabel?: string) =>
      setNotice({ kind: 'confirm', messages: [message], onConfirm, confirmLabel }),
    dialog: <NoticeDialog notice={notice} onClose={close} />,
  };
};
