import Artwork from '../models/Artwork.js';
import Item from '../models/Item.js';
import mongoose from 'mongoose';

// ─── Helpers ────────────────────────────────────────────────────────────────

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// TODO: Replace with TEMP_OWNER_ID once auth middleware is implemented 
const TEMP_OWNER_ID = '6987c45da0cb4423e71e1ffd';

// ─── CRUD ───────────────────────────────────────────────────────────────────

/**
 * GET /api/artworks
 * Returns all artworks owned by the authenticated user.
 */
export const getArtworks = async (req, res) => {
  try {
    const artworks = await Artwork.find({ ownerId: TEMP_OWNER_ID })
      .populate('sourceItemIds', 'title mediaType storageUrl filePath externalUrl')
      .sort({ createdAt: -1 });

    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/artworks/:id
 * Returns a single artwork with its linked source items populated.
 */
export const getArtworkById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid artwork ID' });

    const artwork = await Artwork.findOne({ _id: id, ownerId: TEMP_OWNER_ID }).populate(
      'sourceItemIds',
      'title description mediaType storageUrl filePath externalUrl metadata'
    );

    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    res.json(artwork);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/artworks
 * Creates a new artwork. Optionally accepts sourceItemIds on creation.
 */
export const createArtwork = async (req, res) => {
  try {
    const { title, description, mediaUrl, sourceItemIds = [] } = req.body;

    if (!title || !mediaUrl) {
      return res.status(400).json({ message: 'title and mediaUrl are required' });
    }

    // Validate any sourceItemIds provided upfront
    if (sourceItemIds.length > 0) {
      const invalidIds = sourceItemIds.filter((id) => !isValidId(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({ message: 'One or more sourceItemIds are invalid', invalidIds });
      }

      const foundItems = await Item.find({
        _id: { $in: sourceItemIds },
        ownerId: TEMP_OWNER_ID,
        isDeleted: false,
      }).select('_id');

      if (foundItems.length !== sourceItemIds.length) {
        return res.status(400).json({
          message: 'Some source items were not found or do not belong to you',
        });
      }
    }

    const artwork = await Artwork.create({
      ownerId: TEMP_OWNER_ID,
      title,
      description,
      mediaUrl,
      sourceItemIds,
    });

    const populated = await artwork.populate(
      'sourceItemIds',
      'title mediaType storageUrl filePath externalUrl'
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PUT /api/artworks/:id
 * Updates title, description, or mediaUrl of an artwork.
 * Use the dedicated /link and /unlink routes to manage source items.
 */
export const updateArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid artwork ID' });

    const { title, description, mediaUrl } = req.body;

    const artwork = await Artwork.findOneAndUpdate(
      { _id: id, ownerId: TEMP_OWNER_ID },
      { ...(title && { title }), ...(description !== undefined && { description }), ...(mediaUrl && { mediaUrl }) },
      { new: true, runValidators: true }
    ).populate('sourceItemIds', 'title mediaType storageUrl filePath externalUrl');

    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    res.json(artwork);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * DELETE /api/artworks/:id
 * Hard-deletes an artwork.
 */
export const deleteArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid artwork ID' });

    const artwork = await Artwork.findOneAndDelete({ _id: id, ownerId: TEMP_OWNER_ID });
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    res.json({ message: 'Artwork deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


/**
 * POST /api/artworks/:id/link
 * Body: { itemIds: ["<ObjectId>", ...] }
 *
 * Links one or more research Items to an Artwork as inspiration sources.
 */
export const linkSourceItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIds } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid artwork ID' });
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: 'itemIds must be a non-empty array' });
    }

    const invalidIds = itemIds.filter((i) => !isValidId(i));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: 'One or more itemIds are invalid', invalidIds });
    }

    // Verify items exist and belong to this user
    const foundItems = await Item.find({
      _id: { $in: itemIds },
      ownerId: TEMP_OWNER_ID,
      isDeleted: false,
    }).select('_id');

    if (foundItems.length !== itemIds.length) {
      return res.status(400).json({
        message: 'Some items were not found or do not belong to you',
      });
    }

    const artwork = await Artwork.findOneAndUpdate(
      { _id: id, ownerId: TEMP_OWNER_ID },
      { $addToSet: { sourceItemIds: { $each: itemIds } } }, // $addToSet prevents duplicates
      { new: true }
    ).populate('sourceItemIds', 'title description mediaType storageUrl filePath externalUrl metadata');

    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    res.json({
      message: `${itemIds.length} item(s) linked as inspiration sources`,
      artwork,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * DELETE /api/artworks/:id/link
 * Body: { itemIds: ["<ObjectId>", ...] }
 *
 * Removes one or more research Items from an Artwork's inspiration sources.
 */
export const unlinkSourceItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIds } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid artwork ID' });
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ message: 'itemIds must be a non-empty array' });
    }

    const invalidIds = itemIds.filter((i) => !isValidId(i));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: 'One or more itemIds are invalid', invalidIds });
    }

    const artwork = await Artwork.findOneAndUpdate(
      { _id: id, ownerId: TEMP_OWNER_ID },
      { $pull: { sourceItemIds: { $in: itemIds } } },
      { new: true }
    ).populate('sourceItemIds', 'title description mediaType storageUrl filePath externalUrl metadata');

    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    res.json({
      message: `${itemIds.length} item(s) unlinked from inspiration sources`,
      artwork,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/artworks/:id/sources
 * Returns the full inspiration path: all source Items linked to this Artwork.
 */
export const getSourceItems = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid artwork ID' });

    const artwork = await Artwork.findOne({ _id: id, ownerId: TEMP_OWNER_ID }).populate({
      path: 'sourceItemIds',
      match: { isDeleted: false },
      select: 'title description mediaType storageUrl filePath externalUrl metadata createdAt',
    });

    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    res.json({
      artworkId: artwork._id,
      artworkTitle: artwork.title,
      sourceItems: artwork.sourceItemIds,
      count: artwork.sourceItemIds.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};