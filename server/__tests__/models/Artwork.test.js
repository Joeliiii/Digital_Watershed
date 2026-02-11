import mongoose from 'mongoose';

describe('Artwork Model', () => {
    let Artwork;

    beforeAll(async () => {
        Artwork = (await import('../../models/Artwork.js')).default;
    });

    describe('Schema Validation', () => {
        const validArtwork = {
            ownerId: new mongoose.Types.ObjectId(),
            title: 'My Artwork',
            mediaUrl: 'https://example.com/image.png',
        };

        it('should require ownerId field', () => {
            const artwork = new Artwork({ title: 'Test', mediaUrl: 'https://example.com' });
            const err = artwork.validateSync();
            expect(err.errors.ownerId).toBeDefined();
        });

        it('should require title field', () => {
            const artwork = new Artwork({ ownerId: new mongoose.Types.ObjectId(), mediaUrl: 'https://example.com' });
            const err = artwork.validateSync();
            expect(err.errors.title).toBeDefined();
        });

        it('should require mediaUrl field', () => {
            const artwork = new Artwork({ ownerId: new mongoose.Types.ObjectId(), title: 'Test' });
            const err = artwork.validateSync();
            expect(err.errors.mediaUrl).toBeDefined();
        });

        it('should pass validation with all required fields', () => {
            const artwork = new Artwork(validArtwork);
            const err = artwork.validateSync();
            expect(err).toBeUndefined();
        });

        it('should accept sourceItemIds as array of ObjectIds', () => {
            const artwork = new Artwork({
                ...validArtwork,
                sourceItemIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
            });
            const err = artwork.validateSync();
            expect(err).toBeUndefined();
            expect(artwork.sourceItemIds).toHaveLength(2);
        });

        it('should default sourceItemIds to empty array', () => {
            const artwork = new Artwork(validArtwork);
            expect(artwork.sourceItemIds).toEqual([]);
        });

        it('should have timestamps enabled', () => {
            expect(Artwork.schema.options.timestamps).toBe(true);
        });
    });
});
