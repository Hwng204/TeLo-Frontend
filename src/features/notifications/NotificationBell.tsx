import { useContext, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../../components/pcb';
import { NotificationContext, notificationTime, type NotificationState } from './notificationContext';

export function NotificationBell() {
  const inbox = useContext(NotificationContext);
  // Headers are also rendered independently in previews and existing component tests.
  return inbox ? <SessionBell inbox={inbox} /> : null;
}

function SessionBell({ inbox }: { inbox: NotificationState }) {
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const location = useLocation();
  const [previousLocation, setPreviousLocation] = useState(location.key);
  if (previousLocation !== location.key) { setPreviousLocation(location.key); setOpen(false); }
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);
  const dismiss = () => { setOpen(false); trigger.current?.focus(); };
  const toggle = () => { if (open) dismiss(); else { setOpen(true); setActionError(''); void inbox.loadLatest(unreadOnly); void inbox.refresh(); } };
  const filter = (value: boolean) => { setUnreadOnly(value); void inbox.loadLatest(value); };
  const markAll = async () => {
    // This cutoff came from the server, never the browser's clock.
    const before = inbox.latest[0]?.createdAt;
    if (!before) return;
    setBusy(true); setActionError('');
    try { await inbox.markAllRead(before); } catch { setActionError('Chưa đánh dấu được thông báo. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  if (!inbox.sessionKey) return null;
  const items = unreadOnly ? inbox.latest.filter(item => !item.readAt) : inbox.latest;
  return <div className="nt-bell" ref={root} onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); dismiss(); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <button type="button" className={`nt-bell__trigger${open ? ' nt-bell__trigger--open' : ''}`} ref={trigger} aria-label={`Thông báo, ${inbox.count} chưa đọc`} title="Thông báo" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={toggle}>
      <Icon name="notifications" size={24} />{inbox.count > 0 && <span className="nt-bell__badge" aria-hidden="true">{inbox.count > 99 ? '99+' : inbox.count}</span>}
    </button>
    {open && <section className="nt-bell__panel" id={panelId} role="dialog" aria-label="Thông báo của bạn">
      <div className="nt-bell__heading"><h2>Thông báo</h2><button type="button" className="nt-icon-button" aria-label="Đóng thông báo" ref={closeButton} onClick={dismiss}><Icon name="close" /></button></div>
      <div className="nt-bell__tools"><div className="nt-tabs" aria-label="Lọc thông báo"><button type="button" aria-pressed={!unreadOnly} onClick={() => filter(false)}>Tất cả</button><button type="button" aria-pressed={unreadOnly} onClick={() => filter(true)}>Chưa đọc</button></div><button type="button" className="nt-text-button" disabled={busy || !inbox.count || !inbox.latest.length || inbox.disabled} onClick={() => void markAll()}>Đọc tất cả</button></div>
      {actionError && <p className="nt-message nt-message--error" role="alert">{actionError}</p>}
      {inbox.error ? <div className="nt-empty"><Icon name={inbox.disabled ? 'notifications_paused' : 'wifi_off'} size={28} /><p>{inbox.error}</p><button type="button" className="nt-text-button" onClick={() => { void inbox.loadLatest(); void inbox.refresh(); }}>Thử lại</button></div> : inbox.loading ? <div className="nt-empty" role="status">Đang tải thông báo…</div> : items.length ? <ul className="nt-bell__list">{items.map(item => <li key={item.id}><Link className={`nt-notice${!item.readAt ? ' nt-notice--unread' : ''}`} to={`/notifications?id=${item.id}`} onClick={() => setOpen(false)}><span className="nt-notice__icon"><Icon name={item.eventCode.startsWith('EXAM') ? 'inventory_2' : item.eventCode.startsWith('MATRIX') ? 'table_chart' : 'assignment'} /></span><span className="nt-notice__body"><strong>{item.title}</strong>{item.summary && <span>{item.summary}</span>}<small>{item.schoolName} · {notificationTime(item.createdAt)}</small></span>{!item.readAt && <span className="nt-notice__dot" aria-label="Chưa đọc" />}</Link></li>)}</ul> : <div className="nt-empty"><Icon name="notifications_none" size={32} /><p>{unreadOnly ? 'Không có thông báo chưa đọc trong danh sách mới nhất.' : 'Bạn chưa có thông báo nào.'}</p></div>}
      <Link className="nt-bell__all" to={unreadOnly ? '/notifications?unread=true' : '/notifications'} onClick={() => setOpen(false)}>Xem tất cả thông báo <Icon name="arrow_forward" size={18} /></Link>
    </section>}
  </div>;
}
