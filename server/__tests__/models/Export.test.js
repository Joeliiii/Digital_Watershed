import mongoose from 'mongoose';

describe('Export Model', () => {
    let Export;

    beforeAll(async () => {
        Export = (await import('../../models/Export.js')).default;
    });

    describe('Schema Validation', () => {
        const validExport = {
            userId: new mongoose.Types.ObjectId(),
            exportFormat: 'pdf',
        };

        it('should require userId field', () => {
            const exp = new Export({ exportFormat: 'pdf' });
            const err = exp.validateSync();
            expect(err.errors.userId).toBeDefined();
        });

        it('should require exportFormat field', () => {
            const exp = new Export({ userId: new mongoose.Types.ObjectId() });
            const err = exp.validateSync();
            expect(err.errors.exportFormat).toBeDefined();
        });

        it('should default status to "pending"', () => {
            const exp = new Export(validExport);
            expect(exp.status).toBe('pending');
        });

        it('should accept "completed" status', () => {
            const exp = new Export({ ...validExport, status: 'completed' });
            const err = exp.validateSync();
            expect(err).toBeUndefined();
            expect(exp.status).toBe('completed');
        });

        it('should accept "failed" status', () => {
            const exp = new Export({ ...validExport, status: 'failed' });
            const err = exp.validateSync();
            expect(err).toBeUndefined();
        });

        it('should reject invalid status values', () => {
            const exp = new Export({ ...validExport, status: 'cancelled' });
            const err = exp.validateSync();
            expect(err.errors.status).toBeDefined();
        });

        it('should pass validation with required fields', () => {
            const exp = new Export(validExport);
            const err = exp.validateSync();
            expect(err).toBeUndefined();
        });

        it('should accept itemIds as array of ObjectIds', () => {
            const exp = new Export({
                ...validExport,
                itemIds: [new mongoose.Types.ObjectId()],
            });
            const err = exp.validateSync();
            expect(err).toBeUndefined();
            expect(exp.itemIds).toHaveLength(1);
        });

        it('should have createdAt timestamp but not updatedAt', () => {
            const tsOpts = Export.schema.options.timestamps;
            expect(tsOpts.createdAt).toBe(true);
            expect(tsOpts.updatedAt).toBe(false);
        });
    });
});
