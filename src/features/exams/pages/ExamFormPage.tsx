import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Field, PcbButton, SelectField } from '../../../components/pcb';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync } from '../../../hooks';
import { api } from '../../../services/api';
import type { CreateExamRequest, ExamStatus, UpdateExamRequest } from '../../../types';
import { parseJwt } from '../../../utils/jwt';
import { storage } from '../../../utils/storage';
import { displayToast } from '../../../utils/toast';
import { toProblem } from '../../../utils/problem';
import { ExamRoomStep } from '../components/ExamRoomStep';
import './exams.css';

type ExamFormMode = 'create' | 'edit' | 'view';
type FormField = 'name' | 'yearId' | 'semesterId' | 'gradeLevelId' | 'subjectId' | 'startAt' | 'endAt';
type FormErrors = Partial<Record<FormField, string>>;

const STEPS = ['Thông tin kỳ thi', 'Phòng thi', 'Chọn đề', 'Ca thi & giám thị', 'Kiểm tra & chốt'];

const RequiredLabel = ({ children }: { children: ReactNode }) => (
  <>{children} <span className="exam-required" aria-hidden="true">*</span></>
);

const getBranchId = () => {
  const token = storage.getToken();
  if (!token) return undefined;
  const id = Number(parseJwt(token).branch_id);
  return Number.isFinite(id) && id > 0 ? id : undefined;
};

const combineDateTime = (date?: string, time?: string) => date ? `${date}T${(time || '00:00').slice(0, 5)}` : '';
const splitDateTime = (value: string) => {
  const [date = '', time = ''] = value.split('T');
  return { date, time: time.length === 5 ? `${time}:00` : time };
};

const WizardSteps = ({ activeStep, onSelect }: { activeStep: number; onSelect: (step: number) => void }) => (
  <ol className="exam-wizard" aria-label="Tiến trình thiết lập kỳ thi">
    {STEPS.map((label, index) => {
      const step = index + 1;
      return (
        <li key={label} className={step === activeStep ? 'is-active' : step < activeStep ? 'is-complete' : ''}>
          <button type="button" aria-current={step === activeStep ? 'step' : undefined} onClick={() => onSelect(step)}>
            <span>{step < activeStep ? '✓' : step}</span>
            <strong>{label}</strong>
          </button>
        </li>
      );
    })}
  </ol>
);

