// Product data for Netyark Mall E-commerce Website
// All prices in Ghana Cedis (₵)

// API Base URL - configure for your admin system domain
// For local development: http://localhost:5000/api
// For Railway deployment: https://your-railway-project.up.railway.app/api
// For production: https://netyarkmallaims-production-d2ae.up.railway.app/api
const API_BASE = 'https://netyarkmallaims-production-d2ae.up.railway.app/api';

// Cache for products
let productCache = null;
let categoriesCache = null;

// Clear product cache to force refresh
function clearProductCache() {
    productCache = null;
    console.log('Product cache cleared');
}

// Fetch products from API
async function fetchProducts(forceRefresh = false) {
  if (productCache && !forceRefresh) {
    console.log('Returning cached products:', productCache.length, 'items');
    return productCache;
  }

  console.log('Fetching products from API...');
  try {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Include credentials if needed
      credentials: 'include'
    });
    console.log('API response status:', response.status);
    if (response.ok) {
      productCache = await response.json();
      console.log('Fetched products:', productCache.length, 'items');
      return productCache;
    } else {
      console.error('API response not ok:', response.status, response.statusText);
      // Log response text for debugging
      const errorText = await response.text();
      console.error('API error response:', errorText);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  // Fallback to empty array if API fails
  console.log('Falling back to empty array');
  return [];
}

// Fetch wholesale products from API
async function fetchWholesaleProducts() {
  console.log('Fetching wholesale products from API...');
  try {
    const response = await fetch(`${API_BASE}/products/wholesale`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    console.log('Wholesale API response status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Fetched wholesale products:', data.length, 'items');
      return data;
    } else {
      console.error('Wholesale API response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Wholesale API error response:', errorText);
    }
  } catch (error) {
    console.error('Error fetching wholesale products:', error);
  }
  console.log('Falling back to empty wholesale array');
  return [];
}

