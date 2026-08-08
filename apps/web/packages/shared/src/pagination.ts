export interface CursorPageDto<T> {
  items: T[];
  nextCursor: string | null;
}
