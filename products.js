// Product data for Netyark Mall E-commerce Website
// All prices in Ghana Cedis (₵)
// NO FALLBACK - Products must come from the admin/inventory system API

// API Base URL - configure for your admin system domain
// For local development: http://localhost:5000/api
// For Railway deployment: https://your-railway-project.up.railway.app/api
// For production: https://netyarkmall-production.up.railway.app/api
const API_BASE = 'https://netyarkmall-production.up.railway.app/api';

// Fetch products from API (no caching - always fresh)
// NO FALLBACK - returns empty array if API fails
async function fetchProducts(forceRefresh = false) {
  console.log('Fetching products from API... (no fallback to legacy data)');

  // Try multiple API endpoints
  const apiUrls = [
    'https://netyarkmall-production.up.railway.app/api',
    'http://localhost:5000/api'
  ];

  // Add cache-busting parameter if force refresh is requested
  const cacheBust = forceRefresh ? `?timestamp=${Date.now()}` : '';

  for (const baseUrl of apiUrls) {
    try {
      console.log('Trying API endpoint:', baseUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}/products${cacheBust}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      console.log('API response status:', response.status);

      if (response.ok) {
        const apiProducts = await response.json();
        console.log('Fetched API products from', baseUrl, ':', apiProducts.length, 'items');
        return apiProducts;
      } else {
        console.warn('Failed to fetch from', baseUrl, ':', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Error fetching from', baseUrl, ':', error.message);
    }
  }

  // NO FALLBACK - return empty array if all APIs fail
  console.warn('All API endpoints failed - returning empty array. No legacy fallback.');
  return [];
}

// Fetch wholesale products from API
// NO FALLBACK - returns empty array if API fails
async function fetchWholesaleProducts(cacheBust = '') {
  console.log('Fetching wholesale products from API... (no fallback)');
  try {
    const response = await fetch(`${API_BASE}/products/wholesale${cacheBust}`);
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
  // NO FALLBACK
  console.warn('Wholesale API failed - returning empty array');
  return [];
}

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
    'lighting-home-decor': 'Lighting & Home Decor',
    'travel-essentials': 'Travel Essentials',
    'gym-wellness': 'Gym & Wellness'
  };

  const apiCategory = categoryMap[category] || category;
  console.log('Mapped category:', category, '->', apiCategory);
  const filteredProducts = products.filter(product => product.category === apiCategory || product.category === category);
  console.log('Filtered products for category:', filteredProducts.length);
  return filteredProducts;
}

// Get new arrivals (products marked as new)
// NO FALLBACK - returns empty array if API fails
async function getNewArrivals(cacheBust = '') {
  console.log('Fetching new arrivals from API... (no fallback)');
  try {
    const response = await fetch(`${API_BASE}/products/new-arrivals${cacheBust}`);
    console.log('New arrivals API response status:', response.status);
    if (response.ok) {
      const newArrivals = await response.json();
      console.log('Fetched new arrivals:', newArrivals.length, 'products');
      return newArrivals;
    } else {
      console.error('New arrivals API response not ok:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
  }
  // NO FALLBACK
  console.warn('New arrivals API failed - returning empty array');
  return [];
}

// Get wholesale products
// NO FALLBACK - returns empty array if API fails
async function getWholesaleProducts(cacheBust = '') {
  const wholesaleProducts = await fetchWholesaleProducts(cacheBust);
  if (wholesaleProducts.length > 0) {
    return wholesaleProducts;
  }
  // NO FALLBACK - don't filter all products
  console.warn('Wholesale products unavailable - returning empty array');
  return [];
}

// Get in-stock products
// NO FALLBACK - returns empty array if API fails
async function getInStockProducts() {
  console.log('Fetching in-stock products from API... (no fallback)');
  try {
    const response = await fetch(`${API_BASE}/products/in-stock`);
    console.log('In-stock API response status:', response.status);
    if (response.ok) {
      const inStockProducts = await response.json();
      console.log('Fetched in-stock products:', inStockProducts.length, 'products');
      return inStockProducts;
    } else {
      console.error('In-stock API response not ok:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching in-stock products:', error);
  }
  // NO FALLBACK
  console.warn('In-stock API failed - returning empty array');
  return [];
}

// Get out-of-stock products
// NO FALLBACK - returns empty array if API fails
async function getOutOfStockProducts() {
  console.log('Fetching out-of-stock products from API... (no fallback)');
  try {
    const response = await fetch(`${API_BASE}/products/out-of-stock`);
    console.log('Out-of-stock API response status:', response.status);
    if (response.ok) {
      const outOfStockProducts = await response.json();
      console.log('Fetched out-of-stock products:', outOfStockProducts.length, 'products');
      return outOfStockProducts;
    } else {
      console.error('Out-of-stock API response not ok:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching out-of-stock products:', error);
  }
  // NO FALLBACK
  console.warn('Out-of-stock API failed - returning empty array');
  return [];
}

// Get fast-selling items
// NO FALLBACK - returns empty array if API fails
async function getFastSellingItems(cacheBust = '') {
  console.log('Fetching fast-selling items from API... (no fallback)');
  try {
    const response = await fetch(`${API_BASE}/products/fast-selling${cacheBust}`);
    console.log('Fast-selling API response status:', response.status);
    if (response.ok) {
      const fastSelling = await response.json();
      console.log('Fetched fast-selling items:', fastSelling.length, 'products');
      return fastSelling;
    } else {
      console.error('Fast-selling API response not ok:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error fetching fast-selling items:', error);
  }
  // NO FALLBACK
  console.warn('Fast-selling API failed - returning empty array');
  return [];
}

// Get products by ID
// NO FALLBACK - returns null if API fails
async function getProductById(id) {
  console.log('Fetching product by ID:', id, '(no fallback)');

  // Try multiple API endpoints in case one fails
  const apiUrls = [
    'https://netyarkmall-production.up.railway.app/api',
    'http://localhost:5000/api'
  ];

  for (const baseUrl of apiUrls) {
    try {
      console.log('Trying API endpoint:', baseUrl);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}/products/${id}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      console.log('Product API response status:', response.status);

      if (response.ok) {
        const product = await response.json();
        console.log('Fetched product from', baseUrl, ':', product);
        return product;
      } else {
        console.warn('Failed to fetch from', baseUrl, ':', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Error fetching from', baseUrl, ':', error.message);
      if (error.name === 'AbortError') {
        console.warn('Request to', baseUrl, 'timed out');
      }
    }
  }

  // NO FALLBACK
  console.error('All API endpoints failed for product ID:', id, '- returning null');
  return null;
}

// Get category data for the homepage category grid
// NO FALLBACK - returns empty categories if API fails
async function getCategoryData() {
  const products = await fetchProducts();
  if (products.length === 0) {
    console.warn('No products available - returning empty categories');
    return [];
  }
  
  return [
    {
      name: 'Kitchen Appliances',
      id: 'kitchen-appliances',
      image: 'kitchen.jpeg',
      productCount: products.filter(p => p.category === 'Kitchen Appliances' || p.category === 'kitchen-appliances' || p.category === 'home').length,
      color: '#008000'
    },
    {
      name: 'Beauty & Personal Care',
      id: 'beauty-personal-care',
      image: 'beauty.jpeg',
      productCount: products.filter(p => p.category === 'Beauty & Personal Care' || p.category === 'beauty-personal-care' || p.category === 'beauty').length,
      color: '#FFA500'
    },
    {
      name: 'Photography & Content Creation Tools',
      id: 'photography-content-creation-tools',
      image: 'photography.jpeg',
      productCount: products.filter(p => p.category === 'Photography & Content Creation Tools' || p.category === 'photography-content-creation-tools' || p.category === 'electronics').length,
      color: '#008000'
    },
    {
      name: 'Nail Supplies',
      id: 'nail-supplies',
      image: 'nails.jpeg',
      productCount: products.filter(p => p.category === 'Nail Supplies' || p.category === 'nail-supplies').length,
      color: '#FFA500'
    },
    {
      name: 'Kids & Babies',
      id: 'kids-babies',
      image: 'kids.jpeg',
      productCount: products.filter(p => p.category === 'Kids & Babies' || p.category === 'kids-babies').length,
      color: '#008000'
    },
    {
      name: 'Home Essentials',
      id: 'home-essentials',
      image: 'homeessentials.jpeg',
      productCount: products.filter(p => p.category === 'Home Essentials' || p.category === 'home-essentials' || p.category === 'home').length,
      color: '#FFA500'
    },
    {
      name: 'Lighting & Home Decor',
      id: 'lighting-home-decor',
      image: 'lighting.jpeg',
      productCount: products.filter(p => p.category === 'Lighting & Home Decor' || p.category === 'lighting-home-decor').length,
      color: '#008000'
    },
    {
      name: 'Travel Essentials',
      id: 'travel-essentials',
      image: 'travelessentials.jpg',
      productCount: products.filter(p => p.category === 'Travel Essentials' || p.category === 'travel-essentials').length,
      color: '#008000'
    },
    {
      name: 'Gym & Wellness',
      id: 'gym-wellness',
      image: 'gymwellness.jpg',
      productCount: products.filter(p => p.category === 'Gym & Wellness' || p.category === 'gym-wellness').length,
      color: '#FFA500'
    }
  ];
}

// Search products
async function searchProducts(query) {
  const products = await fetchProducts();
  if (products.length === 0) {
    return [];
  }
  const lowercaseQuery = query.toLowerCase();
  return products.filter(product => {
    const description = product.description || product.shortDescription || product.longDescription || '';
    return product.name.toLowerCase().includes(lowercaseQuery) ||
           description.toLowerCase().includes(lowercaseQuery) ||
           product.category.toLowerCase().includes(lowercaseQuery);
  });
}

// Get suggested products for cart page
async function getSuggestedProducts(currentProductIds = []) {
  const allProducts = await fetchProducts();
  if (allProducts.length === 0) {
    return [];
  }
  return allProducts
    .filter(product => !currentProductIds.includes(product.id))
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);
}

// Product formatting functions
function formatPrice(price) {
  return `₵${price.toFixed(2)}`;
}

function calculateDiscount(originalPrice, currentPrice) {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

// Helper function to get full image URL
function getFullImageUrl(imagePath) {
  if (!imagePath || imagePath === 'undefined' || imagePath === '') {
    console.log('Using default placeholder image for invalid path:', imagePath);
    return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80';
  }

  // Handle Cloudinary URLs (these are already complete URLs)
  if (imagePath.includes('cloudinary.com') || imagePath.includes('res.cloudinary.com')) {
    return imagePath;
  }

  // Handle full URLs (http/https)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Handle uploads path - try multiple base URLs
  if (imagePath.startsWith('/uploads/')) {
    const baseUrls = [
      'https://netyarkmall-production.up.railway.app',
      'https://dromorongit.github.io',
      API_BASE.replace('/api', '')
    ];

    for (const baseUrl of baseUrls) {
      const fullUrl = `${baseUrl}${imagePath}`;
      console.log('Trying image URL:', fullUrl);

      if (baseUrl && !baseUrl.endsWith('/')) {
        return fullUrl;
      }
    }

    return `${baseUrls[0]}${imagePath}`;
  }

  // Handle relative paths
  if (imagePath.startsWith('./') || imagePath.startsWith('../')) {
    return imagePath;
  }

  // Check if it's a local file
  const localImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'];
  const isLocalImage = localImageExtensions.some(ext => imagePath.toLowerCase().includes(ext));
  
  if (isLocalImage && !imagePath.startsWith('/') && !imagePath.startsWith('http')) {
    return imagePath;
  }

  return `${API_BASE.replace('/api', '')}/${imagePath}`;
}

// Export for use in browser
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

// Inventory Management
// NO FALLBACK - returns no inventory if API fails
async function checkInventory(productId, requestedQuantity = 1) {
  const product = await getProductById(productId);
  if (!product) {
    console.error('checkInventory: Product not found for ID:', productId);
    return { available: false, reason: 'Product not found - inventory system unavailable' };
  }

  // Handle both 'stock' and 'stockCount' fields from API
  const stockCount = product.stock !== undefined ? product.stock : (product.stockCount !== undefined ? product.stockCount : 0);

  console.log('checkInventory - Product data:', {
    _id: product._id,
    id: product.id,
    name: product.name,
    stockStatus: product.stockStatus,
    stock: product.stock,
    stockCount: product.stockCount
  });

  // Handle backend API format (stockStatus: 'in-stock'/'out-of-stock')
  let inStock;
  if (product.stockStatus) {
    inStock = product.stockStatus === 'in-stock';
  } else if (product.inStock !== undefined) {
    inStock = product.inStock;
  } else {
    inStock = stockCount > 0;
  }

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
    lowStock: stockCount <= 5
  };
}

function updateInventory(productId, quantityChange) {
  // This would call API in real implementation
  console.warn('updateInventory called - API integration required');
}

function getLowStockProducts() {
  // This would call API in real implementation
  console.warn('getLowStockProducts called - API integration required');
  return [];
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
  if (!cartItems || cartItems.length === 0) return 0;

  const zone = shippingZones[destination] || shippingZones['international'];
  const shippingMethod = shippingMethods[method] || shippingMethods['standard'];

  let totalCost = zone.baseCost * zone.multiplier * shippingMethod.costMultiplier;

  const totalWeight = cartItems.reduce((weight, item) => {
    return weight + (item.quantity * 0.5);
  }, 0);

  if (totalWeight > 5) {
    totalCost += (totalWeight - 5) * 20;
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (subtotal >= 500 && method === 'standard') {
    totalCost = 0;
  }

  return Math.round(totalCost);
}

function getShippingOptions(destination) {
  const zone = shippingZones[destination] || shippingZones['accra'];

  return Object.keys(shippingMethods).map(methodKey => {
    const method = shippingMethods[methodKey];
    const cost = zone.baseCost * zone.multiplier * method.costMultiplier;

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
  return Object.keys(shippingZones).map(key => ({
    id: key,
    name: shippingZones[key].name,
    baseCost: shippingZones[key].baseCost
  }));
}

// Order Processing
// NO FALLBACK - order must be processed through API
async function processOrder(orderData) {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const order = await response.json();
      return order;
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to process order');
    }
  } catch (error) {
    console.error('Order processing error:', error);
    throw error; // NO FALLBACK - re-throw error
  }
}

async function getOrderStatus(orderId) {
  // This would call API in real implementation
  console.warn('getOrderStatus called - API integration required');
  return null;
}

// Export for browser use
window.checkInventory = checkInventory;
window.updateInventory = updateInventory;
window.getLowStockProducts = getLowStockProducts;
window.calculateShipping = calculateShipping;
window.getShippingOptions = getShippingOptions;
window.getShippingZones = getShippingZones;
window.processOrder = processOrder;
window.getOrderStatus = getOrderStatus;

// Debug function to check product loading
window.debugProducts = async function() {
  console.log('=== Product Debug Info ===');
  
  try {
    const products = await fetchProducts();
    console.log('Total products loaded:', products.length);
    console.log('Sample products:', products.slice(0, 3).map(p => ({ name: p.name, category: p.category, price: p.price })));
    
    if (products.length === 0) {
      console.log('NO PRODUCTS - Admin/Inventory system may be unavailable');
    }
    
    // Group by category
    const byCategory = products.reduce((acc, p) => {
      const cat = p.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    console.log('Products by category:', byCategory);
    
    return {
      totalProducts: products.length,
      byCategory: byCategory
    };
  } catch (error) {
    console.error('Error loading products:', error);
    return { error: error.message, productsAvailable: false };
  }
};