// Legacy product database for fallback (keeping for compatibility)
const productDatabase = {
    // Electronics
    smartphones: [
        {
            id: 'smartphone-premium',
            name: 'Premium Smartphone',
            price: 2500,
            originalPrice: 3000,
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'electronics',
            description: 'Latest model with advanced features and 5G connectivity',
            rating: 4.5,
            reviews: 128,
            isNew: true,
            inStock: true,
            stockCount: 25,
            variants: {
                colors: ['Black', 'White', 'Blue'],
                storage: ['128GB', '256GB', '512GB']
            },
            images: [
                'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
            ]
        },
        {
            id: 'smartphone-mid-range',
            name: 'Mid-Range Smartphone',
            price: 1200,
            originalPrice: 1500,
            image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'electronics',
            description: 'Perfect balance of performance and affordability',
            rating: 4.2,
            reviews: 89,
            isNew: false,
            inStock: true,
            stockCount: 40
        },
        {
            id: 'smartphone-budget',
            name: 'Budget Smartphone',
            price: 600,
            originalPrice: 800,
            image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'electronics',
            description: 'Essential features at an affordable price',
            rating: 4.0,
            reviews: 156,
            isNew: false,
            inStock: true,
            stockCount: 60
        }
    ],
    
    laptops: [
        {
            id: 'gaming-laptop',
            name: 'Gaming Laptop',
            price: 8000,
            originalPrice: 10000,
            image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'electronics',
            description: 'High-performance laptop for work and gaming',
            rating: 4.7,
            reviews: 45,
            isNew: true,
            inStock: true,
            stockCount: 12
        },
        {
            id: 'business-laptop',
            name: 'Business Laptop',
            price: 3500,
            originalPrice: 4500,
            image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'electronics',
            description: 'Professional laptop for business and productivity',
            rating: 4.4,
            reviews: 67,
            isNew: false,
            inStock: true,
            stockCount: 18
        }
    ],

    // Fashion
    dresses: [
        {
            id: 'designer-dress',
            name: 'Designer Dress',
            price: 800,
            originalPrice: 1200,
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'fashion',
            description: 'Elegant dress perfect for special occasions',
            rating: 4.6,
            reviews: 34,
            isNew: true,
            inStock: true,
            stockCount: 15
        },
        {
            id: 'casual-dress',
            name: 'Casual Summer Dress',
            price: 300,
            originalPrice: 400,
            image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'fashion',
            description: 'Comfortable and stylish for everyday wear',
            rating: 4.3,
            reviews: 78,
            isNew: false,
            inStock: true,
            stockCount: 32
        }
    ],

    mensClothing: [
        {
            id: 'mens-leather-jacket',
            name: 'Men\'s Leather Jacket',
            price: 1200,
            originalPrice: 1600,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'fashion',
            description: 'Premium quality leather jacket for men',
            rating: 4.5,
            reviews: 23,
            isNew: false,
            inStock: true,
            stockCount: 8
        },
        {
            id: 'mens-casual-shirt',
            name: 'Men\'s Casual Shirt',
            price: 200,
            originalPrice: 250,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'fashion',
            description: 'Comfortable cotton shirt for casual occasions',
            rating: 4.2,
            reviews: 91,
            isNew: false,
            inStock: true,
            stockCount: 45
        }
    ],

    // Home & Kitchen
    kitchenSets: [
        {
            id: 'kitchen-set',
            name: 'Complete Kitchen Set',
            price: 1500,
            originalPrice: 2300,
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'home',
            description: 'Professional-grade cookware and utensils',
            rating: 4.7,
            reviews: 56,
            isNew: true,
            inStock: true,
            stockCount: 20
        },
        {
            id: 'coffee-maker',
            name: 'Automatic Coffee Maker',
            price: 400,
            originalPrice: 600,
            image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'home',
            description: 'Brew perfect coffee every time',
            rating: 4.4,
            reviews: 73,
            isNew: false,
            inStock: true,
            stockCount: 25
        }
    ],

    // Health & Beauty
    skincare: [
        {
            id: 'skincare-set',
            name: 'Premium Skincare Set',
            price: 600,
            originalPrice: 900,
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'beauty',
            description: 'Complete skincare routine for all skin types',
            rating: 4.8,
            reviews: 112,
            isNew: true,
            inStock: true,
            stockCount: 30
        },
        {
            id: 'vitamin-c-serum',
            name: 'Vitamin C Serum',
            price: 250,
            originalPrice: 350,
            image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'beauty',
            description: 'Brightening serum for radiant skin',
            rating: 4.6,
            reviews: 89,
            isNew: false,
            inStock: true,
            stockCount: 42
        }
    ],

    // Jewelry
    accessories: [
        {
            id: 'gold-necklace',
            name: 'Gold Plated Necklace',
            price: 450,
            originalPrice: 650,
            image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'fashion',
            description: 'Elegant gold-plated necklace for special occasions',
            rating: 4.5,
            reviews: 67,
            isNew: false,
            inStock: true,
            stockCount: 15
        },
        {
            id: 'silver-earrings',
            name: 'Silver Drop Earrings',
            price: 180,
            originalPrice: 250,
            image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'fashion',
            description: 'Stylish silver earrings for everyday wear',
            rating: 4.3,
            reviews: 45,
            isNew: true,
            inStock: true,
            stockCount: 22
        }
    ],

    // Wholesale Products
    wholesale: [
        {
            id: 'wholesale-smartphones',
            name: 'Bulk Smartphone Pack (10 units)',
            price: 18000, // Wholesale price
            originalPrice: 25000, // Retail equivalent
            wholesalePrice: 18000,
            moq: 10,
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'wholesale',
            description: 'Premium smartphones in bulk for wholesale buyers',
            rating: 4.5,
            reviews: 23,
            isNew: false,
            inStock: true,
            stockCount: 100,
            isWholesale: true
        },
        {
            id: 'wholesale-laptops',
            name: 'Business Laptops Bulk (5 units)',
            price: 17500, // Wholesale price
            originalPrice: 22500, // Retail equivalent
            wholesalePrice: 17500,
            moq: 5,
            image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'wholesale',
            description: 'Professional laptops for corporate buyers',
            rating: 4.6,
            reviews: 18,
            isNew: true,
            inStock: true,
            stockCount: 50,
            isWholesale: true
        },
        {
            id: 'wholesale-dresses',
            name: 'Designer Dresses Collection (20 pieces)',
            price: 3200, // Wholesale price
            originalPrice: 4000, // Retail equivalent
            wholesalePrice: 3200,
            moq: 20,
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'wholesale',
            description: 'Elegant dresses for fashion retailers',
            rating: 4.4,
            reviews: 31,
            isNew: false,
            inStock: true,
            stockCount: 200,
            isWholesale: true
        },
        {
            id: 'wholesale-kitchen-set',
            name: 'Professional Kitchen Set (15 sets)',
            price: 6750, // Wholesale price
            originalPrice: 9000, // Retail equivalent
            wholesalePrice: 6750,
            moq: 15,
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'wholesale',
            description: 'Complete kitchen sets for bulk buyers',
            rating: 4.7,
            reviews: 27,
            isNew: true,
            inStock: true,
            stockCount: 75,
            isWholesale: true
        },
        {
            id: 'wholesale-skincare',
            name: 'Premium Skincare Bundle (25 units)',
            price: 3000, // Wholesale price
            originalPrice: 4500, // Retail equivalent
            wholesalePrice: 3000,
            moq: 25,
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'wholesale',
            description: 'Complete skincare routines for beauty retailers',
            rating: 4.8,
            reviews: 42,
            isNew: false,
            inStock: true,
            stockCount: 150,
            isWholesale: true
        },
        {
            id: 'wholesale-jewelry',
            name: 'Fashion Jewelry Mix (50 pieces)',
            price: 9000, // Wholesale price
            originalPrice: 13500, // Retail equivalent
            wholesalePrice: 9000,
            moq: 50,
            image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: 'wholesale',
            description: 'Assorted jewelry collection for retailers',
            rating: 4.3,
            reviews: 19,
            isNew: true,
            inStock: true,
            stockCount: 300,
            isWholesale: true
        }
    ]
};

