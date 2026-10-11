import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, PcbButton } from '../../../components/pcb';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { PageHeader } from '../../../components/common/PageHeader';
import { useAsync, useDebounce } from '../../../hooks';
import { api } from '../../../services/api';
import type { ExamListItem } from '../../../types';
import { parseJwt } from '../../../utils/jwt';
import { storage } from '../../../utils/storage';
import { toProblem } from '../../../utils/problem';
import { displayToast } from '../../../utils/toast';
import { ExamFilters, ExamTable, type ExamStatusTab } from '../components';
import './exams.css';

const getBranchId = () => {
  const token = storage.getToken();
  if (!token) return undefined;
  const id = Number(parseJwt(token).branch_id);
  return Number.isFinite(id) && id > 0 ? id : undefined;
};

export const ExamListPage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ExamStatusTab>('');
  const [academicYearId, setAcademicYearId] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const [deleting, setDeleting] = useState<ExamListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 300);

  const academicYears = useAsync(() => api.academicYear.list({ page: 1, pageSize: 100 }), []);
  const years = useMemo(() => academicYears.data?.data?.items ?? [], [academicYears.data]);
  const list = useAsync(
    () => api.exam.list({
      keyword: debouncedKeyword.trim() || undefined,
      academicYearId: academicYearId || undefined,
      schoolBranchId: getBranchId(),
      status: status || undefined,
      pageNumber: page,
      pageSize,
    }),
    [debouncedKeyword, academicYearId, status, page, pageSize, reloadKey],
  );

  const response = list.data?.data;
  const error = list.error ?? academicYears.error;
  const changeFilter = (callback: () => void) => {
    callback();
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      setDeleteLoading(true);
      await api.exam.remove(deleting.id);
      displayToast('success', 'Thành công', 'Đã xóa kỳ thi.');
      setDeleting(null);
      setReloadKey((value) => value + 1);
    } catch (deleteError) {
      displayToast('error', 'Không thể xóa', toProblem(deleteError).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Danh sách kỳ thi" />
      <main className="sep-page exam-list-page">
        <ExamFilters
          keyword={keyword}
          academicYearId={academicYearId}
          status={status}
          years={years}
          onKeywordChange={(value) => changeFilter(() => setKeyword(value))}
          onAcademicYearChange={(value) => changeFilter(() => setAcademicYearId(value))}
          onStatusChange={(value) => changeFilter(() => setStatus(value))}
          actions={<PcbButton onClick={() => navigate('/exams/create')}>Tạo kỳ thi <Icon name="add" size={20} /></PcbButton>}
        />

        {error != null && <div className="sep-alert" role="alert">{toProblem(error).message}</div>}

        <ExamTable
          items={response?.items ?? []}
          loading={list.loading}
          failed={Boolean(error)}
          page={page}
          pageSize={pageSize}
          totalCount={response?.totalCount ?? 0}
          onPageChange={setPage}
          onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
          onDelete={setDeleting}
        />
      </main>

      <ConfirmDialog
        isOpen={deleting != null}
        title="Xóa kỳ thi"
        message={<>Bạn có chắc muốn xóa kỳ thi <strong>{deleting?.name}</strong>? Hành động này không thể hoàn tác.</>}
        confirmText="Xóa kỳ thi"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
        isLoading={deleteLoading}
      />
    </>
  );
};
