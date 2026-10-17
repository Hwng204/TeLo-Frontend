import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Field, Icon, PcbButton } from '../../../components/pcb';
import { Pager } from '../../../components/common/Pager';
import { useAsync, useDebounce, useNotice } from '../../../hooks';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { notificationApi } from '../../../services/notificationApi';
import type { NotificationDispatch, NotificationSchool } from '../../../types/notificationV2';
import { isDirectoryAdmin } from '../../../utils/jwt';
import { NotificationDialog, RequestState } from './NotificationUi';
import { NotificationTemplates } from './NotificationTemplates';
import { NotificationComposer } from './NotificationComposer';
import { NotificationHistory } from './NotificationHistory';
import './notification-admin.css';

const tabs = [{ id: 'send', title: 'Gửi thông báo', icon: 'send' }, { id: 'automatic', title: 'Thông báo tự động', icon: 'bolt' }, { id: 'templates', title: 'Mẫu nội dung', icon: 'description' }, { id: 'history', title: 'Lịch sử gửi', icon: 'history' }];

function SchoolPicker({ onChoose, onClose }: { onChoose: (school: NotificationSchool) => void; onClose: () => void }) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const keyword = useDebounce(search, 250);
  const data = useAsync(() => notificationApi.schools({ search: keyword, page, pageSize }), [keyword, page, pageSize]);
  return <NotificationDialog title="Chọn trường quản lý thông báo" onClose={onClose}><div className="nt-admin__dialog-body"><Field label="Tìm trường theo tên hoặc mã" leading="search" type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /><RequestState {...data} empty={data.data?.items.length === 0} onRetry={data.reload} /><ul className="nt-admin__template-options">{data.data?.items.map(school => <li key={school.id}><div><strong>{school.name}</strong><small>{school.code}</small></div><PcbButton size="sm" variant="secondary" onClick={() => onChoose(school)}>Quản lý</PcbButton></li>)}</ul>{data.data && <Pager page={page} pageSize={pageSize} totalCount={data.data.totalCount} itemLabel="trường" onChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />}</div><footer className="nt-admin__footer"><PcbButton variant="secondary" onClick={onClose}>Đóng</PcbButton></footer></NotificationDialog>;
}

function SchoolWorkspace({ schoolId, tab, historyId, onTab, onDirtyChange, request, onSent }: { schoolId: number; tab: string; historyId?: number; onTab: (tab: string) => void; onDirtyChange: (dirty: boolean) => void; request: (action: () => void) => void; onSent: (result: NotificationDispatch) => void }) {
  const runtime = useAsync(() => notificationApi.runtime(), []);
  const ready = runtime.data?.schemaReady && runtime.data.enabled;
  const events = useAsync(() => ready ? notificationApi.events(schoolId) : Promise.resolve(null), [schoolId, ready]);
  const emailReady = runtime.data?.emailEnabled && runtime.data.smtpConfigured && runtime.data.workerEnabled;
  return <>
    <section className={`nt-admin__runtime${emailReady ? ' nt-admin__runtime--ready' : ''}`} aria-label="Trạng thái dịch vụ thông báo"><Icon name="mail" size={22} /><div><strong>Gmail chung của hệ thống</strong><p>{runtime.loading ? 'Đang kiểm tra trạng thái…' : runtime.error ? 'Không kiểm tra được dịch vụ. Thử lại trước khi tiếp tục.' : !runtime.data?.schemaReady ? 'Cấu trúc dữ liệu thông báo chưa sẵn sàng. Chờ cập nhật được phê duyệt trước khi sử dụng.' : emailReady ? `${runtime.data.senderEmail ?? 'Tài khoản gửi đã cấu hình'} · Sẵn sàng xử lý hàng đợi email` : 'Gửi Gmail chưa bật hoặc chưa đủ cấu hình. Kênh trong ứng dụng hoạt động độc lập.'}</p></div><PcbButton variant="ghost" size="sm" onClick={runtime.reload}><Icon name="refresh" size={17} />Kiểm tra lại</PcbButton></section>
    <RequestState {...runtime} onRetry={runtime.reload} />
    {!runtime.loading && !runtime.error && !ready && <div className="nt-admin__state"><Icon name="settings" size={34} /><h2>Thông báo chưa sẵn sàng</h2><p>Chức năng đang chờ cấu hình và cấu trúc dữ liệu phù hợp. Hệ thống không tự cập nhật database.</p></div>}
    {ready && <><RequestState {...events} onRetry={events.reload} />{events.data && <div className="nt-admin__workspace">
      {tab === 'send' && <NotificationComposer schoolId={schoolId} events={events.data} runtime={runtime.data} onDirtyChange={onDirtyChange} request={request} onSent={onSent} onCreateTemplate={() => onTab('templates')} />}
      {(tab === 'templates' || tab === 'automatic') && <NotificationTemplates key={tab} schoolId={schoolId} events={events.data} runtime={runtime.data} onDirtyChange={onDirtyChange} request={request} automaticOnly={tab === 'automatic'} />}
      {tab === 'history' && <NotificationHistory schoolId={schoolId} events={events.data} initialId={historyId} />}
    </div>}</>}
  </>;
}

