import { api } from '../services/api';

global.fetch = jest.fn();

describe('Audit API', () => {
  it('fetches audit logs', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ logs: [{ _id: '1', action: 'create' }] }),
    });

    const res = await api.getAuditLogs();

    expect(res.logs.length).toBe(1);
    expect(fetch).toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    await expect(api.getAuditLogs()).rejects.toThrow();
  });
});