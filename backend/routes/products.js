const express = require('express');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary, deleteFromCloudinary } = require('../cloudinaryConfig');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'backend', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get new arrivals (public)
router.get('/new-arrivals', async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get fast-selling items (public)
router.get('/fast-selling', async (req, res) => {
  try {
    const products = await Product.find({ isFastSelling: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get shop by category items (public)
router.get('/shop-by-category', async (req, res) => {
  try {
    const products = await Product.find({ isShopByCategory: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get in-stock products (public)
router.get('/in-stock', async (req, res) => {
  try {
    const products = await Product.find({ stockStatus: 'in-stock' });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get out-of-stock products (public)
router.get('/out-of-stock', async (req, res) => {
  try {
    const products = await Product.find({ stockStatus: 'out-of-stock' });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get wholesale products (public)
router.get('/wholesale', async (req, res) => {
  try {
    const products = await Product.find({ isWholesale: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get daily deals products (public)
router.get('/daily-deals', async (req, res) => {
  try {
    const products = await Product.find({ isDailyDeal: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get product by id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create product (admin only)
router.post('/', auth, adminAuth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'additionalMedia', maxCount: 10 }
]), async (req, res) => {
  console.log('POST /products called');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);
  const productData = req.body;
  console.log('productData before processing:', productData);
  
  try {
    // Upload main image to Cloudinary
    if (req.files.image && req.files.image[0]) {
      const imageUrl = await uploadToCloudinary(req.files.image[0], 'netyarkmall/products');
      productData.image = imageUrl;
    }
    
    // Upload additional media to Cloudinary
    if (req.files.additionalMedia) {
      const uploadPromises = req.files.additionalMedia.map(file =>
        uploadToCloudinary(file, 'netyarkmall/products/additional')
      );
      const mediaUrls = await Promise.all(uploadPromises);
      productData.additionalMedia = mediaUrls;
    }
    
    console.log('Final productData:', productData);
    const product = new Product(productData);
    await product.save();
    console.log('Product saved with id:', product._id);
    res.status(201).json(product);
  } catch (err) {
    console.log('Error saving product:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// Update product
router.put('/:id', auth, adminAuth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'additionalMedia', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('PUT /products/:id - Updating product:', req.params.id);
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);

    const productData = req.body;

    // Get current product to check for existing image
    const currentProduct = await Product.findById(req.params.id);
    console.log('Current product image:', currentProduct ? currentProduct.image : 'Product not found');

    // Handle image upload
    if (req.files && req.files.image && req.files.image[0]) {
      console.log('New image uploaded:', req.files.image[0].filename);
      
      // Upload new image to Cloudinary
      const newImageUrl = await uploadToCloudinary(req.files.image[0], 'netyarkmall/products');
      console.log('New image URL:', newImageUrl);
      productData.image = newImageUrl;

      // Delete old image from Cloudinary if it exists
      if (currentProduct && currentProduct.image) {
        try {
          await deleteFromCloudinary(currentProduct.image);
          console.log('Old image deleted from Cloudinary successfully');
        } catch (error) {
          console.error('Error deleting old image from Cloudinary:', error);
        }
      }
    } else {
      console.log('No new image uploaded, keeping existing image');
    }

    // Handle additional media uploads
    if (req.files && req.files.additionalMedia) {
      const uploadPromises = req.files.additionalMedia.map(file =>
        uploadToCloudinary(file, 'netyarkmall/products/additional')
      );
      const mediaUrls = await Promise.all(uploadPromises);
      
      // Combine new media with existing media (if any)
      const existingMedia = currentProduct.additionalMedia || [];
      productData.additionalMedia = [...existingMedia, ...mediaUrls];
    }

    // Handle array fields that come as comma-separated strings
    if (productData.colors && typeof productData.colors === 'string') {
      productData.colors = productData.colors.split(',').map(c => c.trim()).filter(c => c);
    }
    if (productData.sizes && typeof productData.sizes === 'string') {
      productData.sizes = productData.sizes.split(',').map(s => s.trim()).filter(s => s);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    console.log('Product updated successfully. New product data:', {
      id: product._id,
      name: product.name,
      image: product.image
    });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete product
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update stock
router.patch('/:id/stock', auth, adminAuth, async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;