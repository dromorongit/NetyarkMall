const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a specific product
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit a review (authenticated users only)
router.post('/', auth, async (req, res) => {
  try {
    const { productId, rating, title, review } = req.body;

    // Validate required fields
    if (!productId || !rating || !review) {
      return res.status(400).json({ message: 'Product ID, rating, and review are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: productId,
      userId: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Create new review
    const newReview = new Review({
      productId,
      userId: req.user.id,
      userName: req.user.name,
      rating: parseInt(rating),
      title: title ? title.trim() : '',
      review: review.trim()
    });

    const savedReview = await newReview.save();

    // Update product rating and review count
    await updateProductRating(productId);

    res.status(201).json(savedReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a review (authenticated users only - only the review owner can update)
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { rating, title, review } = req.body;

    // Find the review
    const existingReview = await Review.findById(req.params.reviewId);
    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review
    if (existingReview.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    // Update review
    existingReview.rating = rating || existingReview.rating;
    existingReview.title = title !== undefined ? title.trim() : existingReview.title;
    existingReview.review = review || existingReview.review;
    existingReview.updatedAt = new Date();

    const updatedReview = await existingReview.save();

    // Update product rating
    await updateProductRating(existingReview.productId);

    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a review (authenticated users only - only the review owner can delete)
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(req.params.reviewId);

    // Update product rating
    await updateProductRating(productId);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper function to update product rating and review count
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ productId });

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, { rating: 0, reviews: 0 });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviews: reviews.length
    });
  } catch (err) {
    console.error('Error updating product rating:', err);
  }
}

module.exports = router;