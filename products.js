// Product data for Netyark Mall E-commerce Website
// All prices in Ghana Cedis (₵)

// API Base URL - configure for your admin system domain
// For local development: http://localhost:5000/api
// For Railway deployment: https://your-railway-project.up.railway.app/api
// For production: https://netyarkmall-production.up.railway.app/api
const API_BASE = 'https://netyarkmall-production.up.railway.app/api';

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
    const response = await fetch(`${API_BASE}/products`);
    console.log('API response status:', response.status);
    if (response.ok) {
      const apiProducts = await response.json();
      console.log('Fetched API products:', apiProducts.length, 'items');
      console.log('Sample API product:', apiProducts[0] ? JSON.stringify(apiProducts[0], null, 2) : 'No products');

      productCache = apiProducts;
      console.log('API products:', productCache.length, 'items');
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

  // Return empty array if API fails - no fallback to legacy products
  console.log('API failed, returning empty array');
  return [];
}

// Fetch wholesale products from API
async function fetchWholesaleProducts() {
  console.log('Fetching wholesale products from API...');
  try {
    const response = await fetch(`${API_BASE}/products/wholesale`);
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
  console.log('API failed, returning empty array for wholesale products');
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

    // Wholesale Products - removed hardcoded products
    wholesale: []
};

// Get all products as a flat array
async function getAllProducts() {
    const products = await fetchProducts();
    return products;
}

// Get products by category
async function getProductsByCategory(category) {
    console.log('Getting products for category:', category);
    const products = await fetchProducts();
    console.log('Total products available:', products.length);
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
    console.log('Mapped category:', category, '->', apiCategory);
    const filteredProducts = products.filter(product => product.category === apiCategory || product.category === category);
    console.log('Filtered products for category:', filteredProducts.length);
    console.log('Sample filtered products:', filteredProducts.slice(0, 2).map(p => ({ name: p.name, category: p.category })));
    return filteredProducts;
}

// Get new arrivals (products marked as new)
async function getNewArrivals() {
    console.log('Fetching new arrivals from API...');
    try {
        const response = await fetch(`${API_BASE}/products/new-arrivals`);
        console.log('New arrivals API response status:', response.status);
        if (response.ok) {
            const newArrivals = await response.json();
            console.log('Fetched new arrivals:', newArrivals.length, 'products');
            console.log('New arrivals sample:', newArrivals.slice(0, 2).map(p => ({ name: p.name, isNewArrival: p.isNewArrival })));
            return newArrivals;
        } else {
            console.error('New arrivals API response not ok:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('New arrivals API error:', errorText);
        }
    } catch (error) {
        console.error('Error fetching new arrivals:', error);
    }

    // Fallback to filtering all products
    console.log('Falling back to filtering all products for new arrivals');
    const products = await getAllProducts();
    console.log('All products for filtering:', products.length);
    const newArrivals = products.filter(product => product.isNew || product.isNewArrival);
    console.log('New arrivals found:', newArrivals.length, 'products');
    console.log('New arrivals details:', newArrivals.map(p => ({ name: p.name, isNew: p.isNew, isNewArrival: p.isNewArrival })));
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
    return filteredWholesale;
}

// Get in-stock products
async function getInStockProducts() {
    console.log('Fetching in-stock products from API...');
    try {
        const response = await fetch(`${API_BASE}/products/in-stock`);
        console.log('In-stock API response status:', response.status);
        if (response.ok) {
            const inStockProducts = await response.json();
            console.log('Fetched in-stock products:', inStockProducts.length, 'products');
            return inStockProducts;
        } else {
            console.error('In-stock API response not ok:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('In-stock API error:', errorText);
        }
    } catch (error) {
        console.error('Error fetching in-stock products:', error);
    }

    // Fallback to filtering all products
    console.log('Falling back to filtering all products for in-stock items');
    const products = await getAllProducts();
    console.log('All products for in-stock filtering:', products.length);
    const inStockProducts = products.filter(product => {
        // Handle backend API format (stockStatus: 'in-stock'/'out-of-stock')
        if (product.stockStatus) {
            return product.stockStatus === 'in-stock' && (product.stock > 0);
        }
        // Handle legacy format (inStock: boolean)
        return product.inStock !== undefined ? product.inStock : (product.stock && product.stock > 0);
    });
    console.log('In-stock products found:', inStockProducts.length, 'products');
    return inStockProducts;
}

// Get out-of-stock products
async function getOutOfStockProducts() {
    console.log('Fetching out-of-stock products from API...');
    try {
        const response = await fetch(`${API_BASE}/products/out-of-stock`);
        console.log('Out-of-stock API response status:', response.status);
        if (response.ok) {
            const outOfStockProducts = await response.json();
            console.log('Fetched out-of-stock products:', outOfStockProducts.length, 'products');
            return outOfStockProducts;
        } else {
            console.error('Out-of-stock API response not ok:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Out-of-stock API error:', errorText);
        }
    } catch (error) {
        console.error('Error fetching out-of-stock products:', error);
    }

    // Fallback to filtering all products
    console.log('Falling back to filtering all products for out-of-stock items');
    const products = await getAllProducts();
    console.log('All products for out-of-stock filtering:', products.length);
    const outOfStockProducts = products.filter(product => {
        // Handle backend API format (stockStatus: 'in-stock'/'out-of-stock')
        if (product.stockStatus) {
            return product.stockStatus === 'out-of-stock' || (product.stock <= 0);
        }
        // Handle legacy format (inStock: boolean)
        return product.inStock !== undefined ? !product.inStock : (product.stock !== undefined && product.stock <= 0);
    });
    console.log('Out-of-stock products found:', outOfStockProducts.length, 'products');
    return outOfStockProducts;
}

// Get fast-selling items (products with high review count and good ratings)
async function getFastSellingItems() {
    console.log('Fetching fast-selling items from API...');
    try {
        const response = await fetch(`${API_BASE}/products/fast-selling`);
        console.log('Fast-selling API response status:', response.status);
        if (response.ok) {
            const fastSelling = await response.json();
            console.log('Fetched fast-selling items:', fastSelling.length, 'products');
            console.log('Fast-selling sample:', fastSelling.slice(0, 2).map(p => ({ name: p.name, isFastSelling: p.isFastSelling })));
            return fastSelling;
        } else {
            console.error('Fast-selling API response not ok:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Fast-selling API error:', errorText);
        }
    } catch (error) {
        console.error('Error fetching fast-selling items:', error);
    }

    // Fallback to filtering all products
    console.log('Falling back to filtering all products for fast-selling items');
    const products = await getAllProducts();
    console.log('All products for fast-selling filtering:', products.length);
    const fastSelling = products
        .filter(product => product.isFastSelling || (product.reviews > 50 && product.rating >= 4.0))
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 8);
    console.log('Fast-selling items found:', fastSelling.length, 'products');
    console.log('Fast-selling details:', fastSelling.map(p => ({ name: p.name, isFastSelling: p.isFastSelling, reviews: p.reviews, rating: p.rating })));
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

    // Debug: log all product IDs to see what we're working with
    console.log('getProductById: Available product IDs:', products.map(p => p.id || p._id));

    // Enhanced product finding with better matching
    const product = products.find(product => {
        const productId = product.id || product._id;
        return productId && productId.toString() === id.toString();
    });

    // Debug logging
    if (product) {
        console.log('getProductById Debug:', {
            productId: id,
            productName: product.name,
            stockStatus: product.stockStatus,
            stock: product.stock,
            stockCount: product.stockCount,
            inStock: product.inStock
        });
    } else {
        console.log('getProductById Debug: Product not found for ID:', id);
        console.log('Available products:', products.map(p => ({
            id: p.id || p._id,
            name: p.name,
            stockStatus: p.stockStatus,
            stock: p.stock
        })));
    }

    return product;
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
    if (!imagePath || imagePath === 'undefined' || imagePath === '') {
        console.log('Using default placeholder image for invalid path:', imagePath);
        return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'; // Default placeholder image
    }

    if (imagePath.startsWith('/uploads/')) {
        // Handle uploads path - try multiple base URLs to handle different deployment scenarios
        const baseUrls = [
            'https://netyarkmall-production.up.railway.app', // Production
            'https://dromorongit.github.io', // GitHub Pages (from error)
            API_BASE.replace('/api', '') // API base without /api
        ];

        // Try each base URL until we find one that works
        for (const baseUrl of baseUrls) {
            const fullUrl = `${baseUrl}${imagePath}`;
            console.log('Trying image URL:', fullUrl);

            // Simple check to see if URL looks valid
            if (baseUrl && !baseUrl.endsWith('/')) {
                return fullUrl;
            }
        }

        // Fallback to first base URL
        return `${baseUrls[0]}${imagePath}`;
    }

    // Handle relative paths
    if (imagePath.startsWith('./') || imagePath.startsWith('../')) {
        // For relative paths, return as-is since they should work in the current context
        return imagePath;
    }

    // Handle full URLs (http/https)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    console.log('Returning image path as-is:', imagePath);
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
window.getInStockProducts = getInStockProducts;
window.getOutOfStockProducts = getOutOfStockProducts;
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
        getInStockProducts,
        getOutOfStockProducts,
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
async function checkInventory(productId, requestedQuantity = 1) {
    // Mock inventory check - in real app, this would call API
    const product = await getProductById(productId);
    if (!product) {
        console.error('checkInventory: Product not found for ID:', productId);
        return { available: false, reason: 'Product not found' };
    }

    // Handle both 'stock' and 'stockCount' fields from API
    const stockCount = product.stock !== undefined ? product.stock : (product.stockCount !== undefined ? product.stockCount : 0);

    // Debug logging for stock information
    console.log('checkInventory - Raw product data:', {
        _id: product._id,
        id: product.id,
        name: product.name,
        stockStatus: product.stockStatus,
        stock: product.stock,
        stockCount: product.stockCount,
        inStock: product.inStock
    });

    // Handle backend API format (stockStatus: 'in-stock'/'out-of-stock')
    let inStock;
    if (product.stockStatus) {
        // Primary logic: if stockStatus is 'in-stock', it's available
        // Only consider out of stock if explicitly marked as 'out-of-stock'
        inStock = product.stockStatus === 'in-stock';
    } else if (product.inStock !== undefined) {
        // Handle legacy format (inStock: boolean)
        inStock = product.inStock;
    } else {
        // Fallback to stock count if no other indicators
        inStock = stockCount > 0;
    }

    // Debug logging
    console.log('checkInventory Decision:', {
        productId: productId,
        productName: product.name,
        stockStatus: product.stockStatus,
        stockCount: stockCount,
        inStock: inStock,
        requestedQuantity: requestedQuantity,
        finalDecision: inStock ? 'AVAILABLE' : 'NOT AVAILABLE'
    });

    if (!inStock) {
        console.warn(`Product ${product.name} (${productId}) is not in stock. Status: ${product.stockStatus}, Count: ${stockCount}`);
        return { available: false, reason: 'Out of stock' };
    }

    if (stockCount < requestedQuantity) {
        console.warn(`Product ${product.name} (${productId}) has insufficient stock. Available: ${stockCount}, Requested: ${requestedQuantity}`);
        return { available: false, reason: 'Insufficient stock' };
    }

    console.log(`Product ${product.name} (${productId}) is available with ${stockCount} items in stock`);
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