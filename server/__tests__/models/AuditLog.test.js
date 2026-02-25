import mongoose from 'mongoose';

describe('AuditLog Model', () => {
    let AuditLog;

    beforeAll(async () => {
        AuditLog = (await import('../../models/AuditLog.js')).default;
    });

    describe('Schema Validation', () => {
        const validLog = {
            actorUserId: new mongoose.Types.ObjectId(),
            actionType: 'create',
            targetType: 'Item',
        };

        it('should require actorUserId field', () => {
            const log = new AuditLog({ actionType: 'create', targetType: 'Item' });
            const err = log.validateSync();
            expect(err.errors.actorUserId).toBeDefined();
        });

        it('should require actionType field', () => {
            const log = new AuditLog({ actorUserId: new mongoose.Types.ObjectId(), targetType: 'Item' });
            const err = log.validateSync();
            expect(err.errors.actionType).toBeDefined();
        });

        it('should require targetType field', () => {
            const log = new AuditLog({ actorUserId: new mongoose.Types.ObjectId(), actionType: 'create' });
            const err = log.validateSync();
            expect(err.errors.targetType).toBeDefined();
        });

        it('should pass validation with required fields', () => {
            const log = new AuditLog(validLog);
            const err = log.validateSync();
            expect(err).toBeUndefined();
        });

        it('should default timestamp to a Date', () => {
            const log = new AuditLog(validLog);
            expect(log.timestamp).toBeInstanceOf(Date);
        });

        it('should accept optional targetId', () => {
            const log = new AuditLog({ ...validLog, targetId: new mongoose.Types.ObjectId() });
            const err = log.validateSync();
            expect(err).toBeUndefined();
        });

        it('should accept optional details (Mixed type)', () => {
            const log = new AuditLog({ ...validLog, details: { before: 'a', after: 'b' } });
            const err = log.validateSync();
            expect(err).toBeUndefined();
            expect(log.details).toEqual({ before: 'a', after: 'b' });
        });
    });
});
