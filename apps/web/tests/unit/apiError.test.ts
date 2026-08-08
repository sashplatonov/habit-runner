import { describe, expect, it } from 'vitest';
import { ApiError } from '$lib/api/ApiError';

describe('ApiError', () => {
  it('preserves documented validation fields without exposing raw detail', async () => {
    const error = await ApiError.fromResponse(new Response(JSON.stringify({
      type: 'https://habbit-runner.dev/errors/validation',
      status: 400,
      detail: 'create.name must not be blank; create.dailyTarget must be greater than 0',
      errorCode: 'VALIDATION_FAILED'
    }), { status: 400, headers: { 'Content-Type': 'application/json' } }));

    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.fieldErrors).toEqual({
      name: 'must not be blank',
      dailyTarget: 'must be greater than 0'
    });
    expect(error.userMessage).toBe('Check the highlighted fields and try again.');
    expect(error.message).not.toContain('must not be blank');
  });

  it.each([401, 403, 404, 409, 429, 500])('maps %s to a safe status message', async (status) => {
    const error = await ApiError.fromResponse(new Response('not-json', { status }));
    expect(error.userMessage).not.toContain('not-json');
    expect(error.userMessage.length).toBeGreaterThan(0);
  });
});
