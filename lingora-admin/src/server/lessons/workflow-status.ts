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
