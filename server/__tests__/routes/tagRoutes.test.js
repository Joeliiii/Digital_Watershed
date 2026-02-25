import express from 'express';
import request from 'supertest';

jest.mock('../../controllers/tagController.js', () => ({
    getTags: jest.fn((req, res) => res.json({ action: 'getTags' })),
    createTag: jest.fn((req, res) => res.status(201).json({ action: 'createTag' })),
}));

describe('Tag Routes', () => {
    let app;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        const tagRoutes = (await import('../../routes/tagRoutes.js')).default;
        app.use('/api/tags', tagRoutes);
    });

    it('GET /api/tags should call getTags', async () => {
        const res = await request(app).get('/api/tags');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('getTags');
    });

    it('POST /api/tags should call createTag', async () => {
        const res = await request(app)
            .post('/api/tags')
            .send({ name: 'New Tag', color: '#ff0000' });
        expect(res.status).toBe(201);
        expect(res.body.action).toBe('createTag');
    });
});
