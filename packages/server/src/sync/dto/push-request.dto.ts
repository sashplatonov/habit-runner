import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import type {
  SyncEntity,
  SyncOpDto as SharedSyncOpDto,
  SyncOpType,
} from '@habbit-runner/shared';

const SYNC_ENTITY_VALUES = ['habit', 'checkin'] as const;
const SYNC_OP_TYPE_VALUES = ['upsert', 'delete'] as const;

export class SyncOpDto implements SharedSyncOpDto {
  @IsString()
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

export type { PushConflict, PushResponseDto } from '@habbit-runner/shared';
