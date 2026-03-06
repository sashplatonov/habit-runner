export type SyncEntity = 'habit' | 'checkin';
export type SyncOpType = 'upsert' | 'delete';

export interface SyncOpDto {
  id: string;
  type: SyncOpType;
  entity: SyncEntity;
  payload: Record<string, unknown>;
  clientTime?: string;
}

export interface PushRequestDto {
  ops: SyncOpDto[];
}

export interface PushConflict {
  opId: string;
  reason: string;
  serverValue?: unknown;
}

export interface PushResponseDto {
  applied: string[];
  conflicts: PushConflict[];
  serverTime: string;
}
