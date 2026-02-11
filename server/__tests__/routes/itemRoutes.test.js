import express from 'express';
import request from 'supertest';

// Mock the controller and upload middleware
jest.mock('../../controllers/itemController.js', () => ({
    getItems: jest.fn((req, res) => res.json({ action: 'getItems' })),
    getItemById: jest.fn((req, res) => res.json({ action: 'getItemById', id: req.params.id })),
    createItem: jest.fn((req, res) => res.status(201).json({ action: 'createItem' })),
    getItemFile: jest.fn((req, res) => res.json({ action: 'getItemFile', id: req.params.id })),
    updateItem: jest.fn((req, res) => res.json({ action: 'updateItem', id: req.params.id })),
    deleteItem: jest.fn((req, res) => res.json({ action: 'deleteItem', id: req.params.id })),
}));

jest.mock('../../middleware/upload.js', () => ({
    __esModule: true,
    default: {
        single: () => (req, res, next) => next(),
    },
}));

describe('Item Routes', () => {
    let app;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        const itemRoutes = (await import('../../routes/itemRoutes.js')).default;
        app.use('/api/items', itemRoutes);
    });

    it('GET /api/items should call getItems', async () => {
        const res = await request(app).get('/api/items');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('getItems');
    });

    it('POST /api/items should call createItem', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({ title: 'Test' });
        expect(res.status).toBe(201);
        expect(res.body.action).toBe('createItem');
    });

    it('GET /api/items/:id should call getItemById', async () => {
        const res = await request(app).get('/api/items/abc123');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('getItemById');
        expect(res.body.id).toBe('abc123');
    });

    it('PUT /api/items/:id should call updateItem', async () => {
        const res = await request(app)
            .put('/api/items/abc123')
            .send({ title: 'Updated' });
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('updateItem');
    });

    it('DELETE /api/items/:id should call deleteItem', async () => {
        const res = await request(app).delete('/api/items/abc123');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('deleteItem');
    });

    it('GET /api/items/:id/file should call getItemFile', async () => {
        const res = await request(app).get('/api/items/abc123/file');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('getItemFile');
    });
});
