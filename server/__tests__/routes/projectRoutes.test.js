import express from 'express';
import request from 'supertest';

jest.mock('../../controllers/projectController.js', () => ({
    getProjects: jest.fn((req, res) => res.json({ action: 'getProjects' })),
    createProject: jest.fn((req, res) => res.status(201).json({ action: 'createProject' })),
    updateProject: jest.fn((req, res) => res.json({ action: 'updateProject', id: req.params.id })),
    deleteProject: jest.fn((req, res) => res.json({ action: 'deleteProject', id: req.params.id })),
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

    it('POST /api/projects should call createProject', async () => {
        const res = await request(app)
            .post('/api/projects')
            .send({ title: 'New Project' });
        expect(res.status).toBe(201);
        expect(res.body.action).toBe('createProject');
    });

    it('PUT /api/projects/:id should call updateProject', async () => {
        const res = await request(app)
            .put('/api/projects/proj123')
            .send({ title: 'Updated' });
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('updateProject');
        expect(res.body.id).toBe('proj123');
    });

    it('DELETE /api/projects/:id should call deleteProject', async () => {
        const res = await request(app).delete('/api/projects/proj123');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('deleteProject');
        expect(res.body.id).toBe('proj123');
    });
});
