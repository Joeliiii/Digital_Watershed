import express from 'express';
import request from 'supertest';

jest.mock('../../controllers/tagRelationshipController.js', () => ({
    getTagRelationships: jest.fn((req, res) => res.json({ action: 'getTagRelationships' })),
    getRelationshipsByTag: jest.fn((req, res) => res.json({ action: 'getRelationshipsByTag', tagId: req.params.tagId })),
    createTagRelationship: jest.fn((req, res) => res.status(201).json({ action: 'createTagRelationship' })),
    updateTagRelationship: jest.fn((req, res) => res.json({ action: 'updateTagRelationship', id: req.params.id })),
    deleteTagRelationship: jest.fn((req, res) => res.json({ action: 'deleteTagRelationship', id: req.params.id })),
    getSuggestions: jest.fn((req, res) => res.json({ action: 'getSuggestions' })),
}));

describe('TagRelationship Routes', () => {
    let app;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        const tagRelationshipRoutes = (await import('../../routes/tagRelationshipRoutes.js')).default;
        app.use('/api/tag-relationships', tagRelationshipRoutes);
    });

    it('GET /api/tag-relationships should call getTagRelationships', async () => {
        const res = await request(app).get('/api/tag-relationships');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('getTagRelationships');
    });

    it('POST /api/tag-relationships should call createTagRelationship', async () => {
        const res = await request(app)
            .post('/api/tag-relationships')
            .send({ fromTagId: 'a', toTagId: 'b', relationshipType: 'related' });
        expect(res.status).toBe(201);
        expect(res.body.action).toBe('createTagRelationship');
    });

    it('GET /api/tag-relationships/suggestions should call getSuggestions', async () => {
        const res = await request(app).get('/api/tag-relationships/suggestions');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('getSuggestions');
    });

    it('GET /api/tag-relationships/by-tag/:tagId should call getRelationshipsByTag', async () => {
        const res = await request(app).get('/api/tag-relationships/by-tag/tag123');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('getRelationshipsByTag');
        expect(res.body.tagId).toBe('tag123');
    });

    it('PUT /api/tag-relationships/:id should call updateTagRelationship', async () => {
        const res = await request(app)
            .put('/api/tag-relationships/rel123')
            .send({ relationshipType: 'parent' });
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('updateTagRelationship');
        expect(res.body.id).toBe('rel123');
    });

    it('DELETE /api/tag-relationships/:id should call deleteTagRelationship', async () => {
        const res = await request(app).delete('/api/tag-relationships/rel123');
        expect(res.status).toBe(200);
        expect(res.body.action).toBe('deleteTagRelationship');
        expect(res.body.id).toBe('rel123');
    });
});