export const ExamFormPage = ({ mode }: { mode: ExamFormMode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const examId = Number(id);
  const [searchParams] = useSearchParams();
  const requestedStep = mode === 'create' ? 1 : Number(searchParams.get('step') || 1);
  const activeStep = Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 5 ? requestedStep : 1;
  const readOnly = mode === 'view';

  const [name, setName] = useState('');
  const [yearId, setYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [gradeLevelId, setGradeLevelId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [status, setStatus] = useState<ExamStatus>('DRAFT');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const optionsRequest = useAsync(() => api.exam.options(), []);
  const detail = useAsync(
    () => mode === 'create' || !examId ? Promise.resolve(undefined) : api.exam.get(examId),
    [mode, examId],
  );
  const options = optionsRequest.data?.data;
  const years = useMemo(() => options?.academicYears ?? [], [options]);
  const selectedYear = years.find((year) => year.id === Number(yearId));
  const semesters = useMemo(() => selectedYear?.semesters ?? [], [selectedYear]);
  const exam = detail.data?.data;
  const branchId = exam?.schoolBranch.id ?? getBranchId();
  const candidateCountRequest = useAsync(
    () => yearId && gradeLevelId && branchId
      ? api.exam.candidateCount(Number(yearId), branchId, Number(gradeLevelId))
      : Promise.resolve(undefined),
    [yearId, gradeLevelId, branchId],
  );
  const candidateCountHint = !yearId || !gradeLevelId
    ? undefined
    : candidateCountRequest.loading
      ? 'Đang tính sĩ số của khối...'
      : candidateCountRequest.error
        ? 'Chưa thể tải sĩ số của khối.'
        : `Khối này có ${candidateCountRequest.data?.studentCount ?? 0} học sinh đang học trong năm học đã chọn.`;

  useEffect(() => {
    if (mode !== 'create' || yearId || years.length === 0) return;
    const initialYear = years.find((year) => year.status === 'ACTIVE' && year.semesters.length > 0)
      ?? years.find((year) => year.semesters.length > 0)
      ?? years.find((year) => year.status === 'ACTIVE')
      ?? years[0];
    // Options được tải bất đồng bộ; chọn năm hiện hành sau khi request hoàn tất.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYearId(String(initialYear.id));
  }, [mode, yearId, years]);

  useEffect(() => {
    if (mode !== 'create' || !yearId || semesterId || semesters.length === 0) return;
    // Tự chọn học kỳ đầu tiên của năm học để form luôn dùng một cặp năm/học kỳ hợp lệ.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSemesterId(String(semesters[0].id));
  }, [mode, semesterId, semesters, yearId]);

  useEffect(() => {
    if (!exam) return;
    // Nạp DTO chi tiết vào form sau khi request hoàn tất.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(exam.name);
    setYearId(String(exam.academicYear.id));
    setSemesterId(String(exam.semester.id));
    setGradeLevelId(exam.gradeLevel ? String(exam.gradeLevel.id) : '');
    setSubjectId(exam.subject ? String(exam.subject.id) : '');
    setStartAt(combineDateTime(exam.startDate, exam.startTime));
    setEndAt(combineDateTime(exam.endDate, exam.endTime));
    setStatus(exam.status);
  }, [exam]);

  const loading = optionsRequest.loading || detail.loading;
  const loadError = optionsRequest.error ?? detail.error;
  const missingCatalogMessages = useMemo(() => {
    if (optionsRequest.loading || optionsRequest.error || !options) return [];

    const messages: string[] = [];
    if (years.length === 0) {
      messages.push('Chưa có năm học trong hệ thống.');
    } else if (yearId && semesters.length === 0) {
      messages.push('Năm học đã chọn chưa được cấu hình học kỳ.');
    }
    if (options.gradeLevels.length === 0) messages.push('Chưa có khối học đang hoạt động.');
    if (options.subjects.length === 0) messages.push('Chưa có môn học đang hoạt động.');
    return messages;
  }, [options, optionsRequest.error, optionsRequest.loading, semesters.length, yearId, years.length]);
  const clearError = (field: FormField) => setFieldErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });

  const validate = (): FormErrors => {
    const errors: FormErrors = {};
    if (!name.trim()) errors.name = 'Vui lòng nhập tên kỳ thi.';
    if (!yearId) errors.yearId = 'Vui lòng chọn năm học.';
    if (!semesterId) errors.semesterId = 'Vui lòng chọn học kỳ.';
    if (!gradeLevelId) errors.gradeLevelId = 'Vui lòng chọn khối thi.';
    if (!subjectId) errors.subjectId = 'Vui lòng chọn môn thi.';
    if (!startAt) errors.startAt = 'Vui lòng nhập ngày và giờ bắt đầu.';
    if (!endAt) errors.endAt = 'Vui lòng nhập ngày và giờ kết thúc.';
    if (startAt && endAt && new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      errors.endAt = 'Thời gian kết thúc phải sau thời gian bắt đầu.';
    }
    return errors;
  };

  const updatePath = (idValue: number, step: number) =>
    `/exams/update/${idValue}${step === 1 ? '' : `?step=${step}`}`;
  const detailPath = (idValue: number, step: number) =>
    `/exams/detail/${idValue}${step === 1 ? '' : `?step=${step}`}`;

  const save = async (nextStep?: number) => {
    const errors = validate();
    setFieldErrors(errors);
    setFormError('');
    if (Object.keys(errors).length > 0) return;
    if (!branchId) return setFormError('Tài khoản chưa được gán cơ sở trường.');

    const start = splitDateTime(startAt);
    const end = splitDateTime(endAt);
    const payload: CreateExamRequest = {
      semesterId: Number(semesterId),
      schoolBranchId: branchId,
      gradeLevelId: Number(gradeLevelId),
      subjectId: Number(subjectId),
      name: name.trim(),
      startDate: start.date,
      startTime: start.time,
      endDate: end.date,
      endTime: end.time,
    };

    try {
      setSaving(true);
      const response = mode === 'create'
        ? await api.exam.create(payload)
        : await api.exam.update(examId, { ...payload, status } satisfies UpdateExamRequest);
      const savedId = response.data?.id ?? examId;
      displayToast('success', 'Thành công', mode === 'create' ? 'Đã tạo kỳ thi.' : 'Đã cập nhật kỳ thi.');
      navigate(nextStep && savedId ? updatePath(savedId, nextStep) : '/exams');
    } catch (error) {
      const problem = toProblem(error);
      if (problem.fieldErrors) {
        setFieldErrors({
          name: problem.fieldErrors.name,
          yearId: problem.fieldErrors.academicYearId,
          semesterId: problem.fieldErrors.semesterId,
          gradeLevelId: problem.fieldErrors.gradeLevelId,
          subjectId: problem.fieldErrors.subjectId,
          startAt: problem.fieldErrors.startDate ?? problem.fieldErrors.startTime,
          endAt: problem.fieldErrors.endDate ?? problem.fieldErrors.endTime,
        });
      }
      setFormError(problem.message);
    } finally {
      setSaving(false);
    }
  };

  const goToStep = (step: number) => {
    if (step === activeStep) return;
    if (mode === 'create') {
      void save(step);
      return;
    }
    navigate(readOnly ? detailPath(examId, step) : updatePath(examId, step));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save();
  };

  const title = mode === 'create' ? 'Tạo kỳ thi' : mode === 'edit' ? 'Cập nhật kỳ thi' : 'Chi tiết kỳ thi';

  return (
    <>
      <PageHeader title="Quản lý kỳ thi" />
      <main className="exam-workflow-page">
        <WizardSteps activeStep={activeStep} onSelect={goToStep} />
        {activeStep === 2 ? (
          <ExamRoomStep
            examId={examId}
            readOnly={readOnly}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        ) : activeStep > 2 ? (
          <section className="exam-step-placeholder">
            <h1>{STEPS[activeStep - 1]}</h1>
            <p>Thông tin kỳ thi đã được lưu. Hãy tiếp tục cấu hình bước này cho kỳ thi.</p>
            <div className="exam-form-actions">
              <PcbButton variant="secondary" onClick={() => goToStep(activeStep - 1)}>Quay lại</PcbButton>
              <div>
                <PcbButton onClick={() => activeStep === 5 ? navigate('/exams') : goToStep(activeStep + 1)}>{activeStep === 5 ? 'Hoàn tất' : 'Tiếp tục'}</PcbButton>
              </div>
            </div>
          </section>
        ) : (
          <form className="exam-workflow-form" onSubmit={submit} noValidate>
            <h1>{title}</h1>
            {missingCatalogMessages.length > 0 && (
              <div className="sep-alert sep-alert--warn" role="status">
                {missingCatalogMessages.join(' ')} Vui lòng cấu hình dữ liệu danh mục trước khi tạo kỳ thi.
              </div>
            )}
            <section className="exam-form-section">
              <h2>Thông tin chung</h2>
              <div className="exam-create-grid">
                <Field
                  fieldClassName="exam-span-full"
                  label={<RequiredLabel>Tên kỳ thi</RequiredLabel>}
                  aria-label="Tên kỳ thi"
                  value={name}
                  error={fieldErrors.name}
                  disabled={readOnly}
                  onChange={(event) => { setName(event.target.value); clearError('name'); }}
                />
                <SelectField
                  label={<RequiredLabel>Năm học</RequiredLabel>}
                  aria-label="Năm học"
                  value={yearId}
                  error={fieldErrors.yearId}
                  disabled={readOnly || loading}
                  onChange={(event) => { setYearId(event.target.value); setSemesterId(''); clearError('yearId'); clearError('semesterId'); }}
                >
                  <option value="">{years.length === 0 ? 'Chưa có năm học' : 'Chọn năm học'}</option>
                  {years.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
                </SelectField>
                <SelectField
                  label={<RequiredLabel>Học kỳ</RequiredLabel>}
                  aria-label="Học kỳ"
                  value={semesterId}
                  error={fieldErrors.semesterId}
                  disabled={readOnly || !yearId || loading}
                  onChange={(event) => { setSemesterId(event.target.value); clearError('semesterId'); }}
                >
                  <option value="">{!yearId ? 'Chọn năm học trước' : semesters.length === 0 ? 'Năm học chưa có học kỳ' : 'Chọn học kỳ'}</option>
                  {semesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}
                </SelectField>
                <SelectField
                  fieldClassName="exam-span-full"
                  label={<RequiredLabel>Khối thi</RequiredLabel>}
                  aria-label="Khối thi"
                  value={gradeLevelId}
                  error={fieldErrors.gradeLevelId}
                  hint={candidateCountHint}
                  disabled={readOnly || loading}
                  onChange={(event) => { setGradeLevelId(event.target.value); clearError('gradeLevelId'); }}
                >
                  <option value="">{(options?.gradeLevels.length ?? 0) === 0 ? 'Chưa có khối học' : 'Chọn một khối thi'}</option>
                  {(options?.gradeLevels ?? []).map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                </SelectField>
                <SelectField
                  fieldClassName="exam-span-full"
                  label={<RequiredLabel>Môn thi</RequiredLabel>}
                  aria-label="Môn thi"
                  value={subjectId}
                  error={fieldErrors.subjectId}
                  disabled={readOnly || loading}
                  onChange={(event) => { setSubjectId(event.target.value); clearError('subjectId'); }}
                >
                  <option value="">{(options?.subjects.length ?? 0) === 0 ? 'Chưa có môn học' : 'Chọn một môn thi'}</option>
                  {(options?.subjects ?? []).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </SelectField>
              </div>
            </section>

            <section className="exam-form-section">
              <h2>Thời gian tổ chức</h2>
              <div className="exam-create-grid">
                <Field label={<RequiredLabel>Bắt đầu kỳ thi</RequiredLabel>} aria-label="Bắt đầu kỳ thi" type="datetime-local" value={startAt} error={fieldErrors.startAt} disabled={readOnly} onChange={(event) => { setStartAt(event.target.value); clearError('startAt'); }} />
                <Field label={<RequiredLabel>Kết thúc kỳ thi</RequiredLabel>} aria-label="Kết thúc kỳ thi" type="datetime-local" value={endAt} error={fieldErrors.endAt} disabled={readOnly} min={startAt || undefined} onChange={(event) => { setEndAt(event.target.value); clearError('endAt'); }} />
              </div>
            </section>

            {Boolean(formError || loadError) && <div className="sep-alert" role="alert">{formError || toProblem(loadError).message}</div>}

            <footer className="exam-form-actions">
              <PcbButton variant="secondary" onClick={() => navigate('/exams')}>Quay lại</PcbButton>
              <div>
                {readOnly ? (
                  <PcbButton onClick={() => navigate(`/exams/update/${examId}`)}>Cập nhật</PcbButton>
                ) : (
                  <>
                    <PcbButton variant="secondary" type="submit" disabled={saving || loading}>{saving ? 'Đang lưu...' : 'Lưu nháp'}</PcbButton>
                    <PcbButton type="button" disabled={saving || loading} onClick={() => void save(2)}>Tiếp tục</PcbButton>
                  </>
                )}
              </div>
            </footer>
          </form>
        )}
      </main>
    </>
  );
};
