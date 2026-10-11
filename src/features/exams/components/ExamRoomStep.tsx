import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PcbButton } from '../../../components/pcb';
import { RowActionButton } from '../../../components/common/RowAction';
import { TableState } from '../../../components/common/TableState';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import type { CreateExamRoomsRequest, ExamRoom, ExamRoomOption, SaveExamRoomRequest } from '../../../types';
import { toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';

type Props = {
  examId: number;
  readOnly: boolean;
  onBack: () => void;
  onNext: () => void;
};

type FormErrors = Partial<Record<'roomCount' | 'candidateLimit' | 'codePrefix' | 'roomIds', string>>;

const READY_LABELS: Record<ExamRoom['status'], string> = {
  READY: 'Sẵn sàng',
  UNAVAILABLE: 'Không khả dụng',
};

const normalizePrefix = (value: string) => value.trim().toUpperCase();

const generateCodes = (prefix: string, count: number, rooms: ExamRoom[], excludedId?: number) => {
  const used = new Set(rooms.filter((room) => room.id !== excludedId).map((room) => room.code.toUpperCase()));
  const codes: string[] = [];
  let number = 1;
  while (codes.length < count) {
    const code = `${normalizePrefix(prefix)}${String(number).padStart(2, '0')}`;
    number += 1;
    if (!used.has(code)) codes.push(code);
  }
  return codes;
};

export const ExamRoomStep = ({ examId, readOnly, onBack, onNext }: Props) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamRoom>();
  const [roomCount, setRoomCount] = useState('2');
  const [candidateLimit, setCandidateLimit] = useState('30');
  const [codePrefix, setCodePrefix] = useState('PM-');
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number>();

  const roomsRequest = useAsync(() => api.examRoom.list(examId), [examId]);
  const optionsRequest = useAsync(() => api.examRoom.options(examId), [examId]);
  const parsedCandidateLimit = Number(candidateLimit);
  const planRequest = useAsync(
    () => formOpen && Number.isInteger(parsedCandidateLimit) && parsedCandidateLimit > 0
      ? api.examRoom.plan(examId, parsedCandidateLimit)
      : Promise.resolve(undefined),
    [examId, formOpen, parsedCandidateLimit],
  );
  const rooms = useMemo(() => roomsRequest.data ?? [], [roomsRequest.data]);
  const options = useMemo(() => optionsRequest.data ?? [], [optionsRequest.data]);
  const usedRoomIds = useMemo(
    () => new Set(rooms.filter((room) => room.id !== editing?.id).map((room) => room.room.id)),
    [editing?.id, rooms],
  );
  const selectableOptions = options.filter((option) => !usedRoomIds.has(option.id));
  const planningRooms = useMemo(() => {
    const configured = rooms.map((room) => {
      if (room.id !== editing?.id) return room.room;
      return options.find((option) => option.id === selectedRoomIds[0]) ?? room.room;
    });
    if (editing) return configured;
    const configuredIds = new Set(configured.map((room) => room.id));
    return [
      ...configured,
      ...selectedRoomIds
        .filter((id) => !configuredIds.has(id))
        .map((id) => options.find((option) => option.id === id))
        .filter((room): room is ExamRoomOption => Boolean(room)),
    ];
  }, [editing, options, rooms, selectedRoomIds]);
  const requestedRoomCount = editing ? 1 : Math.max(1, 2 - rooms.length);
  const generatedCodes = editing
    ? [editing.code]
    : generateCodes(codePrefix, requestedRoomCount, rooms);
  const totalCapacity = rooms.reduce((sum, room) => sum + room.candidateLimit, 0);
  const loadError = roomsRequest.error ?? optionsRequest.error ?? (formOpen ? planRequest.error : null);

  useEffect(() => {
    if (selectedRoomIds.length <= requestedRoomCount) return;
    // Khi giảm số phòng, giữ lại các lựa chọn đầu tiên theo đúng thứ tự mã dự kiến.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoomIds((current) => current.slice(0, requestedRoomCount));
  }, [requestedRoomCount, selectedRoomIds.length]);

  const resetForm = () => {
    setEditing(undefined);
    setRoomCount('2');
    setCandidateLimit('30');
    setCodePrefix('PM-');
    setSelectedRoomIds([]);
    setErrors({});
    setRequestError('');
  };

  const openCreate = () => {
    resetForm();
    setRoomCount(String(Math.max(1, 2 - rooms.length)));
    setFormOpen(true);
  };

  const openEdit = (room: ExamRoom) => {
    setEditing(room);
    setRoomCount('1');
    setCandidateLimit(String(room.candidateLimit));
    setCodePrefix(room.code.replace(/\d+$/, '') || 'PM-');
    setSelectedRoomIds([room.room.id]);
    setErrors({});
    setRequestError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const toggleRoom = (option: ExamRoomOption) => {
    if (readOnly || usedRoomIds.has(option.id)) return;
    setSelectedRoomIds((current) => {
      if (current.includes(option.id)) return current.filter((id) => id !== option.id);
      if (current.length >= requestedRoomCount) return current;
      return [...current, option.id];
    });
    setErrors((current) => ({ ...current, roomIds: undefined }));
  };

  const validate = () => {
    const next: FormErrors = {};
    const count = Number(roomCount);
    const capacity = Number(candidateLimit);
    const prefix = normalizePrefix(codePrefix);
    if (!editing && rooms.length === 0 && count !== 2) {
      next.roomCount = 'Kỳ thi phải sử dụng đúng 2 phòng máy.';
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      next.candidateLimit = 'Số học sinh mỗi phòng phải là số nguyên lớn hơn 0.';
    }
    if (!prefix) next.codePrefix = 'Vui lòng nhập tiền tố mã phòng thi.';
    else if (!/^[A-Z0-9]+(?:[-_][A-Z0-9]+)*[-_]?$/.test(prefix)) {
      next.codePrefix = 'Tiền tố chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.';
    }
    if (selectedRoomIds.length !== requestedRoomCount) {
      next.roomIds = `Vui lòng chọn đúng ${requestedRoomCount} phòng máy.`;
    }
    return next;
  };

  const save = async (continueAfter: boolean) => {
    const nextErrors = validate();
    setErrors(nextErrors);
    setRequestError('');
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      if (editing) {
        const payload: SaveExamRoomRequest = {
          code: editing.code,
          roomId: selectedRoomIds[0],
          candidateLimit: Number(candidateLimit),
        };
        await api.examRoom.update(examId, editing.id, payload);
        displayToast('success', 'Thành công', 'Đã cập nhật phòng thi.');
      } else {
        if (rooms.length === 1) {
          await api.examRoom.create(examId, {
            code: generatedCodes[0],
            roomId: selectedRoomIds[0],
            candidateLimit: Number(candidateLimit),
          });
        } else {
          const payload: CreateExamRoomsRequest = {
            roomCount: 2,
            candidateLimit: Number(candidateLimit),
            codePrefix: normalizePrefix(codePrefix),
            roomIds: selectedRoomIds,
          };
          await api.examRoom.createBatch(examId, payload);
        }
        displayToast('success', 'Thành công', 'Đã tạo phòng thi.');
      }
      roomsRequest.reload();
      closeForm();
      if (continueAfter) onNext();
    } catch (error) {
      const problem = toProblem(error);
      setRequestError(problem.message);
      if (problem.fieldErrors) {
        setErrors({
          roomCount: problem.fieldErrors.roomCount,
          candidateLimit: problem.fieldErrors.candidateLimit,
          codePrefix: problem.fieldErrors.codePrefix,
          roomIds: problem.fieldErrors.roomIds,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save(false);
  };

  const remove = async (room: ExamRoom) => {
    if (!window.confirm(`Xóa phòng thi ${room.code}?`)) return;
    try {
      setDeletingId(room.id);
      await api.examRoom.remove(examId, room.id);
      displayToast('success', 'Thành công', 'Đã xóa phòng thi.');
      roomsRequest.reload();
    } catch (error) {
      displayToast('error', 'Không thể xóa', toProblem(error).message);
    } finally {
      setDeletingId(undefined);
    }
  };

  const continueFromList = () => {
    if (rooms.length !== 2) {
      setRequestError('Vui lòng cấu hình đúng 2 phòng máy trước khi tiếp tục.');
      return;
    }
    onNext();
  };

  if (formOpen) {
    return (
      <form className="exam-room-step exam-room-create" onSubmit={submit} noValidate>
        <h1>{editing ? 'Cập nhật phòng thi' : 'Tạo phòng thi'}</h1>
        <section className="exam-room-create__section">
          <h2>Thiết lập phòng thi</h2>
          <div className="exam-room-create__fields">
            <label className={errors.roomCount ? 'has-error' : ''}>
              <span>Số phòng thi <b>*</b></span>
              <input type="number" min="1" max="2" step="1" value={roomCount} disabled />
              {errors.roomCount && <small>{errors.roomCount}</small>}
            </label>
            <label className={errors.candidateLimit ? 'has-error' : ''}>
              <span>Số học sinh mỗi phòng <b>*</b></span>
              <input type="number" min="1" step="1" value={candidateLimit} onChange={(event) => { setCandidateLimit(event.target.value); setErrors((current) => ({ ...current, candidateLimit: undefined })); }} />
              {errors.candidateLimit && <small>{errors.candidateLimit}</small>}
            </label>
            <label className={errors.codePrefix ? 'has-error' : ''}>
              <span>Tiền tố mã phòng thi <b>*</b></span>
              <input value={codePrefix} maxLength={40} disabled={Boolean(editing)} onChange={(event) => { setCodePrefix(event.target.value.toUpperCase()); setErrors((current) => ({ ...current, codePrefix: undefined })); }} />
              {errors.codePrefix && <small>{errors.codePrefix}</small>}
            </label>
          </div>
          <div className="exam-room-create__note">
            Trường sử dụng cố định 2 phòng máy trong mỗi ca. Hệ thống tự tính số ca và chia học sinh theo thứ tự A–Z.
          </div>
        </section>

        <section className="exam-room-create__section">
          <h2>Chọn phòng máy thực tế</h2>
          <div className={`exam-room-picker${errors.roomIds ? ' has-error' : ''}`}>
            <table>
              <thead><tr><th>Chọn</th><th>Phòng máy</th><th>Mã phòng thi dự kiến</th><th>Số học sinh mỗi phòng</th></tr></thead>
              <tbody>
                {selectableOptions.map((option) => {
                  const selectedIndex = selectedRoomIds.indexOf(option.id);
                  const checked = selectedIndex >= 0;
                  return (
                    <tr key={option.id} className={checked ? 'is-selected' : ''} onClick={() => toggleRoom(option)}>
                      <td><input type="checkbox" checked={checked} disabled={readOnly} aria-label={`Chọn ${option.name}`} onChange={() => toggleRoom(option)} onClick={(event) => event.stopPropagation()} /></td>
                      <td>{option.name}<span>{option.code}</span></td>
                      <td>{checked ? generatedCodes[selectedIndex] : '—'}</td>
                      <td>{candidateLimit || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <TableState loading={optionsRequest.loading} failed={Boolean(optionsRequest.error)} empty={selectableOptions.length === 0} columns={4} title="Chưa có phòng máy khả dụng." hint="Hãy cấu hình phòng máy đang hoạt động cho cơ sở trường trước." />
          </div>
          {errors.roomIds && <p className="exam-room-create__error">{errors.roomIds}</p>}
        </section>

        <section className="exam-room-create__section">
          <h2>Kế hoạch chia ca và học sinh</h2>
          {planRequest.loading ? (
            <div className="exam-room-plan__loading">Đang tính toán từ danh sách học sinh thực tế...</div>
          ) : planRequest.data ? (
            <div className="exam-room-plan">
              <div className="exam-room-plan__summary">
                <span><strong>{planRequest.data.totalStudents}</strong> học sinh</span>
                <span><strong>{planRequest.data.capacityPerSession}</strong> học sinh/ca</span>
                <span><strong>{planRequest.data.requiredSessionCount}</strong> ca thi</span>
              </div>
              {planRequest.data.totalStudents === 0 ? (
                <p className="exam-room-plan__empty">Khối thi chưa có học sinh đang học trong năm học của kỳ thi.</p>
              ) : (
                <div className="exam-room-plan__sessions">
                  {planRequest.data.sessions.map((session) => (
                    <article key={session.sessionNumber}>
                      <h3>Ca thi {session.sessionNumber}</h3>
                      <div>
                        {session.rooms.map((plannedRoom) => {
                          const option = planningRooms[plannedRoom.roomNumber - 1];
                          const students = plannedRoom.students;
                          const first = students[0]?.fullName;
                          const last = students[students.length - 1]?.fullName;
                          return (
                            <details key={plannedRoom.roomNumber}>
                              <summary>
                                <span>{option?.name ?? `Phòng máy ${plannedRoom.roomNumber}`}</span>
                                <strong>{students.length} học sinh</strong>
                                <small>{students.length > 0 ? `${first} — ${last}` : 'Không có học sinh'}</small>
                              </summary>
                              {students.length > 0 && (
                                <ol>
                                  {students.map((student) => (
                                    <li key={student.id}><span>{student.fullName}</span><small>{student.code}</small></li>
                                  ))}
                                </ol>
                              )}
                            </details>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>

        {(requestError || loadError != null) && <div className="sep-alert" role="alert">{requestError || toProblem(loadError).message}</div>}
        <footer className="exam-form-actions">
          <PcbButton variant="secondary" type="button" onClick={closeForm}>Quay lại</PcbButton>
          {!readOnly && <div>
            <PcbButton variant="secondary" type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu nháp'}</PcbButton>
            <PcbButton type="button" disabled={saving} onClick={() => void save(true)}>Tiếp tục</PcbButton>
          </div>}
        </footer>
      </form>
    );
  }

  return (
    <section className="exam-room-step exam-room-list-step">
      <div className="exam-room-step__heading">
        <h1>Danh sách phòng thi</h1>
        {!readOnly && rooms.length < 2 && (
          <PcbButton onClick={openCreate}>{rooms.length === 0 ? 'Tạo phòng thi' : 'Thêm phòng còn lại'}</PcbButton>
        )}
      </div>
      {loadError != null && <div className="sep-alert" role="alert">{toProblem(loadError).message}</div>}
      {requestError && <div className="sep-alert" role="alert">{requestError}</div>}
      <div className="exam-room-step__table">
        <table>
          <thead><tr><th>STT</th><th>Mã phòng thi</th><th>Phòng máy</th><th>Sức chứa</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {rooms.map((room, index) => (
              <tr key={room.id}>
                <td>{index + 1}</td>
                <td>{room.code}</td>
                <td>{room.room.name}</td>
                <td>{room.candidateLimit} học sinh</td>
                <td><span className={`exam-room-ready exam-room-ready--${room.status.toLowerCase()}`}>{READY_LABELS[room.status]}</span></td>
                <td><div className="sep-row-actions">
                  <RowActionButton icon="edit" label={`Cập nhật ${room.code}`} disabled={readOnly} onClick={() => openEdit(room)} />
                  <RowActionButton icon="delete" label={`Xóa ${room.code}`} disabled={readOnly || deletingId === room.id} onClick={() => void remove(room)} />
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <TableState loading={roomsRequest.loading} failed={Boolean(roomsRequest.error)} empty={rooms.length === 0} columns={6} title="Chưa có phòng thi." hint="Bấm “Tạo phòng thi” để chọn phòng máy cho kỳ thi." />
      </div>
      {rooms.length > 0 && <p className="exam-room-step__summary">{rooms.length} phòng thi · Tổng sức chứa {totalCapacity} học sinh</p>}
      <footer className="exam-form-actions">
        <PcbButton variant="secondary" onClick={onBack}>Quay lại</PcbButton>
        <div><PcbButton onClick={continueFromList}>Tiếp tục</PcbButton></div>
      </footer>
    </section>
  );
};
