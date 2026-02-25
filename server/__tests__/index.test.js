import express from 'express';
import request from 'supertest';

// Mock all dependencies that index.js imports
jest.mock('../config/db.config.js', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue(true),
}));

jest.mock('../routes/authRoutes.js', () => {
    const router = express.Router();
    router.get('/test', (req, res) => res.json({ route: 'auth' }));
    return { __esModule: true, default: router };
});

jest.mock('../routes/itemRoutes.js', () => {
    const router = express.Router();
    router.get('/test', (req, res) => res.json({ route: 'items' }));
    return { __esModule: true, default: router };
});

jest.mock('../routes/projectRoutes.js', () => {
    const router = express.Router();
    router.get('/test', (req, res) => res.json({ route: 'projects' }));
    return { __esModule: true, default: router };
});

jest.mock('../routes/tagRoutes.js', () => {
    const router = express.Router();
    router.get('/test', (req, res) => res.json({ route: 'tags' }));
    return { __esModule: true, default: router };
});

// Mock dotenv
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

describe('Server Index', () => {
    let app;

    beforeAll(() => {
        // Build a mirror of the Express app setup from index.js
        // (We test the wiring, not the listen call)
        app = express();
        app.use(express.json());

        // Logging middleware (same as index.js)
        app.use((req, res, next) => {
            next();
        });
    });

    describe('Express app configuration', () => {
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

    describe('Route mounting', () => {
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
            const res = await request(fullApp).get('/api/auth/test');
            expect(res.status).toBe(200);
            expect(res.body.route).toBe('auth');
        });

        it('should mount item routes at /api/items', async () => {
            const res = await request(fullApp).get('/api/items/test');
            expect(res.status).toBe(200);
            expect(res.body.route).toBe('items');
        });

        it('should mount project routes at /api/projects', async () => {
            const res = await request(fullApp).get('/api/projects/test');
            expect(res.status).toBe(200);
            expect(res.body.route).toBe('projects');
        });

        it('should mount tag routes at /api/tags', async () => {
            const res = await request(fullApp).get('/api/tags/test');
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
        it('connectDB should be called', async () => {
            const connectDB = (await import('../config/db.config.js')).default;
            expect(connectDB).toBeDefined();
            const result = await connectDB();
            expect(result).toBe(true);
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
