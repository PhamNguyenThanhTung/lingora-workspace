export const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  IN_REVIEW: 'Đang chờ duyệt',
  CHANGES_REQUESTED: 'Yêu cầu chỉnh sửa',
  APPROVED: 'Đã duyệt',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Đã lưu trữ',
  WITHDRAWN: 'Đã rút lại',
  SUBMIT: 'Nộp duyệt',
  REQUEST_CHANGES: 'Yêu cầu chỉnh sửa',
  APPROVE: 'Phê duyệt',
  PUBLISH: 'Xuất bản',
  ARCHIVE: 'Lưu trữ',
  WITHDRAW: 'Rút lại',
};

export function getWorkflowStatusLabel(status: string): string {
  return WORKFLOW_STATUS_LABELS[status] || status;
}

export const ACCOUNT_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  LEARNER: 'Học viên',
};

export function getAccountRoleLabel(role?: string | null): string {
  if (!role) return 'Người dùng';
  return ACCOUNT_ROLE_LABELS[role.toUpperCase()] || 'Người dùng';
}

/**
 * Human-readable name for a workflow actor. Admin accounts are provisioned
 * without display_name, so fall back to their role label instead of a generic
 * "Người dùng".
 */
export function resolveActorDisplayName(
  actor?: { displayName?: string | null; role?: string | null } | null
): string {
  const name = typeof actor?.displayName === 'string' ? actor.displayName.trim() : '';
  if (name) return name;
  return getAccountRoleLabel(actor?.role);
}
