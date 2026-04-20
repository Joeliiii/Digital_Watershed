import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.config.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import tagRelationshipRoutes from './routes/tagRelationshipRoutes.js';
import artworkRoutes from './routes/artworkRoutes.js';  
import noteRoutes from './routes/noteRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import AuditLog from './models/AuditLog.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
// Connect to Database
// connectDB() called before listen

// Middleware
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/tag-relationships', tagRelationshipRoutes);
app.use('/api/artworks', artworkRoutes);  
app.use('/api/notes', noteRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Connect to Database and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to database', err);
    process.exit(1);
});

//Migrate existing audit logs to new schema if needed
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('MongoDB connected');
        
        // ONE-TIME MIGRATION - run this once to update existing audit logs with createdAt
        const result = await AuditLog.updateMany(
            { createdAt: { $exists: false } },
            [{ $set: { createdAt: '$timestamp' } }]
        );
        console.log(`Migrated ${result.modifiedCount} audit logs`);
        // END MIGRATION
    })
    .catch(err => console.error('MongoDB connection error:', err));