// Get all products as a flat array
async function getAllProducts() {
    const products = await fetchProducts();
    return products;
}

// Get products by category
async function getProductsByCategory(category) {
    const products = await fetchProducts();
    // Handle both API categories (with spaces) and frontend categories (with dashes)
    const categoryMap = {
        'kitchen-appliances': 'Kitchen Appliances',
        'beauty-personal-care': 'Beauty & Personal Care',
        'photography-content-creation-tools': 'Photography & Content Creation Tools',
        'nail-supplies': 'Nail Supplies',
        'kids-babies': 'Kids & Babies',
        'home-essentials': 'Home Essentials',
        'lighting-home-decor': 'Lighting & Home Decor'
    };

    const apiCategory = categoryMap[category] || category;
    return products.filter(product => product.category === apiCategory || product.category === category);
}

// Get new arrivals (products marked as new)
async function getNewArrivals() {
    const products = await getAllProducts();
    const newArrivals = products.filter(product => product.isNew || product.isNewArrival);
    console.log('New arrivals found:', newArrivals.length, 'products');
    // For testing, if no new arrivals, return first few products
    if (newArrivals.length === 0 && products.length > 0) {
        console.log('No products marked as new, returning first 4 products for testing');
        return products.slice(0, 4);
    }
    return newArrivals;
}

// Get wholesale products
async function getWholesaleProducts() {
    // First try the dedicated wholesale endpoint
    const wholesaleProducts = await fetchWholesaleProducts();
    if (wholesaleProducts.length > 0) {
        return wholesaleProducts;
    }

    // Fallback: filter all products for wholesale items (those with MOQ or isWholesale flag)
    const allProducts = await getAllProducts();
    const filteredWholesale = allProducts.filter(product =>
        product.isWholesale || (product.moq && product.moq > 1)
    );
    console.log('Filtered wholesale products:', filteredWholesale.length, 'items');
    return filteredWholesale;
}

