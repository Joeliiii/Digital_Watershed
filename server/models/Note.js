import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    entityModel: {
      type: String,
      required: true,
      enum: ['Artwork', 'Item', 'Project', 'Tag'], // extend as new models are added
    },

    // --- Content ---
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // --- Soft delete ---
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

NoteSchema.index({ entityId: 1, entityModel: 1 });

NoteSchema.index({ title: 'text', content: 'text' });

NoteSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

export default mongoose.model('Note', NoteSchema);