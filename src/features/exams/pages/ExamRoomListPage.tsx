import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { RowActionButton } from '../../../components/common/RowAction';
import { TableState } from '../../../components/common/TableState';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import type { ExamListItem, ExamRoom, SaveExamRoomRequest } from '../../../types';
import { toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';
import './exams.css';

type ExamRoomModalProps = {
  initialExamId: number;
  exams: ExamListItem[];
  room?: ExamRoom;
  onClose: () => void;
  onSaved: (examId: number) => void;
};

const ExamRoomModal = ({ initialExamId, exams, room, onClose, onSaved }: ExamRoomModalProps) => {
  const [examId, setExamId] = useState(initialExamId);
  const [grade, setGrade] = useState(/^k([1-5])p/i.exec(room?.code ?? '')?.[1] ?? '5');
  const [code, setCode] = useState(room?.code ?? '');
  const [roomId, setRoomId] = useState(String(room?.room.id ?? ''));
  const [candidateLimit, setCandidateLimit] = useState(String(room?.candidateLimit ?? 24));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const roomOptions = useAsync(
    () => examId ? api.examRoom.options(examId) : Promise.resolve([]),
    [examId],
  );
  const existingRooms = useAsync(
    () => examId ? api.examRoom.list(examId) : Promise.resolve([]),
    [examId],
  );
  const options = roomOptions.data ?? [];
  const matchingNumbers = (existingRooms.data ?? [])
    .map((item) => new RegExp(`^k${grade}p(\\d+)$`, 'i').exec(item.code)?.[1])
    .filter((value): value is string => value != null)
    .map(Number);
  const suggestedCode = `k${grade}p${String(Math.max(0, ...matchingNumbers) + 1).padStart(2, '0')}`;
  const effectiveCode = code || suggestedCode;
  const effectiveRoomId = Number(roomId || options[0]?.id || 0);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedCode = effectiveCode.trim().toLowerCase();
    const payload: SaveExamRoomRequest = {
      code: normalizedCode,
      roomId: effectiveRoomId,
      candidateLimit: Number(candidateLimit),
    };
    if (!examId) return setError('Vui lòng chọn kỳ thi.');
    if (!/^k[1-5]p\d{2,}$/i.test(normalizedCode)) return setError('Mã phòng thi phải có dạng k5p01.');
    if (!payload.roomId) return setError('Vui lòng chọn phòng học.');
    if (!Number.isInteger(payload.candidateLimit) || payload.candidateLimit <= 0) {
      return setError('Số chỗ ngồi phải là số nguyên lớn hơn 0.');
    }

    try {
      setSaving(true);
      setError('');
      if (room) await api.examRoom.update(examId, room.id, payload);
      else await api.examRoom.create(examId, payload);
      displayToast('success', 'Thành công', room ? 'Đã cập nhật phòng thi.' : 'Đã thêm phòng thi.');
      onSaved(examId);
    } catch (requestError) {
      setError(toProblem(requestError).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="exam-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="exam-modal exam-room-modal" role="dialog" aria-modal="true" aria-labelledby="exam-room-modal-title">
        <div className="exam-modal__head">
          <span className="exam-modal__icon"><Icon name="add_circle" size={22} /></span>
          <div><h2 id="exam-room-modal-title">{room ? 'Cập nhật phòng thi' : 'Thêm mới phòng thi'}</h2><p>Thiết lập phòng thi theo kỳ thi và khối lớp</p></div>
          <button type="button" onClick={onClose} aria-label="Đóng"><Icon name="close" size={22} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="exam-modal__body">
            <div className="exam-form-grid">
              <label className="exam-form-field">
                <span>Kỳ thi <b>*</b></span>
                <select value={examId || ''} disabled={room != null} onChange={(event) => { setExamId(Number(event.target.value)); setRoomId(''); setCode(''); }}>
                  {exams.length === 0 && <option value="">Chưa có kỳ thi để lựa chọn</option>}
                  {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
                </select>
              </label>
              <label className="exam-form-field">
                <span>Khối thi <b>*</b></span>
                <select value={grade} onChange={(event) => { setGrade(event.target.value); setCode(''); }}>
                  {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Khối {value}</option>)}
                </select>
              </label>
              <label className="exam-form-field">
                <span>Mã phòng thi <b>*</b></span>
                <input autoFocus value={effectiveCode} onChange={(event) => setCode(event.target.value)} placeholder="k5p01" />
                <small>Mã được gợi ý tự động và duy nhất trong kỳ thi.</small>
              </label>
              <label className="exam-form-field">
                <span>Tên phòng thi / vị trí <b>*</b></span>
                <select value={effectiveRoomId || ''} onChange={(event) => setRoomId(event.target.value)} disabled={roomOptions.loading || options.length === 0}>
                  {options.length === 0 && <option value="">Cơ sở chưa có phòng học</option>}
                  {options.map((option) => <option key={option.id} value={option.id}>{option.name} — {option.code}</option>)}
                </select>
              </label>
            </div>
            <label className="exam-form-field exam-form-field--full">
              <span>Số chỗ ngồi <b>*</b></span>
              <div className="exam-room-capacity"><input type="number" min="1" step="1" value={candidateLimit} onChange={(event) => setCandidateLimit(event.target.value)} placeholder="Ví dụ: 24" /><span>thí sinh</span></div>
            </label>
            {exams.length === 0 && !error && (
              <div className="exam-info">
                <Icon name="info" size={20} />
                <p><strong>Chưa có kỳ thi</strong><span>Vui lòng tạo kỳ thi trước khi thêm phòng thi.</span></p>
              </div>
            )}
            {(error || roomOptions.error != null || existingRooms.error != null) && <div className="exam-form-error" role="alert">{error || toProblem(roomOptions.error ?? existingRooms.error).message}</div>}
          </div>
          <div className="exam-modal__foot">
            <button type="button" className="exam-secondary" onClick={onClose}><Icon name="arrow_back" size={17} />Đóng</button>
            <button type="submit" className="exam-primary" disabled={saving || !examId || roomOptions.loading || options.length === 0}><Icon name="save" size={18} />{saving ? 'Đang lưu...' : 'Lưu phòng thi'}</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export const ExamRoomListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const examIdFromUrl = Number(searchParams.get('examId'));
  const [examId, setExamId] = useState<number | ''>(Number.isFinite(examIdFromUrl) && examIdFromUrl > 0 ? examIdFromUrl : '');
  const [grade, setGrade] = useState('');
  const [editing, setEditing] = useState<ExamRoom | null | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number>();
  const exams = useAsync(() => api.exam.list({ pageNumber: 1, pageSize: 100 }), []);
  const examItems = useMemo(() => exams.data?.data?.items ?? [], [exams.data]);
  const selectedExamId = Number(examId || examItems[0]?.id || 0);
  const rooms = useAsync(() => selectedExamId ? api.examRoom.list(selectedExamId) : Promise.resolve([]), [selectedExamId]);
  const selectedExam = examItems.find((exam) => exam.id === selectedExamId);
  const visibleRooms = (rooms.data ?? []).filter((room) => !grade || room.code.toLowerCase().startsWith(`k${grade}p`));
  const totalCapacity = visibleRooms.reduce((total, room) => total + room.candidateLimit, 0);
  const error = exams.error ?? rooms.error;

  const changeExam = (value: string) => {
    const nextId = Number(value);
    setExamId(nextId || '');
    if (nextId) setSearchParams({ examId: String(nextId) }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const remove = async (room: ExamRoom) => {
    if (!window.confirm(`Xóa phòng thi ${room.code}? Thao tác này không thể hoàn tác.`)) return;
    try {
      setDeletingId(room.id);
      await api.examRoom.remove(selectedExamId, room.id);
      displayToast('success', 'Thành công', 'Đã xóa phòng thi.');
      rooms.reload();
    } catch (requestError) {
      displayToast('error', 'Không thể xóa', toProblem(requestError).message);
    } finally {
      setDeletingId(undefined);
    }
  };

  return (
    <>
      <PageHeader title="Danh sách phòng thi" />
      <main className="sep-page">
        <div className="sep-toolbar">
          <div className="sep-toolbar__filters">
            <label className="pcb-field exam-room-exam-filter">
              <span className="pcb-label pcb-label--hidden">Kỳ thi</span>
              <span className="pcb-control exam-native-control">
                <select aria-label="Kỳ thi" value={selectedExamId || ''} onChange={(event) => changeExam(event.target.value)}>
                  <option value="">{examItems.length === 0 ? 'Chưa có kỳ thi' : 'Chọn kỳ thi'}</option>
                  {examItems.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
                </select>
                <Icon name="expand_more" size={18} />
              </span>
            </label>
            <label className="pcb-field exam-grade-filter">
              <span className="pcb-label pcb-label--hidden">Khối thi</span>
              <span className="pcb-control exam-native-control">
                <select aria-label="Khối thi" value={grade} onChange={(event) => setGrade(event.target.value)}>
                  <option value="">Khối</option>
                  {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Khối {value}</option>)}
                </select>
                <Icon name="expand_more" size={18} />
              </span>
            </label>
          </div>
          <div className="sep-toolbar__actions">
            <PcbButton onClick={() => setEditing(null)}>Thêm phòng thi <Icon name="add" size={20} /></PcbButton>
          </div>
        </div>

        <div className="exam-room-meta">
          <span>Danh sách{selectedExam ? ` của ${selectedExam.name}` : ''}{grade ? ` — Khối ${grade}` : ''}</span>
          <span><strong>{visibleRooms.length}</strong> phòng · <strong>{totalCapacity}</strong> chỗ ngồi</span>
        </div>
        {error != null && <div className="sep-alert" role="alert">{toProblem(error).message}</div>}
        <div className="pcb-table-wrap">
          <table className="pcb-table">
            <thead><tr><th className="sep-col-index">STT</th><th>Mã phòng thi</th><th>Tên phòng thi / vị trí</th><th>Số chỗ ngồi</th><th>Ca thi</th><th className="sep-col-actions">Hành động</th></tr></thead>
            <tbody>{visibleRooms.map((room, index) => <tr key={room.id}>
              <td className="sep-col-index">{index + 1}</td><td><strong className="sep-row-link">{room.code}</strong></td><td>{room.room.name}<div className="sep-subline">{room.room.code} · {room.room.roomType}</div></td><td><span className="sep-status sep-status--blue">{room.candidateLimit} chỗ</span></td><td>{room.sessionCount}</td>
              <td className="sep-col-actions"><div className="sep-row-actions"><RowActionButton icon="edit" label={`Sửa ${room.code}`} onClick={() => setEditing(room)} /><RowActionButton icon="delete" label={`Xóa ${room.code}`} disabled={deletingId === room.id} onClick={() => void remove(room)} /></div></td>
            </tr>)}</tbody>
          </table>
          <TableState loading={rooms.loading || exams.loading} failed={Boolean(error)} empty={visibleRooms.length === 0} columns={6} title="Chưa có phòng thi nào khớp bộ lọc." hint={selectedExamId ? 'Bấm “Thêm phòng thi” để tạo phòng thi đầu tiên.' : 'Hãy tạo hoặc chọn một kỳ thi trước.'} />
        </div>
      </main>
      {editing !== undefined && <ExamRoomModal initialExamId={selectedExamId} exams={examItems} room={editing ?? undefined} onClose={() => setEditing(undefined)} onSaved={(savedExamId) => { setEditing(undefined); if (savedExamId !== selectedExamId) changeExam(String(savedExamId)); else rooms.reload(); }} />}
    </>
  );
};
