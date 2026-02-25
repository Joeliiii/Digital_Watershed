import mongoose from 'mongoose';

describe('RecentView Model', () => {
    let RecentView;

    beforeAll(async () => {
        RecentView = (await import('../../models/RecentView.js')).default;
    });

    describe('Schema Validation', () => {
        const validView = {
            userId: new mongoose.Types.ObjectId(),
            itemId: new mongoose.Types.ObjectId(),
        };

        it('should require userId field', () => {
            const view = new RecentView({ itemId: new mongoose.Types.ObjectId() });
            const err = view.validateSync();
            expect(err.errors.userId).toBeDefined();
        });

        it('should require itemId field', () => {
            const view = new RecentView({ userId: new mongoose.Types.ObjectId() });
            const err = view.validateSync();
            expect(err.errors.itemId).toBeDefined();
        });

        it('should default lastViewedAt to a Date', () => {
            const view = new RecentView(validView);
            expect(view.lastViewedAt).toBeInstanceOf(Date);
        });

        it('should pass validation with required fields', () => {
            const view = new RecentView(validView);
            const err = view.validateSync();
            expect(err).toBeUndefined();
        });

        it('should have an index on userId and lastViewedAt', () => {
            const indexes = RecentView.schema.indexes();
            const idx = indexes.find(i => i[0].userId === 1 && i[0].lastViewedAt === -1);
            expect(idx).toBeDefined();
        });
    });
});
