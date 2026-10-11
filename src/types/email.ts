export interface EmailListQuery {
  search?: string;
  eventCode?: string;
  status?: string;
  sendKind?: string;
  configurationState?: string;
  triggerKind?: string;
  branchId?: number;
  schoolId?: number;
  page?: number;
  pageSize?: number;
}
export interface EmailSchoolItem { id: number; code: string; name: string; canManageTemplates: boolean }
export interface EmailEventVariable { name: string; label: string; type: 'TEXT' | 'DATE' | 'NUMBER' | 'URL'; required: boolean }
export interface EmailEventItem {
  code: string; name: string; variables: string[];
  id?: number; triggerKind?: 'SYSTEM' | 'MANUAL'; status?: string; version?: number;
  description?: string; variableDefinitions?: EmailEventVariable[]; canDelete?: boolean;
}
export interface SaveEmailEventRequest { code: string; name: string; description: string; version: number; variableDefinitions: EmailEventVariable[] }
export interface EmailRuntimeStatus { enabled: boolean; smtpConfigured: boolean }
export interface SendEmailRequest { eventCode: string; configVersion: number; requestId: string; values: Record<string, string>; scheduledFor: string | null; previewFingerprint?: string }
export interface EmailMessagePreview { subject: string; body: string; recipientCount: number; fingerprint: string }
export interface EmailTemplateItem {
  id: number; code: string; name: string; eventCode: string; status: string;
  version: number; latestRevisionId: number; canDelete: boolean;
}
export interface EmailRevisionItem { id: number; revision: number; subject: string; body: string; createdAt: string; variablesJson?: string | null; eventVersion?: number }
export interface EmailTemplateDetail { template: EmailTemplateItem; currentRevision: EmailRevisionItem }
export interface SaveEmailTemplateRequest {
  code: string; name: string; eventCode: string; subject: string; body: string; version: number;
}
export interface EmailTargetItem { roleId: number | null; userId: number | null; action: 'INCLUDE' | 'EXCLUDE'; name?: string | null }
export interface SaveEmailConfigRequest {
  emailTemplateVersionId: number; version: number; isActive: boolean;
  recipientScope: 'NONE' | 'ALL_SCHOOL'; targets: EmailTargetItem[];
}
export interface EmailConfigItem extends Omit<SaveEmailConfigRequest, 'emailTemplateVersionId'> {
  id: number | null; eventCode: string; emailTemplateVersionId: number | null;
  templateName: string | null; revision: number | null; templateStatus: string | null;
  variableDefinitions?: EmailEventVariable[];
}
export interface EmailRecipientOption { id: number; name: string; email: string | null; branchName: string | null; code: string | null }
export interface EmailHistoryItem {
  id: number; title: string; eventCode: string | null; createdAt: string; recipientCount: number;
  sentCount: number; pendingCount: number; errorCount: number; cancelledCount: number; isTest: boolean;
  scheduledFor: string | null; sendKind: string; version: number; canCancel: boolean;
}
export interface EmailDeliveryItem {
  id: number; userId: number; name: string; email: string | null; status: string;
  attempts: number; error: string | null; sentAt: string | null;
}
export interface EmailHistoryDetail { notification: EmailHistoryItem; content: string; actionUrl: string | null }
export interface EmailQueueResult { notificationId: number; status: string }

export interface EmailConfigurationListItem {
  eventCode: string; eventName: string; triggerKind: string; eventStatus: string;
  configId: number | null; version: number; configurationState: 'UNCONFIGURED' | 'ENABLED' | 'DISABLED';
  templateName: string | null; revision: number | null; templateStatus: string | null; targetCount: number;
}

