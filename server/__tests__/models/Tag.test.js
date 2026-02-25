import mongoose from 'mongoose';

describe('Tag Model', () => {
    let Tag;

    beforeAll(async () => {
        Tag = (await import('../../models/Tag.js')).default;
    });

    describe('Schema Validation', () => {
        const validTag = {
            ownerId: new mongoose.Types.ObjectId(),
            name: 'Test Tag',
        };

        it('should require ownerId field', () => {
            const tag = new Tag({ name: 'Test' });
            const err = tag.validateSync();
            expect(err.errors.ownerId).toBeDefined();
        });

        it('should require name field', () => {
            const tag = new Tag({ ownerId: new mongoose.Types.ObjectId() });
            const err = tag.validateSync();
            expect(err.errors.name).toBeDefined();
        });

        it('should default color to "#000000"', () => {
            const tag = new Tag(validTag);
            expect(tag.color).toBe('#000000');
        });

        it('should accept a custom color', () => {
            const tag = new Tag({ ...validTag, color: '#ff5500' });
            expect(tag.color).toBe('#ff5500');
        });

        it('should pass validation with required fields', () => {
            const tag = new Tag(validTag);
            const err = tag.validateSync();
            expect(err).toBeUndefined();
        });

        it('should have timestamps enabled', () => {
            expect(Tag.schema.options.timestamps).toBe(true);
        });

        it('should have a compound unique index on ownerId and name', () => {
            const indexes = Tag.schema.indexes();
            const compoundIndex = indexes.find(
                idx => idx[0].ownerId === 1 && idx[0].name === 1
            );
            expect(compoundIndex).toBeDefined();
            expect(compoundIndex[1].unique).toBe(true);
        });
    });
});
