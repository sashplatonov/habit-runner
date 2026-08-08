export interface CheckinUpsertRequestDto {
  done: boolean;
  count?: number;
  version?: number;
}

export interface CheckinResponseDto {
  id: string;
  habitId: string;
  date: string;
  done: boolean;
  count: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}
