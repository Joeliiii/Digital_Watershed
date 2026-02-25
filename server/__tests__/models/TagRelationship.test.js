import mongoose from 'mongoose';

describe('TagRelationship Model', () => {
    let TagRelationship;

    beforeAll(async () => {
        TagRelationship = (await import('../../models/TagRelationship.js')).default;
    });

    describe('Schema Validation', () => {
        const validRel = {
            ownerId: new mongoose.Types.ObjectId(),
            fromTagId: new mongoose.Types.ObjectId(),
            toTagId: new mongoose.Types.ObjectId(),
            relationshipType: 'parent',
        };

        it('should require ownerId field', () => {
            const rel = new TagRelationship({ fromTagId: new mongoose.Types.ObjectId(), toTagId: new mongoose.Types.ObjectId(), relationshipType: 'parent' });
            const err = rel.validateSync();
            expect(err.errors.ownerId).toBeDefined();
        });

        it('should require fromTagId field', () => {
            const rel = new TagRelationship({ ownerId: new mongoose.Types.ObjectId(), toTagId: new mongoose.Types.ObjectId(), relationshipType: 'parent' });
            const err = rel.validateSync();
            expect(err.errors.fromTagId).toBeDefined();
        });

        it('should require toTagId field', () => {
            const rel = new TagRelationship({ ownerId: new mongoose.Types.ObjectId(), fromTagId: new mongoose.Types.ObjectId(), relationshipType: 'parent' });
            const err = rel.validateSync();
            expect(err.errors.toTagId).toBeDefined();
        });

        it('should require relationshipType field', () => {
            const rel = new TagRelationship({ ownerId: new mongoose.Types.ObjectId(), fromTagId: new mongoose.Types.ObjectId(), toTagId: new mongoose.Types.ObjectId() });
            const err = rel.validateSync();
            expect(err.errors.relationshipType).toBeDefined();
        });

        it('should pass validation with all required fields', () => {
            const rel = new TagRelationship(validRel);
            const err = rel.validateSync();
            expect(err).toBeUndefined();
        });

        it('should have createdAt timestamp but not updatedAt', () => {
            const tsOpts = TagRelationship.schema.options.timestamps;
            expect(tsOpts.createdAt).toBe(true);
            expect(tsOpts.updatedAt).toBe(false);
        });
    });
});
