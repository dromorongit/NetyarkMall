const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Function to upload file to Cloudinary
const uploadToCloudinary = (file, folder = 'netyarkmall/products') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file.path, 
      { 
        folder: folder,
        resource_type: 'auto',
        overwrite: true 
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
          resolve(result.secure_url);
        }
      }
    );
  });
};

// Function to delete file from Cloudinary
const deleteFromCloudinary = (url) => {
  return new Promise((resolve, reject) => {
    // Extract public ID from URL
    const publicId = url.split('/').pop().split('.')[0];
    
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary delete error:', error);
        reject(error);
      } else {
        console.log('Cloudinary delete success:', result);
        resolve(result);
      }
    });
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  cloudinary
};