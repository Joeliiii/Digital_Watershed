import mongoose from 'mongoose';

const RecentViewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    lastViewedAt: {
        type: Date,
        default: Date.now
    }
});

// Index to quickly find recent views for a user, sorted by date
RecentViewSchema.index({ userId: 1, lastViewedAt: -1 });

export default mongoose.model('RecentView', RecentViewSchema);
