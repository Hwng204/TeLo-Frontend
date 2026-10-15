import { apiClient } from '../../services/apiClient';
import type { ApiResponse } from '../../types/api';
import type { Availability, BankOptions, BankQuery, BankQuestion, PaperQuestions, QuestionPackage, ReviewNote, SaveQuestion } from './types';

const body = <T,>(response: { data: ApiResponse<T> }): T => {
  if (!response.data.success || response.data.data === undefined) throw new Error(response.data.message ?? 'Không đọc được dữ liệu.');
  return response.data.data;
};
const root = (taskId: number) => `/tasks/${taskId}`;
export const questionApi = {
  get: async (id: number) => body<QuestionPackage>(await apiClient.get(`${root(id)}/question-package`)),
  save: async (id: number, questionId: number | null, request: SaveQuestion) => body<QuestionPackage>(await (questionId === null
    ? apiClient.post(`${root(id)}/questions`, request) : apiClient.put(`${root(id)}/questions/${questionId}`, request))),
  remove: async (id: number, questionId: number, version: number) => body<QuestionPackage>(await apiClient.delete(`${root(id)}/questions/${questionId}`, { params: { version } })),
  submit: async (id: number, version: number) => body<QuestionPackage>(await apiClient.post(`${root(id)}/question-package/submit`, { version })),
  review: async (id: number, version: number, approve: boolean, comment?: string, notes?: ReviewNote[]) => body<QuestionPackage>(await apiClient.post(`${root(id)}/question-package/${approve ? 'approve' : 'reject'}`, { version, comment, notes })),
  template: async (id: number) => (await apiClient.get(`${root(id)}/questions/import/template.xlsx`, { responseType: 'blob' })).data as Blob,
  guide: async (id: number) => (await apiClient.get(`${root(id)}/questions/import/guide.xlsx`, { responseType: 'blob' })).data as Blob,
  import: async (id: number, version: number, file: File, confirm: boolean) => {
    const form = new FormData(); form.append('file', file);
    return body<{ errors: { row: number; column: string; message: string }[]; questions: SaveQuestion[]; package: QuestionPackage | null }>(await apiClient.post(`${root(id)}/questions/import${confirm ? '' : '/preview'}`, form, { params: { version }, headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  bank: async (query: BankQuery) => body<{ items: BankQuestion[]; totalCount: number }>(await apiClient.get('/question-banks/questions', { params: query })),
  detail: async (id: number) => body<BankQuestion>(await apiClient.get(`/question-banks/questions/${id}`)),
  options: async () => body<BankOptions>(await apiClient.get('/question-banks/options')),
  move: async (id: number) => body<BankQuestion>(await apiClient.post(`/question-banks/questions/${id}/move-to-practice`)),
  availability: async (matrixId: number) => body<Availability[]>(await apiClient.get(`/question-banks/matrices/${matrixId}/availability`)),
  overdue: async () => body<number>(await apiClient.get('/question-banks/overdue-count')),
  paper: async (taskId: number, paperId: number) => body<PaperQuestions>(await apiClient.get(`${root(taskId)}/papers/${paperId}/questions`)),
  addToPaper: async (taskId: number, paperId: number, version: number, detailId: number, questionIds: number[]) => body<PaperQuestions>(await apiClient.post(`${root(taskId)}/papers/${paperId}/questions`, { version, detailId, questionIds })),
  removeFromPaper: async (taskId: number, paperId: number, id: number, version: number) => body<PaperQuestions>(await apiClient.delete(`${root(taskId)}/papers/${paperId}/questions/${id}`, { params: { version } })),
};
