// Mock audit logging
jest.mock('../../controllers/auditLogController.js', () => ({
    __esModule: true,
    logAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../models/Tag.js', () => {
    const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

import Tag from '../../models/Tag.js';

describe('Tag Controller', () => {
    let getTags, createTag, updateTag, deleteTag;

    beforeAll(async () => {
        const mod = await import('../../controllers/tagController.js');
        getTags = mod.getTags;
        createTag = mod.createTag;
        updateTag = mod.updateTag;
        deleteTag = mod.deleteTag;
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

    // ─── getTags ──────────────────────────────────────────────────
    describe('getTags', () => {
        it('should return all tags sorted by name', async () => {
            const mockTags = [{ name: 'Alpha' }, { name: 'Beta' }];
            Tag.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockTags) });

            await getTags(req, res);

            expect(Tag.find).toHaveBeenCalledWith({});
            expect(res.json).toHaveBeenCalledWith(mockTags);
        });

        it('should return 500 on error', async () => {
            Tag.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });

            await getTags(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });

    // ─── createTag ────────────────────────────────────────────────
    describe('createTag', () => {
        it('should create a new tag', async () => {
            const newTag = { _id: 'tag123', name: 'New Tag', color: '#ff0000' };
            Tag.findOne.mockResolvedValue(null);
            Tag.create.mockResolvedValue(newTag);
            req.body = { name: 'New Tag', color: '#ff0000' };

            await createTag(req, res);

            expect(Tag.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should return existing tag if duplicate', async () => {
            const existingTag = { _id: 'tag123', name: 'Existing', color: '#000' };
            Tag.findOne.mockResolvedValue(existingTag);
            req.body = { name: 'Existing' };

            await createTag(req, res);

            expect(Tag.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.status().json).toHaveBeenCalledWith(existingTag);
        });

        it('should use default color when not provided', async () => {
            Tag.findOne.mockResolvedValue(null);
            Tag.create.mockResolvedValue({ name: 'Tag', color: '#3B82F6' });
            req.body = { name: 'Tag' };

            await createTag(req, res);

            const createArgs = Tag.create.mock.calls[0][0];
            expect(createArgs.color).toBe('#3B82F6');
        });

        it('should use default ownerId when not provided', async () => {
            Tag.findOne.mockResolvedValue(null);
            Tag.create.mockResolvedValue({ name: 'Tag' });
            req.body = { name: 'Tag' };

            await createTag(req, res);

            const createArgs = Tag.create.mock.calls[0][0];
            expect(createArgs.ownerId).toBe('6987c45da0cb4423e71e1ffd');
        });

        it('should use provided ownerId', async () => {
            Tag.findOne.mockResolvedValue(null);
            Tag.create.mockResolvedValue({ name: 'Tag' });
            req.body = { name: 'Tag', ownerId: 'customOwner' };

            await createTag(req, res);

            const createArgs = Tag.create.mock.calls[0][0];
            expect(createArgs.ownerId).toBe('customOwner');
        });

        it('should return 400 on validation error', async () => {
            Tag.findOne.mockResolvedValue(null);
            Tag.create.mockRejectedValue(new Error('Validation failed'));
            req.body = { name: '' };

            await createTag(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Validation failed' });
        });
    });

    // ─── updateTag ────────────────────────────────────────────────
    describe('updateTag', () => {
        it('should update and return the tag', async () => {
            const updatedTag = { _id: 'tag1', name: 'Updated', color: '#00FF00' };
            Tag.findByIdAndUpdate.mockResolvedValue(updatedTag);
            req.params.id = 'tag1';
            req.body = { name: 'Updated', color: '#00FF00' };

            await updateTag(req, res);

            expect(Tag.findByIdAndUpdate).toHaveBeenCalledWith('tag1', { name: 'Updated', color: '#00FF00' }, {
                new: true,
                runValidators: true,
            });
            expect(res.json).toHaveBeenCalledWith(updatedTag);
        });

        it('should return 404 when tag not found', async () => {
            Tag.findByIdAndUpdate.mockResolvedValue(null);
            req.params.id = 'nonexistent';
            req.body = { name: 'A' };

            await updateTag(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Tag not found' });
        });

        it('should return 400 on validation error', async () => {
            Tag.findByIdAndUpdate.mockRejectedValue(new Error('Validation error'));
            req.params.id = 'tag1';
            req.body = { name: '' };

            await updateTag(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Validation error' });
        });
    });

    // ─── deleteTag ────────────────────────────────────────────────
    describe('deleteTag', () => {
        it('should delete and return success message', async () => {
            Tag.findByIdAndDelete.mockResolvedValue({ _id: 'tag1' });
            req.params.id = 'tag1';

            await deleteTag(req, res);

            expect(Tag.findByIdAndDelete).toHaveBeenCalledWith('tag1');
            expect(res.json).toHaveBeenCalledWith({ message: 'Tag deleted' });
        });

        it('should return 404 when tag not found', async () => {
            Tag.findByIdAndDelete.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await deleteTag(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'Tag not found' });
        });

        it('should return 500 on error', async () => {
            Tag.findByIdAndDelete.mockRejectedValue(new Error('DB error'));
            req.params.id = 'tag1';

            await deleteTag(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.status().json).toHaveBeenCalledWith({ message: 'DB error' });
        });
    });
});
