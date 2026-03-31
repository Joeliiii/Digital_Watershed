import mongoose from 'mongoose';

// ─── Model mock ───────────────────────────────────────────────────────────────

jest.mock('../../models/Note.js', () => ({
  __esModule: true,
  default: {
    find:            jest.fn(),
    findOne:         jest.fn(),
    findOneAndUpdate: jest.fn(),
    create:          jest.fn(),
  },
}));

describe('Note Controller', () => {
  let Note;
  let getNotes, getNoteById, createNote, updateNote, deleteNote;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockReq = (overrides = {}) => ({
    params: {},
    body:   {},
    query:  {},
    ...overrides,
  });

  const validId       = new mongoose.Types.ObjectId().toString();
  const validEntityId = new mongoose.Types.ObjectId().toString();

  const mockNote = {
    _id:         new mongoose.Types.ObjectId(),
    entityId:    validEntityId,
    entityModel: 'Item',
    content:     'A test note',
    isDeleted:   false,
  };

  beforeAll(async () => {
    Note = (await import('../../models/Note.js')).default;
    ({ getNotes, getNoteById, createNote, updateNote, deleteNote } =
      await import('../../controllers/noteController.js'));
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── getNotes ─────────────────────────────────────────────────────────────

  describe('getNotes', () => {
    it('should return all notes for the owner', async () => {
      Note.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([mockNote]) });

      const res = mockRes();
      await getNotes(mockReq(), res);

      expect(Note.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([mockNote]);
    });

    it('should filter by entityId and entityModel when both are provided', async () => {
      Note.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([mockNote]) });

      const res = mockRes();
      await getNotes(mockReq({ query: { entityId: validEntityId, entityModel: 'Item' } }), res);

      expect(Note.find).toHaveBeenCalledWith(expect.objectContaining({ entityId: validEntityId, entityModel: 'Item' }));
    });

    it('should return 400 if entityId is provided without entityModel', async () => {
      const res = mockRes();
      await getNotes(mockReq({ query: { entityId: validEntityId } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if entityModel is provided without entityId', async () => {
      const res = mockRes();
      await getNotes(mockReq({ query: { entityModel: 'Item' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for an invalid entityModel value', async () => {
      const res = mockRes();
      await getNotes(mockReq({ query: { entityId: validEntityId, entityModel: 'Unknown' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on database error', async () => {
      Note.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB error')) });

      const res = mockRes();
      await getNotes(mockReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── getNoteById ──────────────────────────────────────────────────────────

  describe('getNoteById', () => {
    it('should return a note by ID', async () => {
      Note.findOne.mockResolvedValue(mockNote);

      const res = mockRes();
      await getNoteById(mockReq({ params: { id: validId } }), res);

      expect(res.json).toHaveBeenCalledWith(mockNote);
    });

    it('should return 400 for an invalid ID format', async () => {
      const res = mockRes();
      await getNoteById(mockReq({ params: { id: 'bad-id' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if note is not found', async () => {
      Note.findOne.mockResolvedValue(null);

      const res = mockRes();
      await getNoteById(mockReq({ params: { id: validId } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── createNote ───────────────────────────────────────────────────────────

  describe('createNote', () => {
    it('should create a note with valid data', async () => {
      Note.create.mockResolvedValue(mockNote);

      const res = mockRes();
      await createNote(mockReq({ body: { entityId: validEntityId, entityModel: 'Item', content: 'An insight' } }), res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNote);
    });

    it('should create a note with an optional title', async () => {
      Note.create.mockResolvedValue({ ...mockNote, title: 'Colour insight' });

      const res = mockRes();
      await createNote(mockReq({
        body: { entityId: validEntityId, entityModel: 'Artwork', content: 'Some note', title: 'Colour insight' },
      }), res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if content is missing', async () => {
      const res = mockRes();
      await createNote(mockReq({ body: { entityId: validEntityId, entityModel: 'Item' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if entityId is missing', async () => {
      const res = mockRes();
      await createNote(mockReq({ body: { entityModel: 'Item', content: 'Note' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if entityModel is missing', async () => {
      const res = mockRes();
      await createNote(mockReq({ body: { entityId: validEntityId, content: 'Note' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for an invalid entityModel value', async () => {
      const res = mockRes();
      await createNote(mockReq({ body: { entityId: validEntityId, entityModel: 'Unknown', content: 'Note' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it.each(['Artwork', 'Item', 'Project', 'Tag'])(
      'should accept entityModel value "%s"',
      async (entityModel) => {
        Note.create.mockResolvedValue({ ...mockNote, entityModel });

        const res = mockRes();
        await createNote(mockReq({ body: { entityId: validEntityId, entityModel, content: 'Test' } }), res);

        expect(res.status).toHaveBeenCalledWith(201);
      }
    );
  });

  // ─── updateNote ───────────────────────────────────────────────────────────

  describe('updateNote', () => {
    it('should update note content', async () => {
      Note.findOneAndUpdate.mockResolvedValue({ ...mockNote, content: 'Updated content' });

      const res = mockRes();
      await updateNote(mockReq({ params: { id: validId }, body: { content: 'Updated content' } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ content: 'Updated content' }));
    });

    it('should update note title', async () => {
      Note.findOneAndUpdate.mockResolvedValue({ ...mockNote, title: 'New Title' });

      const res = mockRes();
      await updateNote(mockReq({ params: { id: validId }, body: { title: 'New Title' } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Title' }));
    });

    it('should return 400 if no update fields are provided', async () => {
      const res = mockRes();
      await updateNote(mockReq({ params: { id: validId }, body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for an invalid ID format', async () => {
      const res = mockRes();
      await updateNote(mockReq({ params: { id: 'bad-id' }, body: { content: 'X' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if note is not found', async () => {
      Note.findOneAndUpdate.mockResolvedValue(null);

      const res = mockRes();
      await updateNote(mockReq({ params: { id: validId }, body: { content: 'Ghost' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── deleteNote ───────────────────────────────────────────────────────────

  describe('deleteNote', () => {
    it('should soft-delete a note and confirm deletion', async () => {
      Note.findOneAndUpdate.mockResolvedValue({ ...mockNote, isDeleted: true });

      const res = mockRes();
      await deleteNote(mockReq({ params: { id: validId } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Note deleted successfully' }));
    });

    it('should return 400 for an invalid ID format', async () => {
      const res = mockRes();
      await deleteNote(mockReq({ params: { id: 'not-valid' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if note is not found', async () => {
      Note.findOneAndUpdate.mockResolvedValue(null);

      const res = mockRes();
      await deleteNote(mockReq({ params: { id: validId } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});