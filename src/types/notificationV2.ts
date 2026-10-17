import type { DirectoryPage } from './directory';
export type NotificationChannel = 'IN_APP' | 'EMAIL';
export interface NotificationPolicy { formatVersion: 1; branchIds: number[]; includeSourceRecipients: boolean; includeRoleIds: number[]; includeUserIds: number[]; excludeRoleIds: number[]; excludeUserIds: number[] }
export interface NotificationTemplateInput { revision: number; code: string; name: string; eventCode: string; subjectTemplate: string; titleTemplate: string; contentTemplate: string; summaryTemplate: string; status: string; channels: NotificationChannel[]; isAutomaticDefault: boolean; recipientPolicy: NotificationPolicy }
export interface NotificationTemplate extends NotificationTemplateInput { id: number; schoolId: number; createdAt: string; updatedAt: string; canDelete: boolean }
export interface NotificationQuery { page?: number; pageSize?: number; search?: string; status?: string; eventCode?: string; sendKind?: string; unreadOnly?: boolean; automaticOnly?: boolean; ids?: number[]; branchIds?: number[] }
export interface NotificationEvent { code: string; name: string; sourceType: string; triggerKind: string; variables: { name: string; label: string; required: boolean }[] }
export interface NotificationSchool { id: number; code: string; name: string }
export interface NotificationOption { id: number; name: string; email?: string | null; branchName?: string | null; code?: string | null }
export interface NotificationRecipient { userId: number; name: string; email: string | null; branchName: string; receivesInApp: boolean; receivesEmail: boolean; emailSkipReason: string | null }
export interface NotificationCounts { userCount: number; inAppCount: number; emailCount: number; missingEmailCount: number; duplicateEmailCount: number }
export interface NotificationRecipientPreview extends NotificationCounts { recipients: DirectoryPage<NotificationRecipient> }
export interface NotificationSendRequest { templateId: number; revision: number; requestId: string; values: Record<string, string>; recipientPolicy?: NotificationPolicy; channels?: NotificationChannel[]; scheduledFor?: string | null; previewFingerprint?: string; previewExpiresAt?: string }
export interface NotificationPreview extends NotificationCounts { subject: string; title: string; content: string; summary: string; actionUrl: string | null; fingerprint: string; expiresAt: string; channels: NotificationChannel[] }
export interface NotificationDispatch { id: number; status: string; inAppCount: number; emailCount: number }
export interface NotificationHistory { id: number; schoolId: number; eventCode: string; sendKind: string; subject: string; title: string; status: string; createdAt: string; scheduledFor: string | null; publishedAt: string | null; cancelledAt: string | null; recipientCount: number; inAppCount: number; emailPendingCount: number; emailAcceptedCount: number; emailFailedCount: number; emailSkippedCount: number; revision: number; canCancel: boolean; canRetry: boolean }
export interface NotificationDelivery { userId: number; name: string; emailAddress: string | null; inAppEnabled: boolean; readAt: string | null; emailStatus: string; attemptCount: number; errorCode: string | null; acceptedAt: string | null }
export interface NotificationHistoryDetail { item: NotificationHistory; content: string; summary: string; actionUrl: string | null; recipients: DirectoryPage<NotificationDelivery> }
export interface NotificationRuntime { enabled: boolean; schemaReady: boolean; emailEnabled: boolean; workerEnabled: boolean; smtpConfigured: boolean; senderEmail: string | null }
export interface NotificationInboxItem { id: number; title: string; summary: string; schoolName: string; eventCode: string; createdAt: string; readAt: string | null; actionUrl: string | null }
export interface NotificationInboxDetail { item: NotificationInboxItem; content: string }
