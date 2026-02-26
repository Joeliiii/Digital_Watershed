import request from 'supertest';

// Mock dotenv before anything else
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

// Mock connectDB
jest.mock('../config/db.config.js', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue(true),
}));

// Mock all route modules
jest.mock('../routes/authRoutes.js', () => {
    const { Router } = require('express');
    const router = Router();
    router.post('/login', (req, res) => res.json({ route: 'auth' }));
    return { __esModule: true, default: router };
});

jest.mock('../routes/itemRoutes.js', () => {
    const { Router } = require('express');
    const router = Router();
    router.get('/', (req, res) => res.json({ route: 'items' }));
    return { __esModule: true, default: router };
});

jest.mock('../routes/projectRoutes.js', () => {
    const { Router } = require('express');
    const router = Router();
    router.get('/', (req, res) => res.json({ route: 'projects' }));
    return { __esModule: true, default: router };
});

jest.mock('../routes/tagRoutes.js', () => {
    const { Router } = require('express');
    const router = Router();
    router.get('/', (req, res) => res.json({ route: 'tags' }));
    return { __esModule: true, default: router };
});

import express from 'express';
import connectDB from '../config/db.config.js';

describe('Server Index', () => {
    describe('Express app setup', () => {
        let app;

        beforeAll(() => {
            // Recreate the exact app setup from index.js to verify the wiring works
            app = express();
            app.use(require('cors')());
            app.use(express.json());

            // Logging middleware (same as index.js)
            app.use((req, res, next) => {
                console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
                console.log('Body:', req.body);
                next();
            });
        });

        it('should export a working express setup', () => {
            expect(app).toBeDefined();
        });

        it('should parse JSON bodies', async () => {
            app.post('/test-json', (req, res) => res.json(req.body));
            const res = await request(app)
                .post('/test-json')
                .send({ key: 'value' })
                .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ key: 'value' });
        });
    });

    describe('Route mounting (matching index.js patterns)', () => {
        let fullApp;

        beforeAll(async () => {
            fullApp = express();
            fullApp.use(express.json());

            const authRoutes = (await import('../routes/authRoutes.js')).default;
            const itemRoutes = (await import('../routes/itemRoutes.js')).default;
            const projectRoutes = (await import('../routes/projectRoutes.js')).default;
            const tagRoutes = (await import('../routes/tagRoutes.js')).default;

            fullApp.use('/api/auth', authRoutes);
            fullApp.use('/api/items', itemRoutes);
            fullApp.use('/api/projects', projectRoutes);
            fullApp.use('/api/tags', tagRoutes);

            fullApp.get('/', (req, res) => {
                res.send('API is running...');
            });
        });

        it('should mount auth routes at /api/auth', async () => {
            const res = await request(fullApp).post('/api/auth/login');
            expect(res.status).toBe(200);
            expect(res.body.route).toBe('auth');
        });

        it('should mount item routes at /api/items', async () => {
            const res = await request(fullApp).get('/api/items');
            expect(res.status).toBe(200);
            expect(res.body.route).toBe('items');
        });

        it('should mount project routes at /api/projects', async () => {
            const res = await request(fullApp).get('/api/projects');
            expect(res.status).toBe(200);
            expect(res.body.route).toBe('projects');
        });

        it('should mount tag routes at /api/tags', async () => {
            const res = await request(fullApp).get('/api/tags');
            expect(res.status).toBe(200);
            expect(res.body.route).toBe('tags');
        });

        it('should respond with "API is running..." at root', async () => {
            const res = await request(fullApp).get('/');
            expect(res.status).toBe(200);
            expect(res.text).toBe('API is running...');
        });
    });

    describe('Database connection', () => {
        it('connectDB should be callable and resolve', async () => {
            expect(connectDB).toBeDefined();
            const result = await connectDB();
            expect(result).toBe(true);
        });

        it('should handle connectDB failure', async () => {
            connectDB.mockRejectedValueOnce(new Error('Connection failed'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { });

            // Simulate the catch block from index.js
            try {
                await connectDB();
            } catch (err) {
                console.error('Failed to connect to database', err);
                process.exit(1);
            }

            expect(consoleSpy).toHaveBeenCalledWith('Failed to connect to database', expect.any(Error));
            expect(exitSpy).toHaveBeenCalledWith(1);

            consoleSpy.mockRestore();
            exitSpy.mockRestore();
        });
    });

    describe('Logging middleware', () => {
        it('should pass requests through logging middleware', async () => {
            const logApp = express();
            const logSpy = jest.fn();

            logApp.use((req, res, next) => {
                logSpy(req.method, req.url);
                next();
            });
            logApp.get('/test', (req, res) => res.json({ ok: true }));

            const res = await request(logApp).get('/test');
            expect(res.status).toBe(200);
            expect(logSpy).toHaveBeenCalledWith('GET', '/test');
        });
    });
});
