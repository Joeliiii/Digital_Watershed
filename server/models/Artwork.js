import mongoose from 'mongoose';

const ArtworkSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    mediaUrl: {
        type: String,
        required: true
    },
    sourceItemIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
    }]
}, {
    timestamps: true
});

export default mongoose.model('Artwork', ArtworkSchema);
