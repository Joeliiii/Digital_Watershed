import express from 'express';
import request from 'supertest';

// No auth middleware — controllers use TEMP_OWNER_ID (see projectController.js pattern)

jest.mock('../../controllers/noteController.js', () => ({
  getNotes:    jest.fn((req, res) => res.json({ action: 'getNotes' })),
  getNoteById: jest.fn((req, res) => res.json({ action: 'getNoteById', id: req.params.id })),
  createNote:  jest.fn((req, res) => res.status(201).json({ action: 'createNote' })),
  updateNote:  jest.fn((req, res) => res.json({ action: 'updateNote', id: req.params.id })),
  deleteNote:  jest.fn((req, res) => res.json({ action: 'deleteNote', id: req.params.id })),
}));

describe('Note Routes', () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const noteRoutes = (await import('../../routes/noteRoutes.js')).default;
    app.use('/api/notes', noteRoutes);
  });

  describe('S27 — Notes & Annotations routes', () => {
    it('GET /api/notes should call getNotes', async () => {
      const res = await request(app).get('/api/notes');
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('getNotes');
    });

    it('GET /api/notes with query params should call getNotes', async () => {
      const res = await request(app).get('/api/notes?entityId=abc123&entityModel=Artwork');
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('getNotes');
    });

    it('POST /api/notes should call createNote', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({ entityId: 'abc123', entityModel: 'Item', content: 'An insight' });
      expect(res.status).toBe(201);
      expect(res.body.action).toBe('createNote');
    });

    it('GET /api/notes/:id should call getNoteById', async () => {
      const res = await request(app).get('/api/notes/note123');
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('getNoteById');
      expect(res.body.id).toBe('note123');
    });

    it('PUT /api/notes/:id should call updateNote', async () => {
      const res = await request(app)
        .put('/api/notes/note123')
        .send({ content: 'Updated insight' });
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('updateNote');
      expect(res.body.id).toBe('note123');
    });

    it('DELETE /api/notes/:id should call deleteNote (soft delete)', async () => {
      const res = await request(app).delete('/api/notes/note123');
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('deleteNote');
      expect(res.body.id).toBe('note123');
    });
  });
});