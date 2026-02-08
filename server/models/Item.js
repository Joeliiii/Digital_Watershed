import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'fs.files' // Reference to GridFS file
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    mediaType: {
        type: String, // e.g., 'image/png', 'application/pdf'
        required: true
    },
    storageType: {
        type: String, // e.g., 'local', 's3', 'gridfs'
        default: 'local'
    },
    filePath: {
        type: String // Local path if applicable
    },
    storageUrl: {
        type: String // Cloud URL if applicable
    },
    externalUrl: {
        type: String // If linking to external resource
    },
    projectIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    tagIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    metadata: {
        type: mongoose.Schema.Types.Mixed // Flexible field for arbitrary data
    },
    notes: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Text index for search
ItemSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Item', ItemSchema);
