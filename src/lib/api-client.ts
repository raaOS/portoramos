import type { ApiSuccessResponse } from '@/lib/api-response';

function isWrappedSuccessPayload<T>(payload: unknown): payload is ApiSuccessResponse<T> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    'data' in payload &&
    (payload as { success?: unknown }).success === true
  );
}

export function unwrapApiPayload<T>(payload: ApiSuccessResponse<T> | T): T {
  if (isWrappedSuccessPayload<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}
