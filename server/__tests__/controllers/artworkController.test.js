import mongoose from 'mongoose';

// ─── Model mocks ──────────────────────────────────────────────────────────────

const mockArtwork = {
  _id:           new mongoose.Types.ObjectId(),
  title:         'Test Artwork',
  mediaUrl:      'https://example.com/art.png',
  sourceItemIds: [],
  populate:      jest.fn().mockResolvedValue(this),
};

jest.mock('../../models/Artwork.js', () => ({
  __esModule: true,
  default: {
    find:            jest.fn(),
    findOne:         jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    create:          jest.fn(),
  },
}));

jest.mock('../../models/Item.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

describe('Artwork Controller', () => {
  let Artwork, Item;
  let getArtworks, getArtworkById, createArtwork, updateArtwork, deleteArtwork;
  let linkSourceItems, unlinkSourceItems, getSourceItems;

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

  const validId    = new mongoose.Types.ObjectId().toString();
  const validItemId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    Artwork = (await import('../../models/Artwork.js')).default;
    Item    = (await import('../../models/Item.js')).default;
    ({ getArtworks, getArtworkById, createArtwork, updateArtwork, deleteArtwork,
       linkSourceItems, unlinkSourceItems, getSourceItems } =
      await import('../../controllers/artworkController.js'));
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── getArtworks ──────────────────────────────────────────────────────────

  describe('getArtworks', () => {
    it('should return all artworks for the owner', async () => {
      const chain = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([mockArtwork]) };
      Artwork.find.mockReturnValue(chain);

      const res = mockRes();
      await getArtworks(mockReq(), res);

      expect(Artwork.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([mockArtwork]);
    });

    it('should return 500 on database error', async () => {
      Artwork.find.mockReturnValue({ populate: jest.fn().mockReturnThis(), sort: jest.fn().mockRejectedValue(new Error('DB error')) });

      const res = mockRes();
      await getArtworks(mockReq(), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── getArtworkById ───────────────────────────────────────────────────────

  describe('getArtworkById', () => {
    it('should return a single artwork by ID', async () => {
      Artwork.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockArtwork) });

      const res = mockRes();
      await getArtworkById(mockReq({ params: { id: validId } }), res);

      expect(res.json).toHaveBeenCalledWith(mockArtwork);
    });

    it('should return 400 for an invalid ID format', async () => {
      const res = mockRes();
      await getArtworkById(mockReq({ params: { id: 'bad-id' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if artwork is not found', async () => {
      Artwork.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const res = mockRes();
      await getArtworkById(mockReq({ params: { id: validId } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── createArtwork ────────────────────────────────────────────────────────

  describe('createArtwork', () => {
    it('should create an artwork with valid data', async () => {
      Artwork.create.mockResolvedValue({ ...mockArtwork, populate: jest.fn().mockResolvedValue(mockArtwork) });

      const res = mockRes();
      await createArtwork(mockReq({ body: { title: 'New Art', mediaUrl: 'https://example.com/art.png' } }), res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if title is missing', async () => {
      const res = mockRes();
      await createArtwork(mockReq({ body: { mediaUrl: 'https://example.com/art.png' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if mediaUrl is missing', async () => {
      const res = mockRes();
      await createArtwork(mockReq({ body: { title: 'No URL' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if a sourceItemId is not a valid ObjectId', async () => {
      const res = mockRes();
      await createArtwork(mockReq({
        body: { title: 'Art', mediaUrl: 'https://example.com/art.png', sourceItemIds: ['not-valid'] },
      }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if a sourceItem does not belong to the owner', async () => {
      Item.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) }); // 0 found, 1 expected

      const res = mockRes();
      await createArtwork(mockReq({
        body: { title: 'Art', mediaUrl: 'https://example.com/art.png', sourceItemIds: [validItemId] },
      }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── updateArtwork ────────────────────────────────────────────────────────

  describe('updateArtwork', () => {
    it('should update an artwork and return the updated document', async () => {
      const updated = { ...mockArtwork, title: 'Updated Title' };
      Artwork.findOneAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(updated) });

      const res = mockRes();
      await updateArtwork(mockReq({ params: { id: validId }, body: { title: 'Updated Title' } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title' }));
    });

    it('should return 400 for an invalid ID', async () => {
      const res = mockRes();
      await updateArtwork(mockReq({ params: { id: 'bad-id' }, body: { title: 'X' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if artwork is not found', async () => {
      Artwork.findOneAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const res = mockRes();
      await updateArtwork(mockReq({ params: { id: validId }, body: { title: 'Ghost' } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── deleteArtwork ────────────────────────────────────────────────────────

  describe('deleteArtwork', () => {
    it('should delete an artwork and confirm deletion', async () => {
      Artwork.findOneAndDelete.mockResolvedValue(mockArtwork);

      const res = mockRes();
      await deleteArtwork(mockReq({ params: { id: validId } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Artwork deleted successfully' }));
    });

    it('should return 400 for an invalid ID', async () => {
      const res = mockRes();
      await deleteArtwork(mockReq({ params: { id: 'bad-id' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if artwork is not found', async () => {
      Artwork.findOneAndDelete.mockResolvedValue(null);

      const res = mockRes();
      await deleteArtwork(mockReq({ params: { id: validId } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── S21: linkSourceItems ─────────────────────────────────────────────────

  describe('linkSourceItems', () => {
    it('should link items to an artwork', async () => {
      Item.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: validItemId }]) });
      Artwork.findOneAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockArtwork) });

      const res = mockRes();
      await linkSourceItems(mockReq({ params: { id: validId }, body: { itemIds: [validItemId] } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('linked') }));
    });

    it('should return 400 if itemIds is empty', async () => {
      const res = mockRes();
      await linkSourceItems(mockReq({ params: { id: validId }, body: { itemIds: [] } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if an itemId is not a valid ObjectId', async () => {
      const res = mockRes();
      await linkSourceItems(mockReq({ params: { id: validId }, body: { itemIds: ['bad-id'] } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if item does not belong to the owner', async () => {
      Item.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) }); // 0 found

      const res = mockRes();
      await linkSourceItems(mockReq({ params: { id: validId }, body: { itemIds: [validItemId] } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for an invalid artwork ID', async () => {
      const res = mockRes();
      await linkSourceItems(mockReq({ params: { id: 'bad-id' }, body: { itemIds: [validItemId] } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── S21: unlinkSourceItems ───────────────────────────────────────────────

  describe('unlinkSourceItems', () => {
    it('should unlink items from an artwork', async () => {
      Artwork.findOneAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(mockArtwork) });

      const res = mockRes();
      await unlinkSourceItems(mockReq({ params: { id: validId }, body: { itemIds: [validItemId] } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('unlinked') }));
    });

    it('should return 400 if itemIds is empty', async () => {
      const res = mockRes();
      await unlinkSourceItems(mockReq({ params: { id: validId }, body: { itemIds: [] } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if artwork is not found', async () => {
      Artwork.findOneAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const res = mockRes();
      await unlinkSourceItems(mockReq({ params: { id: validId }, body: { itemIds: [validItemId] } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ─── S21: getSourceItems ──────────────────────────────────────────────────

  describe('getSourceItems', () => {
    it('should return the inspiration path for an artwork', async () => {
      const artworkWithSources = { ...mockArtwork, sourceItemIds: [{ _id: validItemId, title: 'Source Item' }] };
      Artwork.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(artworkWithSources) });

      const res = mockRes();
      await getSourceItems(mockReq({ params: { id: validId } }), res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ count: 1 }));
    });

    it('should return 400 for an invalid artwork ID', async () => {
      const res = mockRes();
      await getSourceItems(mockReq({ params: { id: 'bad-id' } }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if artwork is not found', async () => {
      Artwork.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const res = mockRes();
      await getSourceItems(mockReq({ params: { id: validId } }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});