import mongoose from 'mongoose';

describe('Note Model', () => {
  let Note;

  beforeAll(async () => {
    Note = (await import('../../models/Note.js')).default;
  });

  describe('Schema Validation', () => {
    const validNote = {
      ownerId:     new mongoose.Types.ObjectId(),
      entityId:    new mongoose.Types.ObjectId(),
      entityModel: 'Item',
      content:     'A test annotation',
    };

    it('should require ownerId field', () => {
      const { ownerId, ...rest } = validNote;
      const note = new Note(rest);
      const err = note.validateSync();
      expect(err.errors.ownerId).toBeDefined();
    });

    it('should require entityId field', () => {
      const { entityId, ...rest } = validNote;
      const note = new Note(rest);
      const err = note.validateSync();
      expect(err.errors.entityId).toBeDefined();
    });

    it('should require entityModel field', () => {
      const { entityModel, ...rest } = validNote;
      const note = new Note(rest);
      const err = note.validateSync();
      expect(err.errors.entityModel).toBeDefined();
    });

    it('should require content field', () => {
      const { content, ...rest } = validNote;
      const note = new Note(rest);
      const err = note.validateSync();
      expect(err.errors.content).toBeDefined();
    });

    it('should pass validation with all required fields', () => {
      const note = new Note(validNote);
      const err = note.validateSync();
      expect(err).toBeUndefined();
    });

    it('should pass validation with an optional title', () => {
      const note = new Note({ ...validNote, title: 'My Insight' });
      const err = note.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('entityModel Enum', () => {
    const base = {
      ownerId:  new mongoose.Types.ObjectId(),
      entityId: new mongoose.Types.ObjectId(),
      content:  'Test content',
    };

    it.each(['Artwork', 'Item', 'Project', 'Tag'])(
      'should accept entityModel value "%s"',
      (entityModel) => {
        const note = new Note({ ...base, entityModel });
        const err = note.validateSync();
        expect(err).toBeUndefined();
      }
    );

    it('should reject an invalid entityModel value', () => {
      const note = new Note({ ...base, entityModel: 'InvalidModel' });
      const err = note.validateSync();
      expect(err.errors.entityModel).toBeDefined();
    });
  });

  describe('title field', () => {
    it('should enforce maxlength of 200 on title', () => {
      const note = new Note({
        ownerId:     new mongoose.Types.ObjectId(),
        entityId:    new mongoose.Types.ObjectId(),
        entityModel: 'Item',
        content:     'Some content',
        title:       'a'.repeat(201),
      });
      const err = note.validateSync();
      expect(err.errors.title).toBeDefined();
    });

    it('should allow title up to 200 characters', () => {
      const note = new Note({
        ownerId:     new mongoose.Types.ObjectId(),
        entityId:    new mongoose.Types.ObjectId(),
        entityModel: 'Item',
        content:     'Some content',
        title:       'a'.repeat(200),
      });
      const err = note.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('Soft Delete defaults', () => {
    it('should default isDeleted to false', () => {
      const note = new Note({
        ownerId:     new mongoose.Types.ObjectId(),
        entityId:    new mongoose.Types.ObjectId(),
        entityModel: 'Item',
        content:     'Test',
      });
      expect(note.isDeleted).toBe(false);
    });

    it('should default deletedAt to undefined', () => {
      const note = new Note({
        ownerId:     new mongoose.Types.ObjectId(),
        entityId:    new mongoose.Types.ObjectId(),
        entityModel: 'Item',
        content:     'Test',
      });
      expect(note.deletedAt).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    it('should have timestamps enabled', () => {
      const tsOpts = Note.schema.options.timestamps;
      expect(tsOpts).toBe(true);
    });
  });
});