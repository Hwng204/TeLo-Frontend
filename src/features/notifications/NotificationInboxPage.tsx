import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Pager } from '../../components/common/Pager';
import { Icon, PcbButton } from '../../components/pcb';
import type { DirectoryPage } from '../../types/directory';
import type { NotificationInboxDetail, NotificationInboxItem } from '../../types/notificationV2';
import { isDirectoryAdmin, isStudent } from '../../utils/jwt';
import { storage } from '../../utils/storage';
import { notificationError, notificationTime, safeNotificationPath, useNotifications } from './notificationContext';

function InboxDetail({ id }: { id: number }) {
  const { api, markRead, sessionKey } = useNotifications();
  const [detail, setDetail] = useState<NotificationInboxDetail | null>(null);
  const [error, setError] = useState('');
  const [readError, setReadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!api) return;
      try {
        const result = await api.detail(id);
        if (!active || storage.getToken() !== sessionKey) return;
        setDetail(result); setError('');
        if (!result.item.readAt) {
          try { await markRead(id); } catch { if (active) setReadError(true); }
        }
      } catch (failure) { if (active && storage.getToken() === sessionKey) setError(notificationError(failure).message); }
    };
    void load();
    return () => { active = false; };
  }, [id, attempt, markRead, sessionKey, api]);
  useEffect(() => { if (detail) heading.current?.focus(); }, [detail]);
  const path = detail ? safeNotificationPath(detail.item.actionUrl) : null;
  return <section className="nt-inbox__detail" aria-label="Nội dung thông báo">
    {error ? <div className="nt-empty"><Icon name="info" size={32} /><p>{error}</p><PcbButton variant="secondary" onClick={() => setAttempt(value => value + 1)}>Thử lại</PcbButton></div> : !detail ? <div className="nt-empty" role="status">Đang tải nội dung…</div> : <>
      <div className="nt-inbox__detail-heading"><span className="nt-inbox__eyebrow"><Icon name="notifications_active" size={18} />Thông báo dành cho bạn</span><h2 ref={heading} tabIndex={-1}>{detail.item.title}</h2><p>{detail.item.schoolName} · {notificationTime(detail.item.createdAt)}</p></div>
      {readError && <div className="nt-message nt-message--error" role="alert">Chưa đánh dấu được đã đọc. <button type="button" className="nt-text-button" onClick={() => { setReadError(false); setAttempt(value => value + 1); }}>Thử lại</button></div>}
      {detail.item.summary && <p className="nt-inbox__summary">{detail.item.summary}</p>}
      <div className="nt-inbox__content">{detail.content}</div>
      {path && <div className="nt-inbox__detail-actions"><Link to={path} className="pcb-btn pcb-btn--primary">Mở nội dung liên quan <Icon name="arrow_forward" size={18} /></Link></div>}
    </>}
  </section>;
}

