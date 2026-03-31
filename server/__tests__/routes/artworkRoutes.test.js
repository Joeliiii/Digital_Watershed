import express from 'express';
import request from 'supertest';

// No auth middleware — controllers use TEMP_OWNER_ID 
jest.mock('../../controllers/artworkController.js', () => ({
  getArtworks:       jest.fn((req, res) => res.json({ action: 'getArtworks' })),
  getArtworkById:    jest.fn((req, res) => res.json({ action: 'getArtworkById', id: req.params.id })),
  createArtwork:     jest.fn((req, res) => res.status(201).json({ action: 'createArtwork' })),
  updateArtwork:     jest.fn((req, res) => res.json({ action: 'updateArtwork', id: req.params.id })),
  deleteArtwork:     jest.fn((req, res) => res.json({ action: 'deleteArtwork', id: req.params.id })),
  linkSourceItems:   jest.fn((req, res) => res.json({ action: 'linkSourceItems', id: req.params.id })),
  unlinkSourceItems: jest.fn((req, res) => res.json({ action: 'unlinkSourceItems', id: req.params.id })),
  getSourceItems:    jest.fn((req, res) => res.json({ action: 'getSourceItems', id: req.params.id })),
}));

describe('Artwork Routes', () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    const artworkRoutes = (await import('../../routes/artworkRoutes.js')).default;
    app.use('/api/artworks', artworkRoutes);
  });

  describe('CRUD routes', () => {
    it('GET /api/artworks should call getArtworks', async () => {
      const res = await request(app).get('/api/artworks');
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('getArtworks');
    });

    it('POST /api/artworks should call createArtwork', async () => {
      const res = await request(app)
        .post('/api/artworks')
        .send({ title: 'My Artwork', mediaUrl: 'https://example.com/art.png' });
      expect(res.status).toBe(201);
      expect(res.body.action).toBe('createArtwork');
    });

    it('GET /api/artworks/:id should call getArtworkById', async () => {
      const res = await request(app).get('/api/artworks/abc123');
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('getArtworkById');
      expect(res.body.id).toBe('abc123');
    });

    it('PUT /api/artworks/:id should call updateArtwork', async () => {
      const res = await request(app)
        .put('/api/artworks/abc123')
        .send({ title: 'Updated Title' });
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('updateArtwork');
      expect(res.body.id).toBe('abc123');
    });

    it('DELETE /api/artworks/:id should call deleteArtwork', async () => {
      const res = await request(app).delete('/api/artworks/abc123');
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('deleteArtwork');
      expect(res.body.id).toBe('abc123');
    });
  });

  describe('S21 — Inspiration path routes', () => {
    it('GET /api/artworks/:id/sources should call getSourceItems', async () => {
      const res = await request(app).get('/api/artworks/abc123/sources');
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('getSourceItems');
      expect(res.body.id).toBe('abc123');
    });

    it('POST /api/artworks/:id/link should call linkSourceItems', async () => {
      const res = await request(app)
        .post('/api/artworks/abc123/link')
        .send({ itemIds: ['item1', 'item2'] });
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('linkSourceItems');
      expect(res.body.id).toBe('abc123');
    });

    it('DELETE /api/artworks/:id/link should call unlinkSourceItems', async () => {
      const res = await request(app)
        .delete('/api/artworks/abc123/link')
        .send({ itemIds: ['item1'] });
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('unlinkSourceItems');
      expect(res.body.id).toBe('abc123');
    });
  });
});