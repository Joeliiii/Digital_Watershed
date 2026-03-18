jest.mock('../../models/TagRelationship.js', () => {
    const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

jest.mock('../../models/Item.js', () => {
    const mockModel = {
        find: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

jest.mock('../../models/Tag.js', () => {
    const mockModel = {
        find: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

import TagRelationship from '../../models/TagRelationship.js';
import Item from '../../models/Item.js';
import Tag from '../../models/Tag.js';

describe('TagRelationship Controller', () => {
    let getTagRelationships, getRelationshipsByTag, createTagRelationship,
        updateTagRelationship, deleteTagRelationship, getSuggestions;

    beforeAll(async () => {
        const mod = await import('../../controllers/tagRelationshipController.js');
        getTagRelationships = mod.getTagRelationships;
        getRelationshipsByTag = mod.getRelationshipsByTag;
        createTagRelationship = mod.createTagRelationship;
        updateTagRelationship = mod.updateTagRelationship;
        deleteTagRelationship = mod.deleteTagRelationship;
        getSuggestions = mod.getSuggestions;
    });

    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {} };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    // ─── getTagRelationships ─────────────────────────────────────
    describe('getTagRelationships', () => {
        it('should return all relationships sorted by createdAt desc', async () => {
            const mockRels = [{ fromTagId: 'a', toTagId: 'b' }];
            const sortMock = jest.fn().mockResolvedValue(mockRels);
            const populate2 = jest.fn().mockReturnValue({ sort: sortMock });
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.find.mockReturnValue({ populate: populate1 });

            await getTagRelationships(req, res);

            expect(TagRelationship.find).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockRels);
        });

        it('should return 500 on error', async () => {
            const populate2 = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('DB error'))
            });
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.find.mockReturnValue({ populate: populate1 });

            await getTagRelationships(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── getRelationshipsByTag ───────────────────────────────────
    describe('getRelationshipsByTag', () => {
        it('should return relationships for a specific tag', async () => {
            const mockRels = [{ fromTagId: 'tag1', toTagId: 'tag2' }];
            const populate2 = jest.fn().mockResolvedValue(mockRels);
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.find.mockReturnValue({ populate: populate1 });
            req.params.tagId = 'tag1';

            await getRelationshipsByTag(req, res);

            expect(TagRelationship.find).toHaveBeenCalledWith({
                $or: [{ fromTagId: 'tag1' }, { toTagId: 'tag1' }]
            });
            expect(res.json).toHaveBeenCalledWith(mockRels);
        });

        it('should return 500 on error', async () => {
            const populate2 = jest.fn().mockRejectedValue(new Error('DB error'));
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.find.mockReturnValue({ populate: populate1 });
            req.params.tagId = 'tag1';

            await getRelationshipsByTag(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── createTagRelationship ───────────────────────────────────
    describe('createTagRelationship', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { fromTagId: 'a' };

            await createTagRelationship(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({
                message: 'fromTagId, toTagId, and relationshipType are required'
            });
        });

        it('should return 400 if tag relates to itself', async () => {
            req.body = { fromTagId: 'a', toTagId: 'a', relationshipType: 'related' };

            await createTagRelationship(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({
                message: 'A tag cannot be related to itself'
            });
        });

        it('should return 400 if relationship already exists', async () => {
            req.body = { fromTagId: 'a', toTagId: 'b', relationshipType: 'related' };
            TagRelationship.findOne.mockResolvedValue({ _id: 'existing' });

            await createTagRelationship(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({
                message: 'A relationship between these tags already exists'
            });
        });

        it('should create and return a populated relationship', async () => {
            req.body = { fromTagId: 'a', toTagId: 'b', relationshipType: 'related' };
            TagRelationship.findOne.mockResolvedValue(null);
            TagRelationship.create.mockResolvedValue({ _id: 'newRel' });
            const populated = { _id: 'newRel', fromTagId: { name: 'A' }, toTagId: { name: 'B' } };
            const populate2 = jest.fn().mockResolvedValue(populated);
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.findById.mockReturnValue({ populate: populate1 });

            await createTagRelationship(req, res);

            expect(TagRelationship.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.status().json).toHaveBeenCalledWith(populated);
        });

        it('should use default ownerId when not provided', async () => {
            req.body = { fromTagId: 'a', toTagId: 'b', relationshipType: 'related' };
            TagRelationship.findOne.mockResolvedValue(null);
            TagRelationship.create.mockResolvedValue({ _id: 'newRel' });
            const populate2 = jest.fn().mockResolvedValue({});
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.findById.mockReturnValue({ populate: populate1 });

            await createTagRelationship(req, res);

            expect(TagRelationship.create).toHaveBeenCalledWith(expect.objectContaining({
                ownerId: '6987c45da0cb4423e71e1ffd'
            }));
        });

        it('should return 400 on creation error', async () => {
            req.body = { fromTagId: 'a', toTagId: 'b', relationshipType: 'related' };
            TagRelationship.findOne.mockResolvedValue(null);
            TagRelationship.create.mockRejectedValue(new Error('Validation failed'));

            await createTagRelationship(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Validation failed' });
        });
    });

    // ─── updateTagRelationship ───────────────────────────────────
    describe('updateTagRelationship', () => {
        it('should update and return the relationship', async () => {
            const updated = { _id: 'rel1', relationshipType: 'parent' };
            const populate2 = jest.fn().mockResolvedValue(updated);
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.findByIdAndUpdate.mockReturnValue({ populate: populate1 });
            req.params.id = 'rel1';
            req.body = { relationshipType: 'parent' };

            await updateTagRelationship(req, res);

            expect(TagRelationship.findByIdAndUpdate).toHaveBeenCalledWith(
                'rel1',
                { relationshipType: 'parent' },
                { new: true, runValidators: true }
            );
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('should return 404 when relationship not found', async () => {
            const populate2 = jest.fn().mockResolvedValue(null);
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.findByIdAndUpdate.mockReturnValue({ populate: populate1 });
            req.params.id = 'nonexistent';
            req.body = { relationshipType: 'parent' };

            await updateTagRelationship(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Relationship not found' });
        });

        it('should return 400 on validation error', async () => {
            const populate2 = jest.fn().mockRejectedValue(new Error('Bad data'));
            const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
            TagRelationship.findByIdAndUpdate.mockReturnValue({ populate: populate1 });
            req.params.id = 'rel1';
            req.body = { relationshipType: '' };

            await updateTagRelationship(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Bad data' });
        });
    });

    // ─── deleteTagRelationship ───────────────────────────────────
    describe('deleteTagRelationship', () => {
        it('should delete and return success message', async () => {
            TagRelationship.findByIdAndDelete.mockResolvedValue({ _id: 'rel1' });
            req.params.id = 'rel1';

            await deleteTagRelationship(req, res);

            expect(TagRelationship.findByIdAndDelete).toHaveBeenCalledWith('rel1');
            expect(res.json).toHaveBeenCalledWith({ message: 'Relationship deleted' });
        });

        it('should return 404 when relationship not found', async () => {
            TagRelationship.findByIdAndDelete.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await deleteTagRelationship(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Relationship not found' });
        });

        it('should return 500 on error', async () => {
            TagRelationship.findByIdAndDelete.mockRejectedValue(new Error('DB error'));
            req.params.id = 'rel1';

            await deleteTagRelationship(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── getSuggestions ──────────────────────────────────────────
    describe('getSuggestions', () => {
        it('should return empty array when no items have 2+ tags', async () => {
            Item.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
            TagRelationship.find.mockResolvedValue([]);

            await getSuggestions(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return suggestions for co-occurring tags', async () => {
            const items = [
                { tagIds: [{ toString: () => 'tag1' }, { toString: () => 'tag2' }] },
                { tagIds: [{ toString: () => 'tag1' }, { toString: () => 'tag2' }] },
            ];
            Item.find.mockReturnValue({ select: jest.fn().mockResolvedValue(items) });
            TagRelationship.find.mockResolvedValue([]);
            Tag.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([
                    { _id: 'tag1', name: 'Tag1', color: '#f00', toString() { return 'tag1'; } },
                    { _id: 'tag2', name: 'Tag2', color: '#0f0', toString() { return 'tag2'; } },
                ])
            });

            await getSuggestions(req, res);

            expect(res.json).toHaveBeenCalled();
            const result = res.json.mock.calls[0][0];
            expect(result.length).toBe(1);
            expect(result[0].coOccurrences).toBe(2);
        });

        it('should exclude existing relationships from suggestions', async () => {
            const items = [
                { tagIds: [{ toString: () => 'tag1' }, { toString: () => 'tag2' }] },
                { tagIds: [{ toString: () => 'tag1' }, { toString: () => 'tag2' }] },
            ];
            Item.find.mockReturnValue({ select: jest.fn().mockResolvedValue(items) });
            TagRelationship.find.mockResolvedValue([
                { fromTagId: { toString: () => 'tag1' }, toTagId: { toString: () => 'tag2' } }
            ]);

            await getSuggestions(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return 500 on error', async () => {
            Item.find.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('DB error'))
            });

            await getSuggestions(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });
});
