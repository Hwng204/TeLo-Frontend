import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, useSearchParams } from 'react-router-dom';
import { PcbButton } from '../../../components/pcb';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailSchoolItem } from '../../../types';
import { getUserId } from '../../../utils/jwt';
import { readEmailLocation, rememberEmailLocation, restoreEmailLocation } from '../../../utils/email';
import { EmailSchoolPicker } from '../components/EmailPickers';
import { EmailDialog, EmailState } from '../components/EmailUi';
import { EmailTemplates } from './EmailTemplates';
import { EmailConfiguration } from './EmailConfiguration';
import { EmailHistory } from './EmailHistory';
import { EmailEvents } from './EmailEvents';
import { EmailSend } from './EmailSend';
import './emails.css';

function SchoolEmails({ school, navigate, onDirtyChange }: { school: EmailSchoolItem; navigate: (action: () => void) => void; onDirtyChange: (dirty: boolean) => void }) {
  const events = useAsync(() => api.email.events(school.id, { pageSize: 100 }), [school.id]);
  const runtime = useAsync(() => api.email.deliveryStatus(school.id), [school.id]);
  const [params, setParams] = useSearchParams();
  const tabs = [['events', 'Sự kiện'], ['templates', 'Mẫu email'], ['configuration', 'Cấu hình thông báo'], ['send', 'Gửi thông báo'], ['history', 'Lịch sử gửi']];
  const tab = tabs.some(([key]) => key === params.get('tab')) ? params.get('tab')! : 'configuration';
  const eventCode = params.get('eventCode') ?? '';
  const setTab = (value: string) => navigate(() => setParams(current => { current.set('schoolId', String(school.id)); current.set('tab', value); if (eventCode) current.set('eventCode', eventCode); return current; }));
  const setEvent = (value: string) => navigate(() => setParams(current => { current.set('schoolId', String(school.id)); current.set('eventCode', value); return current; }));
  return <>
    <nav className="email-actions" aria-label="Quản lý email">
      {tabs.map(([key, label]) =>
        <PcbButton key={key} variant={tab === key ? 'primary' : 'secondary'} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</PcbButton>)}
    </nav>
    {!runtime.loading && runtime.data && (!runtime.data.enabled || !runtime.data.smtpConfigured) && <p className="sep-alert sep-alert--info">Dịch vụ gửi email chưa sẵn sàng. Cần quản trị máy chủ cấu hình SMTP và bật gửi email.</p>}
    <EmailState {...events} count={events.data?.items.length ?? 0} />
    {events.data && <>
      {tab === 'events' && <EmailEvents school={school} onChanged={events.reload} onOpen={(nextTab, code) => setParams(current => { current.set('tab', nextTab); current.set('eventCode', code); return current; })} />}
      {tab === 'templates' && <EmailTemplates school={school} events={events.data.items} eventCode={eventCode} onEventChange={setEvent} />}
      {tab === 'configuration' && <EmailConfiguration schoolId={school.id} events={events.data.items} eventCode={eventCode} onEventChange={setEvent} onDirtyChange={onDirtyChange} />}
      {tab === 'send' && <EmailSend schoolId={school.id} events={events.data.items} eventCode={eventCode} onEventChange={setEvent} onConfigure={() => setTab('configuration')}
        runtime={runtime.data} onDirtyChange={onDirtyChange} onQueued={() => { onDirtyChange(false); setParams(current => { current.set('tab', 'history'); return current; }); }} />}
      {tab === 'history' && <EmailHistory schoolId={school.id} events={events.data.items} />}
    </>}
  </>;
}

export function EmailManagementPage() {
  const [params, setParams] = useSearchParams();
  const userId = getUserId();
  const restored = restoreEmailLocation(params.toString(), readEmailLocation(userId));
  const rawSchool = restored.get('schoolId');
  const requestedSchool = rawSchool ? Number(rawSchool) : undefined;
  const invalidSchool = rawSchool !== null && (!Number.isSafeInteger(requestedSchool) || Number(requestedSchool) <= 0);
  const schools = useAsync(() => invalidSchool ? Promise.resolve({ items: [], page: 1, pageSize: 2, totalCount: 0, totalPages: 0 }) : api.email.schools({ page: 1, pageSize: 2, schoolId: requestedSchool }), [requestedSchool, invalidSchool]);
  const [picker, setPicker] = useState(false);
  const [dirty, updateDirty] = useState(false);
  const dirtyRef = useRef(false);
  const setDirty = useCallback((value: boolean) => { dirtyRef.current = value; updateDirty(value); }, []);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirtyRef.current && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  const navigate = (action: () => void) => action();
  const school = schools.data?.totalCount === 1 ? schools.data.items[0] : undefined;
  const restoredSearch = restored.toString();
  const currentSearch = params.toString();
  useEffect(() => {
    if (currentSearch !== restoredSearch) { setParams(restoredSearch, { replace: true }); return; }
    if (school && !rawSchool) { const next = new URLSearchParams(currentSearch); next.set('schoolId', String(school.id)); setParams(next, { replace: true }); return; }
    if (school) rememberEmailLocation(userId, new URLSearchParams(currentSearch));
  }, [currentSearch, restoredSearch, school, rawSchool, setParams, userId]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  return <main className="sep-page email-page">
    <header className="sep-pagehead"><h1>Quản lý email</h1>
      <PcbButton variant="secondary" onClick={() => setPicker(true)}>{school?.name ?? 'Chọn trường'}</PcbButton>
    </header>
    <EmailState {...schools} count={school ? 1 : 0} />
    {!schools.loading && !schools.error && !school && <p className="sep-alert sep-alert--info">{rawSchool ? 'Trường không hợp lệ hoặc bạn không có quyền truy cập. Chọn lại trường để tiếp tục.' : 'Chọn trường để quản lý cấu hình email và thông báo.'}</p>}
    {school && <SchoolEmails key={school.id} school={school} navigate={navigate} onDirtyChange={setDirty} />}
    {picker && <EmailSchoolPicker onClose={() => setPicker(false)} onChoose={value => navigate(() => {
      const next = restoreEmailLocation('', readEmailLocation(userId, value.id));
      next.set('schoolId', String(value.id)); setParams(next); setPicker(false);
    })} />}
    {blocker.state === 'blocked' && <EmailNavigationPrompt onStay={blocker.reset} onLeave={() => { setDirty(false); blocker.proceed(); }} />}
  </main>;
}

function EmailNavigationPrompt({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return <EmailDialog title="Thay đổi chưa lưu" onClose={onStay}>
    <p>Bạn có thay đổi chưa lưu. Rời trang sẽ bỏ các thay đổi này.</p>
    <div className="sep-actions"><PcbButton variant="secondary" onClick={onStay}>Ở lại</PcbButton><PcbButton onClick={onLeave}>Bỏ thay đổi</PcbButton></div>
  </EmailDialog>;
}
