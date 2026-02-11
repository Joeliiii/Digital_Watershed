jest.mock('../../models/Tag.js', () => {
    const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };
    return { __esModule: true, default: mockModel };
});

import Tag from '../../models/Tag.js';

describe('Tag Controller', () => {
    let getTags, createTag;

    beforeAll(async () => {
        const mod = await import('../../controllers/tagController.js');
        getTags = mod.getTags;
        createTag = mod.createTag;
    });

    let req, res;

    beforeEach(() => {
        req = { body: {} };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('getTags', () => {
        it('should return all tags sorted by name', async () => {
            const mockTags = [{ name: 'Alpha' }, { name: 'Beta' }];
            Tag.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockTags) });

            await getTags(req, res);

            expect(Tag.find).toHaveBeenCalledWith({}, 'name color _id');
            expect(res.json).toHaveBeenCalledWith(mockTags);
        });

        it('should return 500 on error', async () => {
            Tag.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });

            await getTags(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

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

        it('should return 400 on validation error', async () => {
            Tag.findOne.mockResolvedValue(null);
            Tag.create.mockRejectedValue(new Error('Validation failed'));
            req.body = { name: '' };

            await createTag(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
