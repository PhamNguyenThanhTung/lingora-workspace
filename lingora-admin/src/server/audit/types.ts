export const KNOWN_ACTIONS = [
  'TEACHER_PROVISIONED',
  'TEACHER_DISABLED',
  'TEACHER_ENABLED',
  'TEACHER_ACTIVATED',
  'LEARNER_BOOTSTRAPPED',
] as const;

export type KnownAuditEventAction = (typeof KNOWN_ACTIONS)[number];
export type AuditEventAction = KnownAuditEventAction | 'OTHER';

export const KNOWN_OUTCOMES = [
  'SUCCESS',
  'DENIED',
  'FAILURE',
] as const;

export type KnownAuditEventOutcome = (typeof KNOWN_OUTCOMES)[number];
export type AuditEventOutcome = KnownAuditEventOutcome | 'OTHER';

export const KNOWN_ACTOR_KINDS = [
  'ACCOUNT',
  'VERIFIED_AUTH_SUBJECT',
  'SYSTEM',
] as const;

export type KnownAuditEventActorKind = (typeof KNOWN_ACTOR_KINDS)[number];
export type AuditEventActorKind = KnownAuditEventActorKind | 'OTHER';

export const KNOWN_TARGET_TYPES = [
  'ACCOUNT',
] as const;

export type KnownAuditEventTargetType = (typeof KNOWN_TARGET_TYPES)[number];
export type AuditEventTargetType = KnownAuditEventTargetType | 'OTHER';

export interface AuditEventDto {
  id: string;
  occurredAt: string;
  actorKind: AuditEventActorKind;
  actorId: string | null;
  action: AuditEventAction;
  targetType: AuditEventTargetType;
  targetId: string | null;
  outcome: AuditEventOutcome;
}

export interface AuditFilters {
  from: string;
  to: string;
  action: AuditEventAction | null;
  outcome: AuditEventOutcome | null;
}

export interface AuditCursorPayload {
  v: 1;
  t: string;
  id: string;
  from: string;
  to: string;
  action: string | null;
  outcome: string | null;
}

export interface ListAuditEventsInput {
  from?: string;
  to?: string;
  action?: string;
  outcome?: string;
  cursor?: string;
}

export interface ListAuditEventsSuccess {
  ok: true;
  data: AuditEventDto[];
  filters: AuditFilters;
  nextCursor: string | null;
  status: 200;
}

export interface ListAuditEventsFailure {
  ok: false;
  status: 400 | 500 | 503;
  error: {
    code: 'VALIDATION_ERROR' | 'SERVICE_UNAVAILABLE' | 'INTERNAL_SERVER_ERROR';
    message: string;
  };
}

export type ListAuditEventsResult = ListAuditEventsSuccess | ListAuditEventsFailure;

export const ACTION_LABELS: Record<AuditEventAction, string> = {
  TEACHER_PROVISIONED: 'Khởi tạo giáo viên',
  TEACHER_DISABLED: 'Vô hiệu hóa giáo viên',
  TEACHER_ENABLED: 'Kích hoạt lại giáo viên',
  TEACHER_ACTIVATED: 'Giáo viên hoàn tất kích hoạt',
  LEARNER_BOOTSTRAPPED: 'Khởi tạo học viên',
  OTHER: 'Khác',
};

export const OUTCOME_LABELS: Record<AuditEventOutcome, string> = {
  SUCCESS: 'Thành công',
  DENIED: 'Bị từ chối',
  FAILURE: 'Thất bại',
  OTHER: 'Khác',
};

export const ACTOR_KIND_LABELS: Record<AuditEventActorKind, string> = {
  ACCOUNT: 'Tài khoản',
  VERIFIED_AUTH_SUBJECT: 'Đối tượng xác thực',
  SYSTEM: 'Hệ thống',
  OTHER: 'Khác',
};

export const TARGET_TYPE_LABELS: Record<AuditEventTargetType, string> = {
  ACCOUNT: 'Tài khoản',
  OTHER: 'Khác',
};
