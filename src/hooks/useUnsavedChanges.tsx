import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

/** One guard per workspace; covers router navigation and local changes of editor. */
export const useUnsavedChanges = (dirty: boolean, onDiscard: () => void, busy = false) => {
  const blocker = useBlocker(dirty || busy);
  const proceeding = useRef(false);
  const [pending, setPending] = useState<{ proceed: () => void; discard: () => void } | null>(null);
  useEffect(() => {
    // A route requested during saving can continue when the save has succeeded.
    if (blocker.state === 'unblocked') proceeding.current = false;
    if (!dirty && !busy && blocker.state === 'blocked' && !proceeding.current) {
      proceeding.current = true; blocker.proceed();
    }
  }, [dirty, busy, blocker]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);
  const request = (action: () => void, when = dirty, discardChanges = onDiscard) => {
    if (busy) return;
    if (when) setPending({ proceed: action, discard: discardChanges }); else action();
  };
  const cancel = () => { setPending(null); if (blocker.state === 'blocked') blocker.reset(); };
  const discard = () => {
    if (busy) return;
    const action = pending; setPending(null);
    if (blocker.state === 'blocked') {
      onDiscard(); proceeding.current = true; blocker.proceed();
    } else { action?.discard(); action?.proceed(); }
  };
  return { request, dialog: <ConfirmDialog isOpen={pending !== null || blocker.state === 'blocked'} title={busy ? 'Đang lưu thay đổi' : 'Bạn có thay đổi chưa lưu'} message={busy ? 'Vui lòng chờ thao tác hiện tại hoàn tất.' : 'Nội dung đang nhập chưa được lưu. Bạn muốn tiếp tục chỉnh sửa hay bỏ thay đổi để rời khỏi phần này?'} cancelText="Tiếp tục chỉnh sửa" confirmText="Bỏ thay đổi" type="warning" isLoading={busy} onCancel={cancel} onConfirm={discard} /> };
};
