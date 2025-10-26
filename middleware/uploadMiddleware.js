// middleware/uploadMiddleware.js
const multer = require('multer');
const ImageKit = require('imagekit');

// Initialize ImageKit (only if credentials are available)
let imagekit = null;

if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY) {
  try {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/lejhn0bpzf"
    });
  } catch (error) {
    console.error('ImageKit initialization error:', error);
    imagekit = null;
  }
} else {
  console.warn('ImageKit credentials not found. Image uploads will be disabled.');
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Upload to ImageKit
const uploadToImageKit = async (file, folder = 'agro') => {
  if (!imagekit) {
    console.warn('ImageKit not initialized. Returning placeholder URL.');
    // Return a placeholder URL for development/testing
    return `https://via.placeholder.com/400?text=${file.originalname}`;
  }
  
  try {
    const uploadResult = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
      folder: folder,
    });
    
    return uploadResult.url;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
};

module.exports = { upload, uploadToImageKit };

