import { api } from '../services/api';

global.fetch = jest.fn();

describe('Export API', () => {
  it('exports data as blob', async () => {
    const fakeBlob = new Blob(['test']);

    fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => fakeBlob,
    });

    const res = await api.exportData({ type: 'all' });

    expect(res).toBeInstanceOf(Blob);
  });

  it('throws on failure', async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    await expect(api.exportData({ type: 'all' })).rejects.toThrow();
  });
});