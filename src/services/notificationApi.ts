import axios from 'axios';
import { apiClient } from './apiClient';
import { storage } from '../utils/storage';
import type { ApiResponse } from '../types';
import type { DirectoryPage } from '../types/directory';
import type { NotificationChannel, NotificationDispatch, NotificationEvent, NotificationHistory, NotificationHistoryDetail, NotificationInboxDetail, NotificationInboxItem, NotificationOption, NotificationPolicy, NotificationPreview, NotificationQuery, NotificationRecipientPreview, NotificationRuntime, NotificationSchool, NotificationSendRequest, NotificationTemplate, NotificationTemplateInput, NotificationDelivery } from '../types/notificationV2';

const cleanQuery = (query?: object) => query ? Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== undefined && value !== null)) : undefined;
const read = async <T>(url: string, query?: object): Promise<T> => (await apiClient.get<ApiResponse<T>>(url, { params: cleanQuery(query), paramsSerializer: { indexes: null } })).data.data as T;
const write = async <T>(url: string, body: object, method: 'post' | 'put' = 'post'): Promise<T> => (await apiClient[method]<ApiResponse<T>>(url, body)).data.data as T;
const base = (schoolId: number) => `/schools/${schoolId}/emails`;

/** Inbox requests belong to one login session, including requests queued by Axios. */
export function createNotificationInboxSession(token: string) {
  let controller = new AbortController();
  const client = axios.create({
    baseURL: apiClient.defaults.baseURL,
    adapter: apiClient.defaults.adapter,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const request = async <T>(url: string, query?: object, body?: object): Promise<T> => {
    const operation = controller;
    if (operation.signal.aborted || storage.getToken() !== token) throw new axios.CanceledError('Notification session ended');
    try {
      const response = body === undefined
        ? await client.get<ApiResponse<T>>(url, { params: cleanQuery(query), signal: operation.signal })
        : await client.put<ApiResponse<T>>(url, body, { signal: operation.signal });
      if (operation.signal.aborted || storage.getToken() !== token) throw new axios.CanceledError('Notification session ended');
      return response.data.data as T;
    } catch (error) {
      // An old request must never clear the next account's authentication.
      if (axios.isAxiosError(error) && error.response?.status === 401 && storage.getToken() === token && !operation.signal.aborted) {
        storage.clearAuth();
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
      throw error;
    }
  };
  return {
    inbox: (query: NotificationQuery = {}) => request<DirectoryPage<NotificationInboxItem>>('/me/notifications', query),
    unreadCount: () => request<{ count: number; asOf?: string }>('/me/notifications/unread-count'),
    detail: (id: number) => request<NotificationInboxDetail>(`/me/notifications/${id}`),
    markRead: (id: number) => request<boolean>(`/me/notifications/${id}/read`, undefined, {}),
    markAllRead: (before: string) => request<boolean>('/me/notifications/read-all', undefined, { before }),
    cancel: () => controller.abort(),
    // React development StrictMode may mount effects again after their cleanup.
    resume: () => { if (controller.signal.aborted && storage.getToken() === token) controller = new AbortController(); },
  };
}
export type NotificationInboxSession = ReturnType<typeof createNotificationInboxSession>;

export const notificationApi = {
  schools: (query: NotificationQuery = {}) => read<DirectoryPage<NotificationSchool>>('/email/schools', query),
  runtime: () => read<NotificationRuntime>('/admin/notification-email/status'),
  events: (schoolId: number) => read<NotificationEvent[]>(`${base(schoolId)}/events`),
  templates: (schoolId: number, query: NotificationQuery = {}) => read<DirectoryPage<NotificationTemplate>>(`${base(schoolId)}/templates`, query),
  template: (schoolId: number, id: number) => read<NotificationTemplate>(`${base(schoolId)}/templates/${id}`),
  saveTemplate: (schoolId: number, input: NotificationTemplateInput, id?: number) => write<NotificationTemplate>(`${base(schoolId)}/templates${id ? `/${id}` : ''}`, input, id ? 'put' : 'post'),
  deleteTemplate: async (schoolId: number, id: number, revision: number) => (await apiClient.delete<ApiResponse<boolean>>(`${base(schoolId)}/templates/${id}`, { params: { revision } })).data.data,
  options: (schoolId: number, kind: 'roles' | 'users' | 'branches', query: NotificationQuery & { branchId?: number; ids?: number[] } = {}) => read<DirectoryPage<NotificationOption>>(`${base(schoolId)}/recipients`, { ...query, kind }),
  recipients: async (schoolId: number, policy: NotificationPolicy, channels: NotificationChannel[], query: NotificationQuery = {}) => (await apiClient.post<ApiResponse<NotificationRecipientPreview>>(`${base(schoolId)}/recipients/preview`, { policy, channels }, { params: query })).data.data as NotificationRecipientPreview,
  preview: (schoolId: number, body: NotificationSendRequest) => write<NotificationPreview>(`${base(schoolId)}/preview`, body),
  send: (schoolId: number, body: NotificationSendRequest) => write<NotificationDispatch>(`${base(schoolId)}/send`, body),
  test: (schoolId: number, body: { templateId: number; revision: number; recipientUserId: number; requestId: string }) => write<NotificationDispatch>(`${base(schoolId)}/test`, body),
  history: (schoolId: number, query: NotificationQuery = {}) => read<DirectoryPage<NotificationHistory>>(`${base(schoolId)}/history`, query),
  historyDetail: (schoolId: number, id: number, query: NotificationQuery = {}) => read<NotificationHistoryDetail>(`${base(schoolId)}/history/${id}`, query),
  deliveries: (schoolId: number, id: number, query: NotificationQuery = {}) => read<DirectoryPage<NotificationDelivery>>(`${base(schoolId)}/history/${id}/recipients`, query),
  cancel: (schoolId: number, id: number, revision: number) => write<NotificationHistoryDetail>(`${base(schoolId)}/history/${id}/cancel`, { revision }),
  retry: (schoolId: number, id: number, revision: number) => write<NotificationHistoryDetail>(`${base(schoolId)}/history/${id}/retry`, { revision }),
  inbox: (query: NotificationQuery = {}) => read<DirectoryPage<NotificationInboxItem>>('/me/notifications', query),
  unreadCount: () => read<{ count: number }>('/me/notifications/unread-count'),
  inboxDetail: (id: number) => read<NotificationInboxDetail>(`/me/notifications/${id}`),
  markRead: (id: number) => write<boolean>(`/me/notifications/${id}/read`, {}, 'put'),
  markAllRead: (before: string) => write<boolean>('/me/notifications/read-all', { before }, 'put'),
};
