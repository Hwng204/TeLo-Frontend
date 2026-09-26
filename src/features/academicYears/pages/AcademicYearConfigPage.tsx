import { useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarDays, Check, LockKeyhole, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { useAsync } from '../../../hooks/useAsync';
import { displayToast } from '../../../utils/toast';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import type { AcademicYearDetail, SemesterItem } from '../../../types';
import './AcademicYearPages.css';

const toDateInput = (value?: string) => value?.slice(0, 10) ?? '';

export const AcademicYearConfigPage = () => {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const { data: response, loading, error: loadError, reload } = useAsync(() => api.academicYear.get(id), [id]);
    const year = response?.data;

    if (loading) return <main className="academic-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><LoadingSpinner /></main>;
    if (loadError || !year) {
        return (
            <main className="academic-page">
                <p className="academic-error" role="alert">{loadError ? 'Lỗi tải thông tin năm học' : 'Không tìm thấy năm học.'}</p>
                <button className="academic-button academic-button--secondary" type="button" onClick={() => navigate('/academic-years')}>Về danh sách</button>
            </main>
        );
    }

    return <AcademicYearEditor key={year.id} year={year} reload={reload} onBack={() => navigate('/academic-years')} />;
};

function AcademicYearEditor({ year, reload, onBack }: { year: AcademicYearDetail; reload: () => void; onBack: () => void }) {
    const readOnly = year.status === 'CLOSED';
    const [name, setName] = useState(year.name);
    const [startDate, setStartDate] = useState(toDateInput(year.startDate));
    const [endDate, setEndDate] = useState(toDateInput(year.endDate));
    const [terms, setTerms] = useState<SemesterItem[]>(() => [1, 2].map((order) => {
        const existing = year.semesters.find((semester) => semester.order === order);
        return existing ?? {
            id: '', order, name: order === 1 ? 'Học kỳ I' : 'Học kỳ II', status: 'PLANNED', version: 1,
        };
    }));
    const [saving, setSaving] = useState(false);

    const saveYear = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            await api.academicYear.update(year.id, { name, startDate, endDate });
            displayToast('success', 'Thành công', 'Lưu thông tin năm học thành công');
            reload();
        } catch (requestError: any) {
            const message = requestError.response?.data?.message || 'Có lỗi xảy ra';
            displayToast('error', 'Lỗi', message);
        } finally {
            setSaving(false);
        }
    };

    const saveTerms = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            await api.academicYear.configureTerms(year.id, {
                terms: terms.map(({ order, name: termName, startDate: termStart, endDate: termEnd }) => ({
                    order,
                    name: termName,
                    startDate: termStart || undefined,
                    endDate: termEnd || undefined,
                })),
            });
            displayToast('success', 'Thành công', 'Lưu cấu hình kỳ học thành công');
            reload();
        } catch (requestError: any) {
            const message = requestError.response?.data?.message || 'Có lỗi xảy ra';
            displayToast('error', 'Lỗi', message);
        } finally {
            setSaving(false);
        }
    };

    const updateTerm = (order: number, changes: Partial<SemesterItem>) => {
        setTerms((current) => current.map((term) => term.order === order ? { ...term, ...changes } : term));
    };

    return (
        <main className="academic-page">
            <header className="academic-page__heading">
                <button className="academic-icon-button" type="button" aria-label="Quay lại danh sách" title="Quay lại danh sách" onClick={onBack}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <p className="academic-eyebrow">Năm học và kỳ học</p>
                    <h1>{readOnly ? 'Chi tiết năm học' : 'Cấu hình năm học'}</h1>
                    <p className="academic-page__subtitle">Lịch học được áp dụng thống nhất cho toàn hệ thống.</p>
                </div>
                <span className={`academic-status academic-status--${year.status.toLowerCase()}`}>
                    {readOnly ? <LockKeyhole size={14} /> : <Check size={14} />}
                    {year.status === 'ACTIVE' ? 'Đang áp dụng' : year.status === 'CLOSED' ? 'Đã kết thúc' : 'Bản nháp'}
                </span>
            </header>

            {readOnly && <div className="academic-readonly-note"><LockKeyhole size={16} /> Năm học đã kết thúc, thông tin chỉ được xem.</div>}

            <form className="academic-form" onSubmit={saveYear}>
                <section className="academic-section">
                    <div className="academic-section__title">
                        <CalendarDays size={18} />
                        <h2>Thông tin năm học</h2>
                    </div>
                    <div className="academic-fields">
                        <label className="academic-field academic-field--wide">
                            <span>Tên năm học <b>*</b></span>
                            <input required maxLength={50} disabled={readOnly} value={name} onChange={(event) => setName(event.target.value)} />
                        </label>
                        <label className="academic-field">
                            <span>Ngày bắt đầu <b>*</b></span>
                            <input required type="date" disabled={readOnly} value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                        </label>
                        <label className="academic-field">
                            <span>Ngày kết thúc <b>*</b></span>
                            <input required type="date" disabled={readOnly} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                        </label>
                    </div>
                </section>
                {!readOnly && (
                    <div className="academic-actions academic-actions--section">
                        <button className="academic-button academic-button--primary" type="submit" disabled={saving}><Save size={16} /> Lưu thông tin năm học</button>
                    </div>
                )}
            </form>

            <form className="academic-form" onSubmit={saveTerms}>
                <section className="academic-section">
                    <div className="academic-section__title">
                        <CalendarDays size={18} />
                        <h2>Lịch học kỳ</h2>
                    </div>
                    <div className="academic-terms">
                        {terms.map((term) => (
                            <fieldset className="academic-term" key={term.order} disabled={readOnly}>
                                <legend><span>{String(term.order).padStart(2, '0')}</span> Học kỳ {term.order === 1 ? 'I' : 'II'}</legend>
                                <div className="academic-fields academic-fields--term">
                                    <label className="academic-field">
                                        <span>Tên kỳ <b>*</b></span>
                                        <input required maxLength={100} value={term.name} onChange={(event) => updateTerm(term.order, { name: event.target.value })} />
                                    </label>
                                    <label className="academic-field">
                                        <span>Ngày bắt đầu <b>*</b></span>
                                        <input required type="date" value={toDateInput(term.startDate)} onChange={(event) => updateTerm(term.order, { startDate: event.target.value })} />
                                    </label>
                                    <label className="academic-field">
                                        <span>Ngày kết thúc <b>*</b></span>
                                        <input required type="date" value={toDateInput(term.endDate)} onChange={(event) => updateTerm(term.order, { endDate: event.target.value })} />
                                    </label>
                                </div>
                            </fieldset>
                        ))}
                    </div>
                </section>
                <div className="academic-actions">
                    <button className="academic-button academic-button--secondary" type="button" onClick={onBack}>Quay lại</button>
                    {!readOnly && <button className="academic-button academic-button--primary" type="submit" disabled={saving}><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cấu hình kỳ'}</button>}
                </div>
            </form>
        </main>
    );
}