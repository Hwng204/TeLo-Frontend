import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Icon } from '../../../components/pcb';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import type { AcademicYearDetail, AcademicYearListItem, ApiResponse } from '../../../types';
import { displayToast } from '../../../utils/toast';
import { toProblem } from '../../../utils/problem';

type CreateExamModalProps = {
  years: AcademicYearListItem[];
  branchId?: number;
  onClose: () => void;
  onCreated: () => void;
};

export const CreateExamModal = ({ years, branchId, onClose, onCreated }: CreateExamModalProps) => {
  const [name, setName] = useState('');
  const initialYear = years.find((year) => year.status === 'ACTIVE') ?? years[0];
  const [yearId, setYearId] = useState('');
  const effectiveYearId = yearId || initialYear?.id || '';
  const yearDetail = useAsync<ApiResponse<AcademicYearDetail>>(
    () => effectiveYearId
      ? api.academicYear.get(String(effectiveYearId))
      : Promise.resolve({ success: true, data: undefined }),
    [effectiveYearId],
  );
  const semesters = yearDetail.data?.data?.semesters ?? [];
  const [semesterId, setSemesterId] = useState('');
  const effectiveSemesterId = semesterId || semesters[0]?.id || '';
  const [grade, setGrade] = useState('5');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const semester = semesters.find((item) => item.id === effectiveSemesterId);

    if (!name.trim()) return setFormError('Vui lòng nhập tên kỳ thi.');
    if (!effectiveYearId) return setFormError('Chưa có năm học. Vui lòng tạo năm học trước.');
    if (!semester) return setFormError('Năm học chưa được cấu hình Học kỳ I và Học kỳ II.');
    if (!semester.startDate || !semester.endDate) return setFormError('Học kỳ chưa được cấu hình ngày bắt đầu và kết thúc.');
    if (!branchId) return setFormError('Tài khoản chưa được gán cơ sở trường.');

    try {
      setSaving(true);
      setFormError('');
      await api.exam.create({
        semesterId: Number(semester.id),
        schoolBranchId: branchId,
        name: name.trim(),
        startDate: semester.startDate,
        endDate: semester.endDate,
      });
      displayToast('success', 'Thành công', 'Đã tạo kỳ thi mới.');
      onCreated();
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.message : undefined;
      setFormError(message || toProblem(error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="exam-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="exam-modal" role="dialog" aria-modal="true" aria-labelledby="create-exam-title">
        <div className="exam-modal__head">
          <span className="exam-modal__icon"><Icon name="event_note" size={24} /></span>
          <div>
            <h2 id="create-exam-title">Thêm mới kỳ thi</h2>
            <p>Khởi tạo thông tin cơ bản cho kỳ thi khảo thí mới</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng"><Icon name="close" size={22} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="exam-modal__body">
            <label className="exam-form-field exam-form-field--full">
              <span>Tên kỳ thi <b>*</b></span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ví dụ: Khảo sát chất lượng đầu năm"
              />
              <small>Tên kỳ thi sẽ hiển thị trên phiếu báo danh và danh sách quản lý.</small>
            </label>

            <div className="exam-form-grid">
              <label className="exam-form-field">
                <span>Năm học <b>*</b></span>
                <select
                  value={effectiveYearId}
                  disabled={years.length === 0}
                  onChange={(event) => {
                    setYearId(event.target.value);
                    setSemesterId('');
                  }}
                >
                  {years.length === 0 && <option value="">Chưa có năm học</option>}
                  {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
                </select>
              </label>

              <fieldset className="exam-semester">
                <legend>Học kỳ <b>*</b></legend>
                <div className={semesters.length === 0 ? 'is-empty' : ''}>
                  {yearDetail.loading ? (
                    <span className="exam-semester__message">Đang tải...</span>
                  ) : semesters.length === 0 ? (
                    <span className="exam-semester__message">Chưa cấu hình học kỳ</span>
                  ) : semesters.slice(0, 2).map((semester) => (
                    <label key={semester.id} className={effectiveSemesterId === semester.id ? 'is-active' : ''}>
                      <input
                        type="radio"
                        name="semester"
                        value={semester.id}
                        checked={effectiveSemesterId === semester.id}
                        onChange={() => setSemesterId(semester.id)}
                      />
                      <i />{semester.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <label className="exam-form-field exam-form-field--full">
              <span>Khối áp dụng <b>*</b></span>
              <select value={grade} onChange={(event) => setGrade(event.target.value)}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>Khối {value} (Tiểu học)</option>
                ))}
              </select>
            </label>

            <div className="exam-info">
              <Icon name="info" size={20} />
              <p>
                <strong>Quy trình thiết lập kỳ thi:</strong>
                <span>Sau khi tạo thông tin cơ bản, bạn có thể chuyển sang chọn bộ đề chính thức/dự phòng và phân công ca thi, giám thị ở các bước tiếp theo.</span>
              </p>
            </div>

            {(formError || yearDetail.error != null) && (
              <div className="exam-form-error" role="alert">{formError || toProblem(yearDetail.error).message}</div>
            )}
          </div>

          <div className="exam-modal__foot">
            <button type="button" className="exam-secondary" onClick={onClose}>Đóng</button>
            <button type="submit" className="exam-primary" disabled={saving}>
              <Icon name="save" size={18} />{saving ? 'Đang lưu...' : 'Lưu kỳ thi'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