// Get fast-selling items (products with high review count and good ratings)
async function getFastSellingItems() {
    const products = await getAllProducts();
    const fastSelling = products
        .filter(product => product.isFastSelling || (product.reviews > 50 && product.rating >= 4.0))
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 8);
    console.log('Fast-selling items found:', fastSelling.length, 'products');
    // For testing, if no fast-selling, return next 8 products
    if (fastSelling.length === 0 && products.length > 4) {
        console.log('No fast-selling products, returning next 8 products for testing');
        return products.slice(4, 12);
    }
    return fastSelling;
}

// Get products by ID
async function getProductById(id) {
    const products = await getAllProducts();
    return products.find(product => product.id === id || product._id === id);
}

// Get category data for the homepage category grid
async function getCategoryData() {
    const products = await getAllProducts();
    return [
        {
            name: 'Kitchen Appliances',
            id: 'kitchen-appliances',
            image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: products.filter(p => p.category === 'Kitchen Appliances' || p.category === 'kitchen-appliances' || p.category === 'home').length,
            color: '#008000'
        },
        {
            name: 'Beauty & Personal Care',
            id: 'beauty-personal-care',
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: products.filter(p => p.category === 'Beauty & Personal Care' || p.category === 'beauty-personal-care' || p.category === 'beauty').length,
            color: '#FFA500'
        },
        {
            name: 'Photography & Content Creation Tools',
            id: 'photography-content-creation-tools',
            image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: products.filter(p => p.category === 'Photography & Content Creation Tools' || p.category === 'photography-content-creation-tools' || p.category === 'electronics').length,
            color: '#008000'
        },
        {
            name: 'Nail Supplies',
            id: 'nail-supplies',
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: products.filter(p => p.category === 'Nail Supplies' || p.category === 'nail-supplies').length,
            color: '#FFA500'
        },
        {
            name: 'Kids & Babies',
            id: 'kids-babies',
            image: 'https://images.unsplash.com/photo-1515488042361-ee00b0aa5b4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: products.filter(p => p.category === 'Kids & Babies' || p.category === 'kids-babies').length,
            color: '#008000'
        },
        {
            name: 'Home Essentials',
            id: 'home-essentials',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: products.filter(p => p.category === 'Home Essentials' || p.category === 'home-essentials' || p.category === 'home').length,
            color: '#FFA500'
        },
        {
            name: 'Lighting & Home Decor',
            id: 'lighting-home-decor',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: products.filter(p => p.category === 'Lighting & Home Decor' || p.category === 'lighting-home-decor').length,
            color: '#008000'
        }
    ];
}

// Search products
async function searchProducts(query) {
    const products = await getAllProducts();
    const lowercaseQuery = query.toLowerCase();
    return products.filter(product =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
}

// Get suggested products for cart page
async function getSuggestedProducts(currentProductIds = []) {
    const allProducts = await getAllProducts();
    return allProducts
        .filter(product => !currentProductIds.includes(product.id))
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, 4);
}

// Product formatting functions
function formatPrice(price) {
    return `₵${price.toLocaleString()}`;
}

function calculateDiscount(originalPrice, currentPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}
// Helper function to get full image URL
function getFullImageUrl(imagePath) {
    if (imagePath && imagePath.startsWith('/uploads/')) {
        return `${API_BASE}${imagePath}`;
    }
    // Handle undefined or invalid image paths
    if (!imagePath || imagePath === 'undefined' || imagePath === '') {
        return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'; // Default placeholder image
    }
    return imagePath;
}

// Export for use in browser
window.productDatabase = productDatabase;
window.getAllProducts = getAllProducts;
window.getProductsByCategory = getProductsByCategory;
window.getNewArrivals = getNewArrivals;
window.getFastSellingItems = getFastSellingItems;
window.getProductById = getProductById;
window.getCategoryData = getCategoryData;
window.getWholesaleProducts = getWholesaleProducts;
window.searchProducts = searchProducts;
window.getSuggestedProducts = getSuggestedProducts;
window.formatPrice = formatPrice;
window.calculateDiscount = calculateDiscount;
window.getFullImageUrl = getFullImageUrl;
window.clearProductCache = clearProductCache;


