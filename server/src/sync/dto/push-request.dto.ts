import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';

export const SYNC_ENTITY_VALUES = ['habit', 'checkin'] as const;
export type SyncEntity = (typeof SYNC_ENTITY_VALUES)[number];

export const SYNC_OP_TYPE_VALUES = ['upsert', 'delete'] as const;
export type SyncOpType = (typeof SYNC_OP_TYPE_VALUES)[number];

export class SyncOpDto {
  @IsUUID()
  id!: string;

  @IsIn(SYNC_OP_TYPE_VALUES)
  type!: SyncOpType;

  @IsIn(SYNC_ENTITY_VALUES)
  entity!: SyncEntity;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  clientTime?: string;
}

export class PushRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOpDto)
  ops!: SyncOpDto[];
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