export function NotificationInboxPage() {
  const notifications = useNotifications();
  const [params, setParams] = useSearchParams();
  const selectedId = Number(params.get('id'));
  const unreadOnly = params.get('unread') === 'true';
  const search = params.get('search') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = [10, 20, 50].includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
  const [searchDraft, setSearchDraft] = useState(search);
  const [data, setData] = useState<DirectoryPage<NotificationInboxItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const { revision, sessionKey, api } = notifications;
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!api) return;
      setLoading(true);
      try {
        const result = await api.inbox({ page, pageSize, search, unreadOnly });
        if (active && storage.getToken() === sessionKey) { setData(result); setError(''); }
      } catch (failure) { if (active && storage.getToken() === sessionKey) { setData(null); setError(notificationError(failure).message); } }
      finally { if (active && storage.getToken() === sessionKey) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [page, pageSize, search, unreadOnly, reload, revision, sessionKey, api]);
  const update = (values: Record<string, string | null>) => setParams(previous => { const next = new URLSearchParams(previous); Object.entries(values).forEach(([key, value]) => { if (value === null) next.delete(key); else next.set(key, value); }); return next; });
  const markAll = async () => {
    if (!api || storage.getToken() !== sessionKey) return;
    // Latest server list, independent of the current page/search, defines a safe cutoff.
    setBusy(true); setActionError('');
    try {
      const latest = await api.inbox({ page: 1, pageSize: 1 });
      if (storage.getToken() !== sessionKey) return;
      if (latest.items[0]) await notifications.markAllRead(latest.items[0].createdAt);
    } catch (failure) { setActionError(notificationError(failure).message); }
    finally { setBusy(false); }
  };
  return <>
    <PageHeader title="Thông báo của tôi" inline={isDirectoryAdmin() || isStudent()} />
    <div className="nt-inbox">
      <div className="nt-inbox__intro"><div><h2>Hộp thông báo</h2><p>Cập nhật nhiệm vụ và thông tin được gửi đến bạn.</p></div><PcbButton variant="secondary" disabled={busy || !notifications.count || Boolean(error)} onClick={() => void markAll()}><Icon name="done_all" />Đánh dấu tất cả đã đọc</PcbButton></div>
      <div className="nt-inbox__toolbar"><div className="nt-tabs" aria-label="Lọc thông báo"><button type="button" aria-pressed={!unreadOnly} onClick={() => update({ unread: null, page: null })}>Tất cả</button><button type="button" aria-pressed={unreadOnly} onClick={() => update({ unread: 'true', page: null })}>Chưa đọc {notifications.count > 0 && <span>({notifications.count})</span>}</button></div><form className="nt-inbox__search" onSubmit={event => { event.preventDefault(); update({ search: searchDraft.trim() || null, page: null }); }}><Icon name="search" /><input type="search" aria-label="Tìm thông báo" placeholder="Tìm trong thông báo…" value={searchDraft} onChange={event => setSearchDraft(event.target.value)} /><button type="submit" className="nt-text-button">Tìm</button></form><button type="button" className="nt-icon-button" aria-label="Tải lại thông báo" onClick={() => { setReload(value => value + 1); void notifications.refresh(); }}><Icon name="refresh" /></button></div>
      {actionError && <p className="nt-message nt-message--error" role="alert">{actionError}</p>}
      <div className="nt-inbox__workspace"><section className="nt-inbox__list" aria-label="Danh sách thông báo" aria-busy={loading}>
        {error ? <div className="nt-empty"><Icon name="notifications_paused" size={32} /><p>{error}</p><PcbButton variant="secondary" onClick={() => setReload(value => value + 1)}>Thử lại</PcbButton></div> : loading ? <div className="nt-empty" role="status">Đang tải thông báo…</div> : !data?.items.length ? <div className="nt-empty"><Icon name="notifications_none" size={40} /><h3>{unreadOnly ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo'}</h3><p>{search ? 'Thử từ khóa khác để tìm thông báo.' : 'Thông tin mới sẽ xuất hiện tại đây.'}</p></div> : <ul>{data.items.map(item => <li key={item.id}><button type="button" className={`nt-notice${!item.readAt ? ' nt-notice--unread' : ''}${selectedId === item.id ? ' nt-notice--selected' : ''}`} aria-current={selectedId === item.id ? 'true' : undefined} onClick={() => update({ id: String(item.id) })}><span className="nt-notice__body"><strong>{item.title}</strong>{item.summary && <span>{item.summary}</span>}<small>{item.schoolName} · {notificationTime(item.createdAt)}</small></span>{!item.readAt && <span className="nt-notice__dot" aria-label="Chưa đọc" />}</button></li>)}</ul>}
      </section>{Number.isSafeInteger(selectedId) && selectedId > 0 ? <InboxDetail key={`${sessionKey}:${selectedId}`} id={selectedId} /> : <section className="nt-inbox__detail nt-empty"><Icon name="drafts" size={48} /><h3>Chọn một thông báo để xem</h3><p>Nội dung đầy đủ và đường dẫn công việc hiển thị tại đây.</p></section>}</div>
      {data && !error && <Pager page={page} pageSize={pageSize} totalCount={data.totalCount} itemLabel="thông báo" onChange={value => update({ page: String(value) })} onPageSizeChange={value => update({ size: String(value), page: null })} pageSizes={[10, 20, 50]} />}
    </div>
  </>;
}
