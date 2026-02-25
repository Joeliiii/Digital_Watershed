import express from 'express';
import request from 'supertest';

jest.mock('../../controllers/projectController.js', () => ({
    getProjects: jest.fn((req, res) => res.json({ action: 'getProjects' })),
}));

describe('Project Routes', () => {
    let app;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        const projectRoutes = (await import('../../routes/projectRoutes.js')).default;
        app.use('/api/projects', projectRoutes);
    });

    it('GET /api/projects should call getProjects', async () => {
        const res = await request(app).get('/api/projects');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('getProjects');
    });
});
