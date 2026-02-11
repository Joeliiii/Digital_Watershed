import mongoose from 'mongoose';

describe('Item Model', () => {
    let Item;

    beforeAll(async () => {
        Item = (await import('../../models/Item.js')).default;
    });

    describe('Schema Validation', () => {
        const validItem = {
            ownerId: new mongoose.Types.ObjectId(),
            title: 'Test Item',
            mediaType: 'image/png',
        };

        it('should require ownerId field', () => {
            const item = new Item({ title: 'Test', mediaType: 'image/png' });
            const err = item.validateSync();
            expect(err.errors.ownerId).toBeDefined();
        });

        it('should require title field', () => {
            const item = new Item({ ownerId: new mongoose.Types.ObjectId(), mediaType: 'image/png' });
            const err = item.validateSync();
            expect(err.errors.title).toBeDefined();
        });

        it('should require mediaType field', () => {
            const item = new Item({ ownerId: new mongoose.Types.ObjectId(), title: 'Test' });
            const err = item.validateSync();
            expect(err.errors.mediaType).toBeDefined();
        });

        it('should default storageType to "local"', () => {
            const item = new Item(validItem);
            expect(item.storageType).toBe('local');
        });

        it('should default isDeleted to false', () => {
            const item = new Item(validItem);
            expect(item.isDeleted).toBe(false);
        });

        it('should pass validation with all required fields', () => {
            const item = new Item(validItem);
            const err = item.validateSync();
            expect(err).toBeUndefined();
        });

        it('should accept optional fields', () => {
            const item = new Item({
                ...validItem,
                description: 'A description',
                filePath: '/some/path',
                storageUrl: 'https://example.com/file',
                externalUrl: 'https://external.com/resource',
                notes: 'Some notes',
                metadata: { key: 'value' },
            });
            const err = item.validateSync();
            expect(err).toBeUndefined();
        });

        it('should accept projectIds as array of ObjectIds', () => {
            const item = new Item({
                ...validItem,
                projectIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
            });
            const err = item.validateSync();
            expect(err).toBeUndefined();
            expect(item.projectIds).toHaveLength(2);
        });

        it('should accept tagIds as array of ObjectIds', () => {
            const item = new Item({
                ...validItem,
                tagIds: [new mongoose.Types.ObjectId()],
            });
            const err = item.validateSync();
            expect(err).toBeUndefined();
            expect(item.tagIds).toHaveLength(1);
        });

        it('should have timestamps enabled', () => {
            expect(Item.schema.options.timestamps).toBe(true);
        });

        it('should have a text index on title and description', () => {
            const indexes = Item.schema.indexes();
            const textIndex = indexes.find(idx => idx[0].title === 'text' || idx[0]._fts === 'text');
            expect(textIndex).toBeDefined();
        });
    });
});
