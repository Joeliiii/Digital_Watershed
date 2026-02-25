describe('Sample Model', () => {
    let Sample;

    beforeAll(async () => {
        Sample = (await import('../../models/Sample.js')).default;
    });

    describe('Schema Validation', () => {
        it('should require testField', () => {
            const sample = new Sample({});
            const err = sample.validateSync();
            expect(err.errors.testField).toBeDefined();
        });

        it('should pass validation with testField provided', () => {
            const sample = new Sample({ testField: 'hello' });
            const err = sample.validateSync();
            expect(err).toBeUndefined();
        });

        it('should default createdAt to a Date', () => {
            const sample = new Sample({ testField: 'hello' });
            expect(sample.createdAt).toBeInstanceOf(Date);
        });

        it('should accept a custom createdAt date', () => {
            const date = new Date('2025-01-01');
            const sample = new Sample({ testField: 'hello', createdAt: date });
            expect(sample.createdAt).toEqual(date);
        });
    });
});
