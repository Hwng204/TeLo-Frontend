import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Icon } from '../../../components/pcb';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import type { ExamListItem, ExamRoom, SaveExamRoomRequest } from '../../../types';
import { roleLabel } from '../../../utils/jwt';
import { toProblem } from '../../../utils/problem';
import { storage } from '../../../utils/storage';
import { displayToast } from '../../../utils/toast';
import { ExamHeader } from '../components';
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
  const user = storage.getUser<{ fullName?: string }>();
  const [examId, setExamId] = useState<number | ''>('');
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
    <div className="exam-screen">
      <ExamHeader userName={user?.fullName} userRole={roleLabel()} />
      <main className="exam-page">
        <section className="exam-room-overview">
          <div><h1>Danh sách phòng thi</h1><p>Quản lý và thiết lập danh sách phòng thi, số lượng chỗ ngồi cho từng kỳ thi và khối lớp.</p></div>
          <div className="exam-room-summary"><span><i />Tổng phòng khả dụng: <strong>{String(visibleRooms.length).padStart(2, '0')} phòng</strong></span><span>Tổng sức chứa: <strong>{totalCapacity} chỗ</strong></span></div>
        </section>
        <section className="exam-filter-card exam-room-search">
          <div className="exam-room-search__title"><Icon name="filter_alt" size={18} />Bộ lọc tìm kiếm phòng thi</div>
          <div className="exam-room-search__fields">
            <label className="exam-form-field"><span>Kỳ thi <b>*</b></span><select value={selectedExamId || ''} onChange={(event) => setExamId(Number(event.target.value))}>{examItems.length === 0 && <option value="">Chưa có kỳ thi</option>}{examItems.map((exam) => <option key={exam.id} value={exam.id}>{exam.name}</option>)}</select></label>
            <label className="exam-form-field"><span>Khối thi</span><select value={grade} onChange={(event) => setGrade(event.target.value)}><option value="">Tất cả các khối</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Khối {value}</option>)}</select></label>
          </div>
        </section>
        <div className="exam-room-list-head">
          <span>Đang hiển thị danh sách phòng thi{selectedExam ? ` của ${selectedExam.name}` : ''}{grade ? ` — Khối ${grade}` : ''}</span>
          <button className="exam-primary" type="button" onClick={() => setEditing(null)}><Icon name="add" size={20} />Thêm mới</button>
        </div>
        {error != null && <div className="exam-error" role="alert">{toProblem(error).message}</div>}
        <section className="exam-table-card">
          <div className="exam-table-scroll"><table>
            <thead><tr><th>STT</th><th>Mã phòng thi</th><th>Tên phòng thi / vị trí</th><th>Số chỗ ngồi</th><th>Ca thi</th><th>Thao tác</th></tr></thead>
            <tbody>{rooms.loading ? <tr className="exam-loading"><td colSpan={6}><span /></td></tr> : visibleRooms.length === 0 ? <tr><td className="exam-empty" colSpan={6}><Icon name="meeting_room" size={38} /><strong>Chưa có phòng thi</strong><span>Bấm “Thêm mới” để tạo phòng thi đầu tiên.</span></td></tr> : visibleRooms.map((room, index) => <tr key={room.id}>
              <td>{index + 1}</td><td><strong className="exam-name">{room.code}</strong></td><td>{room.room.name}<small>{room.room.code} · {room.room.roomType}</small></td><td><span className="exam-room-capacity-badge">{room.candidateLimit}</span></td><td>{room.sessionCount}</td>
              <td><div className="exam-room-actions"><button type="button" onClick={() => setEditing(room)} aria-label={`Sửa ${room.code}`}><Icon name="edit" size={18} /></button><button type="button" disabled={deletingId === room.id} onClick={() => remove(room)} aria-label={`Xóa ${room.code}`}><Icon name="delete" size={18} /></button></div></td>
            </tr>)}</tbody>
          </table></div>
          <div className="exam-room-table-foot"><span>Hiển thị toàn bộ {visibleRooms.length} phòng thi</span><span>Tổng số chỗ ngồi: <strong>{totalCapacity} chỗ</strong></span></div>
        </section>
      </main>
      {editing !== undefined && <ExamRoomModal initialExamId={selectedExamId} exams={examItems} room={editing ?? undefined} onClose={() => setEditing(undefined)} onSaved={(savedExamId) => { setEditing(undefined); if (savedExamId !== selectedExamId) setExamId(savedExamId); else rooms.reload(); }} />}
    </div>
  );
};
