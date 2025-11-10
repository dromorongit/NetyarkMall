// Product data for Netyark Mall E-commerce Website
// All prices in Ghana Cedis (₵)

// Sample product database
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
            stockCount: 25
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
    ]
};

// Get all products as a flat array
function getAllProducts() {
    return Object.values(productDatabase).flat();
}

// Get products by category
function getProductsByCategory(category) {
    return Object.values(productDatabase)
        .flat()
        .filter(product => product.category === category);
}

// Get new arrivals (products marked as new)
function getNewArrivals() {
    return getAllProducts().filter(product => product.isNew);
}

// Get fast-selling items (products with high review count and good ratings)
function getFastSellingItems() {
    return getAllProducts()
        .filter(product => product.reviews > 50 && product.rating >= 4.0)
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 8);
}

// Get products by ID
function getProductById(id) {
    return getAllProducts().find(product => product.id === id);
}

// Get category data for the homepage category grid
function getCategoryData() {
    return [
        {
            name: 'Consumer Electrics',
            id: 'electronics',
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: getProductsByCategory('electronics').length,
            color: '#008000'
        },
        {
            name: 'Clothing & Apparel',
            id: 'fashion',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: getProductsByCategory('fashion').length,
            color: '#FFA500'
        },
        {
            name: 'Home & Kitchen',
            id: 'home',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: getProductsByCategory('home').length,
            color: '#008000'
        },
        {
            name: 'Health & Beauty',
            id: 'beauty',
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: getProductsByCategory('beauty').length,
            color: '#FFA500'
        },
        {
            name: 'Jewelry & Accessories',
            id: 'jewelry',
            image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: 0, // Combined with fashion
            color: '#008000'
        },
        {
            name: 'Sports & Outdoor',
            id: 'sports',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            productCount: 0,
            color: '#FFA500'
        }
    ];
}

// Search products
function searchProducts(query) {
    const lowercaseQuery = query.toLowerCase();
    return getAllProducts().filter(product => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
}

// Get suggested products for cart page
function getSuggestedProducts(currentProductIds = []) {
    const allProducts = getAllProducts();
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
// Export for use in browser
window.productDatabase = productDatabase;
window.getAllProducts = getAllProducts;
window.getProductsByCategory = getProductsByCategory;
window.getNewArrivals = getNewArrivals;
window.getFastSellingItems = getFastSellingItems;
window.getProductById = getProductById;
window.getCategoryData = getCategoryData;
window.searchProducts = searchProducts;
window.getSuggestedProducts = getSuggestedProducts;
window.formatPrice = formatPrice;
window.calculateDiscount = calculateDiscount;


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
        searchProducts,
        getSuggestedProducts,
        formatPrice,
        calculateDiscount
    };
}