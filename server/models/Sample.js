import mongoose from 'mongoose';

const SampleSchema = new mongoose.Schema({
    testField: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Sample', SampleSchema);
