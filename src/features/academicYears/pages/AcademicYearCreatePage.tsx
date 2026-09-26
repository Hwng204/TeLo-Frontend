import { useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarPlus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { displayToast } from '../../../utils/toast';
import './AcademicYearPages.css';

const currentYear = new Date().getFullYear() - (new Date().getMonth() < 7 ? 1 : 0);
const initialStartDate = `${currentYear}-08-15`;
const initialEndDate = `${currentYear + 1}-05-31`;
const initialTermOneEnd = `${currentYear + 1}-01-15`;
const initialTermTwoStart = `${currentYear + 1}-01-16`;

export const AcademicYearCreatePage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState(`${currentYear}-${currentYear + 1}`);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [termOneStart, setTermOneStart] = useState(initialStartDate);
    const [termOneEnd, setTermOneEnd] = useState(initialTermOneEnd);
    const [termTwoStart, setTermTwoStart] = useState(initialTermTwoStart);
    const [termTwoEnd, setTermTwoEnd] = useState(initialEndDate);
    const [saving, setSaving] = useState(false);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            const response = await api.academicYear.create({ name, startDate, endDate });
            const id = response.data?.id;
            if (!id) throw new Error('Không nhận được mã năm học vừa tạo.');
            await api.academicYear.configureTerms(id, {
                terms: [
                    { order: 1, name: 'Học kỳ I', startDate: termOneStart, endDate: termOneEnd },
                    { order: 2, name: 'Học kỳ II', startDate: termTwoStart, endDate: termTwoEnd },
                ],
            });
            displayToast('success', 'Thành công', 'Đã tạo năm học thành công');
            navigate(`/academic-years`);
        } catch (requestError: any) {
            const message = requestError.response?.data?.message || 'Có lỗi xảy ra';
            displayToast('error', 'Lỗi', message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="academic-page">
            <header className="academic-page__heading">
                <button className="academic-icon-button" type="button" aria-label="Quay lại danh sách" title="Quay lại danh sách" onClick={() => navigate('/academic-years')}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <p className="academic-eyebrow">Quản trị vận hành</p>
                    <h1>Tạo năm học</h1>
                    <p className="academic-page__subtitle">Thiết lập thời gian áp dụng chung cho toàn hệ thống.</p>
                </div>
            </header>

            <form className="academic-form" onSubmit={submit}>
                <section className="academic-section">
                    <div className="academic-section__title">
                        <CalendarPlus size={18} />
                        <h2>Thông tin năm học</h2>
                    </div>
                    <div className="academic-fields">
                        <label className="academic-field academic-field--wide">
                            <span>Tên năm học <b>*</b></span>
                            <input required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="2026-2027" />
                        </label>
                        <label className="academic-field">
                            <span>Ngày bắt đầu <b>*</b></span>
                            <input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                        </label>
                        <label className="academic-field">
                            <span>Ngày kết thúc <b>*</b></span>
                            <input required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                        </label>
                    </div>
                </section>

                <section className="academic-section">
                    <div className="academic-section__title">
                        <CalendarPlus size={18} />
                        <h2>Lịch học kỳ</h2>
                    </div>
                    <div className="academic-terms">
                        <fieldset className="academic-term">
                            <legend><span>01</span> Học kỳ I</legend>
                            <div className="academic-fields academic-fields--term">
                                <label className="academic-field">
                                    <span>Ngày bắt đầu <b>*</b></span>
                                    <input required type="date" value={termOneStart} onChange={(event) => setTermOneStart(event.target.value)} />
                                </label>
                                <label className="academic-field">
                                    <span>Ngày kết thúc <b>*</b></span>
                                    <input required type="date" value={termOneEnd} onChange={(event) => setTermOneEnd(event.target.value)} />
                                </label>
                            </div>
                        </fieldset>
                        <fieldset className="academic-term">
                            <legend><span>02</span> Học kỳ II</legend>
                            <div className="academic-fields academic-fields--term">
                                <label className="academic-field">
                                    <span>Ngày bắt đầu <b>*</b></span>
                                    <input required type="date" value={termTwoStart} onChange={(event) => setTermTwoStart(event.target.value)} />
                                </label>
                                <label className="academic-field">
                                    <span>Ngày kết thúc <b>*</b></span>
                                    <input required type="date" value={termTwoEnd} onChange={(event) => setTermTwoEnd(event.target.value)} />
                                </label>
                            </div>
                        </fieldset>
                    </div>
                </section>

                <div className="academic-actions">
                    <button className="academic-button academic-button--secondary" type="button" onClick={() => navigate('/academic-years')}>Hủy</button>
                    <button className="academic-button academic-button--primary" type="submit" disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Đang lưu...' : 'Lưu năm học'}
                    </button>
                </div>
            </form>
        </main>
    );
};