// Product reviews management
function addProductReview(review) {
    // In a real implementation, this would be stored in a database
    // For now, we'll store in localStorage
    const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
    reviews.push(review);
    localStorage.setItem('product_reviews', JSON.stringify(reviews));
}

function getProductReviews(productId) {
    const reviews = JSON.parse(localStorage.getItem('product_reviews') || '[]');
    return reviews.filter(review => review.productId === productId);
}

function getProductRating(productId) {
    const reviews = getProductReviews(productId);
    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
}

function getProductReviewCount(productId) {
    return getProductReviews(productId).length;
}

// Update product ratings in database (this would be done server-side in real app)
function updateProductRating(productId) {
    const rating = getProductRating(productId);
    const reviewCount = getProductReviewCount(productId);

    // Update the product in our database
    const allProducts = getAllProducts();
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        product.rating = rating;
        product.reviews = reviewCount;
        // In a real app, this would update the database
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        productDatabase,
        getAllProducts,
        getProductsByCategory,
        getNewArrivals,
        getFastSellingItems,
        getProductById,
        getCategoryData,
        getWholesaleProducts,
        searchProducts,
        getSuggestedProducts,
        formatPrice,
        calculateDiscount,
        addProductReview,
        getProductReviews,
        getProductRating,
        getProductReviewCount,
        updateProductRating
    };
}

// Inventory Management
function checkInventory(productId, requestedQuantity = 1) {
    // Mock inventory check - in real app, this would call API
    const product = getProductById(productId);
    if (!product) return { available: false, reason: 'Product not found' };

    const stockCount = product.stock || product.stockCount || 0;
    const inStock = product.inStock !== undefined ? product.inStock : stockCount > 0;

    if (!inStock) return { available: false, reason: 'Out of stock' };

    if (stockCount < requestedQuantity) {
        return { available: false, reason: 'Insufficient stock' };
    }

    return {
        available: true,
        stockCount: stockCount,
        lowStock: stockCount <= 5 // Low stock threshold
    };
}

function updateInventory(productId, quantityChange) {
    // Mock inventory update - in real app, this would call API
    const product = getProductById(productId);
    if (product) {
        const currentStock = product.stock || product.stockCount || 0;
        const newStock = Math.max(0, currentStock + quantityChange);
        product.stock = newStock;
        product.stockCount = newStock; // Keep both for compatibility
        product.inStock = newStock > 0;
        // In real app, this would persist to database
    }
}

function getLowStockProducts() {
    // Mock low stock check - in real app, this would call API
    return getAllProducts().filter(product => {
        const stockCount = product.stock || product.stockCount || 0;
        return stockCount <= 5 && stockCount > 0;
    });
}

// Shipping Calculator
const shippingZones = {
    'accra': { name: 'Accra Metropolitan', baseCost: 50, multiplier: 1.0 },
    'greater-accra': { name: 'Greater Accra', baseCost: 75, multiplier: 1.2 },
    'eastern': { name: 'Eastern Region', baseCost: 100, multiplier: 1.5 },
    'central': { name: 'Central Region', baseCost: 120, multiplier: 1.7 },
    'western': { name: 'Western Region', baseCost: 150, multiplier: 2.0 },
    'volta': { name: 'Volta Region', baseCost: 180, multiplier: 2.2 },
    'northern': { name: 'Northern Region', baseCost: 250, multiplier: 2.8 },
    'upper-east': { name: 'Upper East Region', baseCost: 300, multiplier: 3.2 },
    'upper-west': { name: 'Upper West Region', baseCost: 320, multiplier: 3.4 },
    'international': { name: 'International', baseCost: 500, multiplier: 5.0 }
};