export function NotificationAdminPage() {
  const [params, setParams] = useSearchParams(); const rawId = Number(params.get('schoolId')); const schoolId = Number.isSafeInteger(rawId) && rawId > 0 ? rawId : undefined;
  const tab = tabs.some(item => item.id === params.get('tab')) ? params.get('tab')! : 'send'; const rawHistoryId = Number(params.get('notificationId')); const historyId = Number.isSafeInteger(rawHistoryId) && rawHistoryId > 0 ? rawHistoryId : undefined;
  const admin = isDirectoryAdmin();
  const school = useAsync(() => admin && schoolId ? notificationApi.schools({ ids: [schoolId], pageSize: 1 }) : Promise.resolve(null), [admin, schoolId]);
  const globalRuntime = useAsync(() => admin ? notificationApi.runtime() : Promise.resolve(null), [admin]);
  const unavailable = globalRuntime.data && (!globalRuntime.data.enabled || !globalRuntime.data.schemaReady);
  const [completed, setCompleted] = useState<NotificationDispatch | null>(null);
  const navigatedDispatch = useRef<number | null>(null);
  const [picker, setPicker] = useState(false); const [dirty, setDirty] = useState(false); const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);
  const guard = useUnsavedChanges(dirty, () => {}); const notice = useNotice();
  const onTab = (value: string) => setParams(current => { current.set('tab', value); current.delete('notificationId'); return current; });
  const sent = (result: NotificationDispatch) => { setDirty(false); setCompleted(result); notice.success(result.status === 'SCHEDULED' ? 'Đã đặt lịch thông báo. Theo dõi kết quả trong Lịch sử gửi.' : 'Đã ghi nhận yêu cầu gửi thông báo. Theo dõi kết quả từng kênh trong Lịch sử gửi.'); };
  useEffect(() => {
    if (completed && !dirty && navigatedDispatch.current !== completed.id) {
      navigatedDispatch.current = completed.id;
      setParams(current => { current.set('tab', 'history'); current.set('notificationId', String(completed.id)); return current; });
    }
  }, [completed, dirty, setParams]);
  if (!admin) return <main className="sep-page nt-admin"><div className="nt-admin__state" role="alert"><Icon name="lock" size={32} /><h1>Chỉ Admin được quản lý email và thông báo</h1><p>Bạn vẫn xem thông báo gửi cho mình tại biểu tượng chuông.</p></div></main>;
  return <main className="sep-page nt-admin"><header className="nt-admin__page-heading"><div className="nt-admin__page-icon"><Icon name="mark_email_unread" size={27} /></div><div><h1>Email & thông báo</h1><p>Quản lý tập trung theo trường, gửi đúng người qua từng kênh.</p></div><PcbButton variant="secondary" disabled={!!unavailable} onClick={() => setPicker(true)}><Icon name="school" size={19} />{school.data?.items[0]?.name ?? 'Chọn trường'}<Icon name="expand_more" size={18} /></PcbButton></header>
    <RequestState {...globalRuntime} onRetry={globalRuntime.reload} />{unavailable && <section className="nt-admin__runtime"><Icon name="settings" size={24} /><div><strong>Chức năng thông báo đang chờ cấu hình</strong><p>Cần có cấu trúc dữ liệu được phê duyệt và bật dịch vụ trước khi tạo hoặc gửi thông báo. Hệ thống không tự cập nhật database.</p></div><PcbButton variant="secondary" size="sm" onClick={globalRuntime.reload}>Kiểm tra lại</PcbButton></section>}
    <nav className="nt-admin__tabs" aria-label="Quản lý thông báo">{tabs.map(item => <button key={item.id} type="button" className={tab === item.id ? 'is-active' : ''} aria-current={tab === item.id ? 'page' : undefined} onClick={() => tab !== item.id && onTab(item.id)}><Icon name={item.icon} size={20} /><span>{item.title}</span></button>)}</nav>
    {schoolId ? <><div className="nt-admin__school-context"><Icon name="domain" size={19} /><strong>{school.data?.items[0]?.name ?? 'Trường đang chọn'}</strong><span>Thông báo áp dụng trong phạm vi các phân hiệu thuộc trường.</span></div><RequestState {...school} empty={!school.loading && !school.error && !school.data?.items.length} onRetry={school.reload} />{school.data?.items.some(item => item.id === schoolId) && <SchoolWorkspace key={schoolId} schoolId={schoolId} tab={tab} historyId={historyId} onTab={onTab} onDirtyChange={onDirtyChange} request={action => guard.request(action)} onSent={sent} />}</> : <section className="nt-admin__welcome"><div className="nt-admin__welcome-symbol"><Icon name="school" size={44} /></div><h2>Chọn trường để bắt đầu</h2><p>Mỗi trường có mẫu nội dung, người nhận và lịch sử riêng.<br />Các phân hiệu của trường dùng cùng khu vực quản lý.</p><PcbButton disabled={!!unavailable} onClick={() => setPicker(true)}>Chọn trường quản lý<Icon name="arrow_forward" size={19} /></PcbButton></section>}
    {picker && <SchoolPicker onClose={() => setPicker(false)} onChoose={value => { setParams({ schoolId: String(value.id), tab }); setPicker(false); }} />}{guard.dialog}{notice.dialog}
  </main>;
}
