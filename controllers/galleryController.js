import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import Gallery from '../models/Gallery.js';

// Pipe a buffer (from multer memoryStorage) straight into Cloudinary's upload stream.
const uploadBufferToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });
};

// Extract the 11-char video ID from any common YouTube URL shape
// (watch?v=, youtu.be/, /embed/, /shorts/).
const getYouTubeId = (url = '') => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

// Build a Cloudinary-generated thumbnail (first frame) for an uploaded video.
const buildVideoThumbnail = (publicId) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [{ width: 600, height: 400, crop: 'fill', gravity: 'auto', start_offset: '0' }],
  });
};

const destroyFromCloudinary = async (publicId, mediaType) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: mediaType === 'video' ? 'video' : 'image',
    });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

// GET /api/gallery  (public)
export const getAllGallery = async (req, res) => {
  try {
    const { category, mediaType } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (mediaType && mediaType !== 'All') filter.mediaType = mediaType;

    const items = await Gallery.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/gallery/:id  (public)
export const getGalleryById = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Gallery item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/gallery  (admin only)
export const createGallery = async (req, res) => {
  try {
    const { title, description, category, mediaType, sourceType, mediaUrl } = req.body;

    if (!title || !mediaType || !sourceType) {
      return res.status(400).json({
        success: false,
        error: 'Title, media type and source type are required',
      });
    }

    if (!['image', 'video'].includes(mediaType)) {
      return res.status(400).json({ success: false, error: 'Media type must be image or video' });
    }

    let finalMediaUrl = '';
    let finalThumbnailUrl = '';
    let publicId = '';

    if (sourceType === 'upload') {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, {
        resource_type: mediaType === 'video' ? 'video' : 'image',
        folder: 'school_gallery',
      });

      finalMediaUrl = result.secure_url;
      publicId = result.public_id;

      if (mediaType === 'video') {
        finalThumbnailUrl = buildVideoThumbnail(result.public_id);
      }
    } else if (sourceType === 'url') {
      if (!mediaUrl || !mediaUrl.trim()) {
        return res.status(400).json({ success: false, error: 'Media URL is required' });
      }
      finalMediaUrl = mediaUrl.trim();
      // If it's a YouTube link, pull a real thumbnail from YouTube's own CDN
      // (no API key needed). Otherwise leave blank — the frontend falls back
      // to a default play-icon placeholder card.
      const ytId = mediaType === 'video' ? getYouTubeId(finalMediaUrl) : null;
      finalThumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
    } else {
      return res.status(400).json({ success: false, error: 'Source type must be upload or url' });
    }

    const galleryItem = await Gallery.create({
      title: title.trim(),
      description: (description || '').trim(),
      category: (category || 'General').trim(),
      mediaType,
      sourceType,
      mediaUrl: finalMediaUrl,
      thumbnailUrl: finalThumbnailUrl,
      publicId,
    });

    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: galleryItem,
    });
  } catch (error) {
    console.error('Create gallery error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create gallery item' });
  }
};

// PUT /api/gallery/:id  (admin only)
export const updateGallery = async (req, res) => {
  try {
    const existing = await Gallery.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Gallery item not found' });
    }

    const { title, description, category, mediaType, sourceType, mediaUrl } = req.body;
    const finalMediaType = mediaType || existing.mediaType;

    const updates = {
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      category: category !== undefined ? category.trim() : existing.category,
      mediaType: finalMediaType,
    };

    // Replacing the media itself (new file upload or a new pasted URL)
    if (sourceType === 'upload' && req.file) {
      // Remove the old Cloudinary asset first, if there was one
      if (existing.publicId) {
        await destroyFromCloudinary(existing.publicId, existing.mediaType);
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, {
        resource_type: finalMediaType === 'video' ? 'video' : 'image',
        folder: 'school_gallery',
      });

      updates.mediaUrl = result.secure_url;
      updates.publicId = result.public_id;
      updates.sourceType = 'upload';
      updates.thumbnailUrl = finalMediaType === 'video' ? buildVideoThumbnail(result.public_id) : '';
    } else if (sourceType === 'url' && mediaUrl && mediaUrl.trim()) {
      if (existing.publicId) {
        await destroyFromCloudinary(existing.publicId, existing.mediaType);
      }
      updates.mediaUrl = mediaUrl.trim();
      updates.publicId = '';
      updates.sourceType = 'url';
      const ytId = finalMediaType === 'video' ? getYouTubeId(updates.mediaUrl) : null;
      updates.thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
    }
    // else: keep the existing media untouched, only metadata (title/description/category) changed

    const updated = await Gallery.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Gallery item updated successfully', data: updated });
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update gallery item' });
  }
};

// DELETE /api/gallery/:id  (admin only)
export const deleteGallery = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Gallery item not found' });
    }

    if (item.publicId) {
      await destroyFromCloudinary(item.publicId, item.mediaType);
    }

    await Gallery.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete gallery item' });
  }
};