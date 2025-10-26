// middleware/uploadMiddleware.js
const multer = require('multer');
const ImageKit = require('imagekit');

// Initialize ImageKit with provided credentials
let imagekit = null;

try {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_iQC/A+7kCdKzHy7zBYmkC3ZVDqU=",
    // TODO: Replace with your actual ImageKit private key
    // You need to get your full private key from ImageKit dashboard
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_BeGqbsC5xu******************",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/lejhn0bpzf"
  });
  console.log('✅ ImageKit initialized successfully');
} catch (error) {
  console.error('❌ ImageKit initialization error:', error);
  console.warn('⚠️ ImageKit not initialized. Placeholder URLs will be used.');
  imagekit = null;
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

