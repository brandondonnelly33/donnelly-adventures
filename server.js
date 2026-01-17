import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cloudinary config (free tier: 25GB)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer for file uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for videos
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Initialize lowdb (JSON database)
const defaultData = { photos: [], journal: [], reactions: [] };
const adapter = new JSONFile('./data/donnelly.json');
const db = new Low(adapter, defaultData);

// Initialize database
async function initDb() {
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

await initDb();

// Helper for IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== PHOTO ENDPOINTS =====

// Upload photo/video
app.post('/api/photos', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { caption, uploaded_by, day_number } = req.body;
    const isVideo = req.file.mimetype.startsWith('video/');

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'donnelly-adventures',
          resource_type: isVideo ? 'video' : 'image',
          transformation: isVideo ? [] : [{ quality: 'auto', fetch_format: 'auto' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Save to database
    const photo = {
      id: generateId(),
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      caption: caption || '',
      uploaded_by: uploaded_by || 'Anonymous',
      day_number: day_number ? parseInt(day_number) : null,
      type: isVideo ? 'video' : 'image',
      created_at: new Date().toISOString()
    };

    db.data.photos.unshift(photo);
    await db.write();

    res.json(photo);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get all photos
app.get('/api/photos', async (req, res) => {
  await db.read();
  const { day } = req.query;
  let photos = db.data.photos;

  if (day) {
    photos = photos.filter(p => p.day_number === parseInt(day));
  }

  res.json(photos);
});

// Delete photo
app.delete('/api/photos/:id', async (req, res) => {
  try {
    await db.read();
    const photoIndex = db.data.photos.findIndex(p => p.id === req.params.id);

    if (photoIndex === -1) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = db.data.photos[photoIndex];

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(photo.public_id, {
      resource_type: photo.type === 'video' ? 'video' : 'image'
    });

    // Delete from database
    db.data.photos.splice(photoIndex, 1);
    await db.write();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ===== JOURNAL ENDPOINTS =====

// Add journal entry
app.post('/api/journal', async (req, res) => {
  const { author, content, day_number } = req.body;

  if (!author || !content) {
    return res.status(400).json({ error: 'Author and content required' });
  }

  const entry = {
    id: generateId(),
    author,
    content,
    day_number: day_number || null,
    created_at: new Date().toISOString()
  };

  db.data.journal.unshift(entry);
  await db.write();

  res.json(entry);
});

// Get journal entries
app.get('/api/journal', async (req, res) => {
  await db.read();
  const { day } = req.query;
  let entries = db.data.journal;

  if (day) {
    entries = entries.filter(e => e.day_number === parseInt(day));
  }

  res.json(entries);
});

// Delete journal entry
app.delete('/api/journal/:id', async (req, res) => {
  await db.read();
  db.data.journal = db.data.journal.filter(e => e.id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

// ===== REACTIONS ENDPOINTS =====

// Add reaction
app.post('/api/reactions', async (req, res) => {
  const { target_type, target_id, emoji, author } = req.body;

  const reaction = {
    id: generateId(),
    target_type,
    target_id,
    emoji,
    author: author || 'Anonymous',
    created_at: new Date().toISOString()
  };

  db.data.reactions.push(reaction);
  await db.write();

  res.json(reaction);
});

// Get reactions for a target
app.get('/api/reactions/:type/:id', async (req, res) => {
  await db.read();
  const reactions = db.data.reactions.filter(
    r => r.target_type === req.params.type && r.target_id === req.params.id
  );

  // Group by emoji
  const grouped = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const result = Object.entries(grouped).map(([emoji, count]) => ({ emoji, count }));
  res.json(result);
});

// ===== STATS ENDPOINT =====
app.get('/api/stats', async (req, res) => {
  await db.read();
  res.json({
    photos: db.data.photos.length,
    journal_entries: db.data.journal.length,
    reactions: db.data.reactions.length
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  Donnelly Adventures running!`);
  console.log(`  Open: http://localhost:${PORT}\n`);
});