const shippingMethods = {
    standard: {
        name: 'Standard Delivery',
        baseDays: 3,
        costMultiplier: 1.0,
        description: '3-5 business days'
    },
    express: {
        name: 'Express Delivery',
        baseDays: 1,
        costMultiplier: 2.5,
        description: '1-2 business days'
    },
    overnight: {
        name: 'Overnight Delivery',
        baseDays: 1,
        costMultiplier: 4.0,
        description: 'Next business day'
    }
};

function calculateShipping(cartItems, destination, method = 'standard') {
    // Mock shipping calculation - in real app, this would call API
    if (!cartItems || cartItems.length === 0) return 0;

    const zone = shippingZones[destination] || shippingZones['international'];
    const shippingMethod = shippingMethods[method] || shippingMethods['standard'];

    // Calculate base cost
    let totalCost = zone.baseCost * zone.multiplier * shippingMethod.costMultiplier;

    // Weight-based calculation (mock)
    const totalWeight = cartItems.reduce((weight, item) => {
        // Mock weight calculation - in real app, products would have weight property
        return weight + (item.quantity * 0.5); // Assume 0.5kg per item
    }, 0);

    if (totalWeight > 5) {
        totalCost += (totalWeight - 5) * 20; // Extra charge for heavy items
    }

    // Free shipping threshold
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (subtotal >= 500 && method === 'standard') {
        totalCost = 0; // Free shipping on orders over ₵500
    }

    return Math.round(totalCost);
}

function getShippingOptions(destination) {
    // Mock shipping options - in real app, this would call API
    const zone = shippingZones[destination] || shippingZones['accra'];

    return Object.keys(shippingMethods).map(methodKey => {
        const method = shippingMethods[methodKey];
        const cost = zone.baseCost * zone.multiplier * method.costMultiplier;

        // Calculate estimated delivery date
        const today = new Date();
        const deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() + method.baseDays + (zone.multiplier > 2 ? 2 : 0));

        return {
            method: methodKey,
            name: method.name,
            cost: Math.round(cost),
            description: method.description,
            estimatedDelivery: deliveryDate.toLocaleDateString(),
            available: true
        };
    });
}

function getShippingZones() {
    // Mock shipping zones - in real app, this would call API
    return Object.keys(shippingZones).map(key => ({
        id: key,
        name: shippingZones[key].name,
        baseCost: shippingZones[key].baseCost
    }));
}

// Order Processing
async function processOrder(orderData) {
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const order = await response.json();

            // Update inventory locally
            orderData.items.forEach(item => {
                updateInventory(item.id, -item.quantity);
            });

            // Add to user's order history if logged in
            if (typeof addOrder === 'function') {
                addOrder(order);
            }

            return order;
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to process order');
        }
    } catch (error) {
        console.error('Order processing error:', error);
        // Fallback to local processing if API fails
        const order = {
            id: 'order_' + Date.now(),
            ...orderData,
            status: 'processing',
            createdAt: new Date().toISOString(),
            trackingNumber: 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };

        // Update inventory
        orderData.items.forEach(item => {
            updateInventory(item.id, -item.quantity);
        });

        // Add to user's order history if logged in
        if (typeof addOrder === 'function') {
            addOrder(order);
        }

        return order;
    }
}

function getOrderStatus(orderId) {
    // Mock order status - in real app, this would call API
    const statuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
        id: orderId,
        status: randomStatus,
        trackingNumber: 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        updates: [
            {
                status: 'processing',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                message: 'Order received and being processed'
            },
            {
                status: 'shipped',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                message: 'Order shipped from warehouse'
            }
        ]
    };
}

// Export for browser use
window.addProductReview = addProductReview;
window.getProductReviews = getProductReviews;
window.getProductRating = getProductRating;
window.getProductReviewCount = getProductReviewCount;
window.updateProductRating = updateProductRating;
window.checkInventory = checkInventory;
window.updateInventory = updateInventory;
window.getLowStockProducts = getLowStockProducts;
window.calculateShipping = calculateShipping;
window.getShippingOptions = getShippingOptions;
window.getShippingZones = getShippingZones;
window.processOrder = processOrder;
window.getOrderStatus = getOrderStatus;