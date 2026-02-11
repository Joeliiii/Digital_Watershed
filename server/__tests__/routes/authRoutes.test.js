import express from 'express';
import request from 'supertest';

// Mock the controller
jest.mock('../../controllers/authController.js', () => ({
    loginUser: jest.fn((req, res) => res.json({ message: 'login called' })),
}));

describe('Auth Routes', () => {
    let app;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        const authRoutes = (await import('../../routes/authRoutes.js')).default;
        app.use('/api/auth', authRoutes);
    });

    it('POST /api/auth/login should call loginUser controller', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: 'pass' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('login called');
    });

    it('GET /api/auth/login should return 404 (only POST is defined)', async () => {
        const res = await request(app).get('/api/auth/login');
        // Express returns 404 for undefined method on path or uses its default handling
        expect([404, 405]).toContain(res.status);
    });
});
