import { useState } from 'react';
import { PcbButton } from '../../../components/pcb';
import { useBusy, useNotice } from '../../../hooks';
import { api } from '../../../services/api';
import type { EmailRecipientOption, EmailTemplateItem } from '../../../types';
import { problemLines, toProblem } from '../../../utils/problem';
import { EmailRecipientPicker } from './EmailPickers';
import { EmailRevisionPicker } from './EmailRevisionPicker';
import { EmailDialog } from './EmailUi';

export function EmailTestDialog({ schoolId, template, onClose, onQueued }: {
  schoolId: number; template: EmailTemplateItem; onClose: () => void; onQueued: () => void;
}) {
  const [recipient, setRecipient] = useState<EmailRecipientOption | null>(null);
  const [revision, setRevision] = useState({ id: template.latestRevisionId, label: 'Phiên bản mới nhất' });
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [picker, setPicker] = useState<'recipient' | 'revision' | null>(null);
  const [failure, setFailure] = useState('');
  const [busy, run] = useBusy();
  const notice = useNotice();
  const send = () => {
    if (!recipient) return;
    notice.confirm(`Gửi email thử “${template.name}” đến ${recipient.name} (${recipient.email || 'email tài khoản'})?`, () => void run(async () => {
      setFailure('');
      try {
        await api.email.test(schoolId, { revisionId: revision.id, recipientUserId: recipient.id, requestId });
        onQueued();
      } catch (error) { setFailure(problemLines(toProblem(error)).join(' ')); }
    }), 'Xác nhận gửi thử');
  };
  return <EmailDialog title="Gửi thử mẫu email" onClose={onClose} busy={busy}>
    {failure && <div className="sep-alert" role="alert">{failure}</div>}
    <h3>{template.name}</h3>
    <div className="email-form"><PcbButton variant="secondary" disabled={busy} onClick={() => setPicker('revision')}>{revision.label}</PcbButton>
      <PcbButton variant="secondary" disabled={busy} onClick={() => setPicker('recipient')}>{recipient ? `${recipient.name} · ${recipient.email || 'Chưa có email'}` : 'Chọn người nhận trong trường'}</PcbButton>
      <div className="sep-actions"><PcbButton variant="secondary" disabled={busy} onClick={onClose}>Hủy</PcbButton><PcbButton disabled={busy || !recipient} onClick={send}>{busy ? 'Đang xếp hàng…' : 'Gửi thử'}</PcbButton></div>
    </div>
    {picker === 'recipient' && <EmailRecipientPicker schoolId={schoolId} kind="user" multiple={false} onClose={() => setPicker(null)} onChoose={items => { setRecipient(items[0]); setRequestId(crypto.randomUUID()); setPicker(null); }} />}
    {picker === 'revision' && <EmailRevisionPicker schoolId={schoolId} eventCode={template.eventCode} initialTemplate={template} onClose={() => setPicker(null)} onChoose={item => { setRevision({ id: item.id, label: `Phiên bản ${item.revision}` }); setRequestId(crypto.randomUUID()); setPicker(null); }} />}
    {notice.dialog}
  </EmailDialog>;
}
