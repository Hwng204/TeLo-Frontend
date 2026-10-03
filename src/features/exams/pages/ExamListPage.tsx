import { useMemo, useState } from 'react';
import { Icon } from '../../../components/pcb';
import { useAsync, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import { parseJwt, roleLabel } from '../../../utils/jwt';
import { storage } from '../../../utils/storage';
import { toProblem } from '../../../utils/problem';
import {
  CreateExamModal,
  ExamFilters,
  ExamHeader,
  ExamTable,
  type ExamStatusTab,
} from '../components';
import './exams.css';

const PAGE_SIZE = 10;

const getBranchId = () => {
  const token = storage.getToken();
  if (!token) return undefined;
  const id = Number(parseJwt(token).branch_id);
  return Number.isFinite(id) && id > 0 ? id : undefined;
};

export const ExamListPage = () => {
  const user = storage.getUser<{ fullName?: string }>();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ExamStatusTab>('');
  const [semesterId, setSemesterId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>(getBranchId() ?? '');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const debouncedKeyword = useDebounce(keyword, 300);

  const references = useAsync(() => api.matrix.referenceData(), []);
  const academicYears = useAsync(
    () => api.academicYear.list({ page: 1, pageSize: 100 }),
    [],
  );
  const list = useAsync(
    () => api.exam.list({
      keyword: debouncedKeyword.trim() || undefined,
      semesterId: semesterId || undefined,
      schoolBranchId: branchId || undefined,
      status: status || undefined,
      pageNumber: page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedKeyword, semesterId, branchId, status, page, reloadKey],
  );

  const semesters = useMemo(() => references.data?.semesters ?? [], [references.data]);
  const contexts = useMemo(() => references.data?.academicContexts ?? [], [references.data]);
  const years = useMemo(() => academicYears.data?.data?.items ?? [], [academicYears.data]);
  const currentYear = years.find((year) => year.status === 'ACTIVE') ?? years[0];
  const branches = useMemo(() => {
    const values = new Map<number, string>();
    contexts.forEach((context) => {
      const branchName = context.label.split('/').at(-1)?.trim();
      if (!values.has(context.schoolBranchId)) {
        values.set(context.schoolBranchId, branchName || `Cơ sở ${context.schoolBranchId}`);
      }
    });
    return [...values].map(([id, name]) => ({ id, name }));
  }, [contexts]);

  const response = list.data?.data;
  const error = list.error ?? references.error ?? academicYears.error;

  const changeFilter = (callback: () => void) => {
    callback();
    setPage(1);
  };

  return (
    <div className="exam-screen">
      <ExamHeader
        academicYearName={currentYear?.name}
        userName={user?.fullName}
        userRole={roleLabel()}
      />

      <main className="exam-page">
        <div className="exam-title-row">
          <div>
            <h1>Danh sách kỳ thi</h1>
            <p>Quản lý và giám sát các kỳ thi trong hệ thống trường.</p>
          </div>
          <button className="exam-primary" type="button" onClick={() => setCreateOpen(true)}>
            <Icon name="add" size={20} />Tạo kỳ thi
          </button>
        </div>

        <ExamFilters
          keyword={keyword}
          semesterId={semesterId}
          branchId={branchId}
          status={status}
          semesters={semesters}
          branches={branches}
          onKeywordChange={(value) => changeFilter(() => setKeyword(value))}
          onSemesterChange={(value) => changeFilter(() => setSemesterId(value))}
          onBranchChange={(value) => changeFilter(() => setBranchId(value))}
          onStatusChange={(value) => changeFilter(() => setStatus(value))}
        />

        {error != null && <div className="exam-error" role="alert">{toProblem(error).message}</div>}

        <ExamTable
          items={response?.items ?? []}
          loading={list.loading}
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={response?.totalCount ?? 0}
          totalPages={Math.max(response?.totalPages ?? 0, 1)}
          onPageChange={setPage}
        />
      </main>

      {createOpen && (
        <CreateExamModal
          years={years}
          branchId={getBranchId() ?? branches[0]?.id}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            setReloadKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
};
