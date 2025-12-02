// Category Pages JavaScript
// Handles filtering and product display for individual category pages

// Initialize category page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Check if we're on a category page
    if (currentPage.includes('-') && currentPage !== 'index.html') {
        initializeCategoryPage();
    }
});

function initializeCategoryPage() {
    // Detect category from filename
    const pageName = window.location.pathname.split('/').pop();
    let category = '';
    let containerId = '';

    if (pageName.includes('kitchen-appliances')) {
        category = 'kitchen-appliances';
        containerId = 'homeProducts';
    } else if (pageName.includes('beauty-personal-care')) {
        category = 'beauty-personal-care';
        containerId = 'beautyProducts';
    } else if (pageName.includes('photography-content-creation-tools')) {
        category = 'photography-content-creation-tools';
        containerId = 'photographyProducts';
    } else if (pageName.includes('nail-supplies')) {
        category = 'nail-supplies';
        containerId = 'nailProducts';
    } else if (pageName.includes('kids-babies')) {
        category = 'kids-babies';
        containerId = 'kidsProducts';
    } else if (pageName.includes('home-essentials')) {
        category = 'home-essentials';
        containerId = 'homeProducts';
    } else if (pageName.includes('lighting-home-decor')) {
        category = 'lighting-home-decor';
        containerId = 'decorProducts';
    }

    if (category && containerId) {
        loadCategoryProducts(category, containerId);
    }

    // Initialize filters
    initializeFilters();
    updateProductCount();
}

async function loadCategoryProducts(category, containerId) {
    console.log('Loading category products for:', category, 'container:', containerId);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    let products = await getProductsByCategory(category);
    console.log('Products fetched for category:', products.length);

    // Sort products by default (newest first)
    products = sortProducts(products, 'newest');
    console.log('Products after sorting:', products.length);

    // Display products
    displayProducts(products, container);
    console.log('Products displayed in container');
}

function initializeFilters() {
    // Price range filter
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.addEventListener('change', applyFilters);
    }
    
    // Sort filter
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', applyFilters);
    }
    
    // Additional filters
    const sizeFilter = document.getElementById('sizeFilter');
    if (sizeFilter) {
        sizeFilter.addEventListener('change', applyFilters);
    }
    
    const productType = document.getElementById('productType');
    if (productType) {
        productType.addEventListener('change', applyFilters);
    }
}

async function applyFilters() {
    const currentPage = window.location.pathname.split('/').pop();
    let category = '';
    let containerId = '';

    // Determine category and container ID
    if (currentPage.includes('kitchen-appliances')) {
        category = 'kitchen-appliances';
        containerId = 'homeProducts';
    } else if (currentPage.includes('beauty-personal-care')) {
        category = 'beauty-personal-care';
        containerId = 'beautyProducts';
    } else if (currentPage.includes('photography-content-creation-tools')) {
        category = 'photography-content-creation-tools';
        containerId = 'photographyProducts';
    } else if (currentPage.includes('nail-supplies')) {
        category = 'nail-supplies';
        containerId = 'nailProducts';
    } else if (currentPage.includes('kids-babies')) {
        category = 'kids-babies';
        containerId = 'kidsProducts';
    } else if (currentPage.includes('home-essentials')) {
        category = 'home-essentials';
        containerId = 'homeProducts';
    } else if (currentPage.includes('lighting-home-decor')) {
        category = 'lighting-home-decor';
        containerId = 'decorProducts';
    }

    let products = await getProductsByCategory(category);

    // Apply price filter
    const priceRange = document.getElementById('priceRange')?.value;
    if (priceRange && priceRange !== 'all') {
        products = filterByPrice(products, priceRange);
    }

    // Apply sorting
    const sortBy = document.getElementById('sortBy')?.value;
    if (sortBy) {
        products = sortProducts(products, sortBy);
    }

    // Apply additional filters
    const sizeFilter = document.getElementById('sizeFilter')?.value;
    if (sizeFilter && sizeFilter !== 'all') {
        // For fashion items, we could filter by size if the data included it
        // This is a placeholder for future implementation
    }

    const productType = document.getElementById('productType')?.value;
    if (productType && productType !== 'all') {
        products = filterByType(products, productType);
    }

    // Display filtered products
    const container = document.getElementById(containerId);
    if (container) {
        displayProducts(products, container);
        updateProductCount(products.length);
    }
}

function filterByPrice(products, priceRange) {
    const ranges = {
        '0-500': { min: 0, max: 500 },
        '500-1000': { min: 500, max: 1000 },
        '1000-5000': { min: 1000, max: 5000 },
        '5000+': { min: 5000, max: Infinity },
        '0-200': { min: 0, max: 200 },
        '200-500': { min: 200, max: 500 },
        '500-1000': { min: 500, max: 1000 },
        '1000+': { min: 1000, max: Infinity },
        '0-300': { min: 0, max: 300 },
        '300-600': { min: 300, max: 600 },
        '600-1500': { min: 600, max: 1500 },
        '1500+': { min: 1500, max: Infinity },
        '0-200': { min: 0, max: 200 },
        '200-400': { min: 200, max: 400 },
        '400-800': { min: 400, max: 800 },
        '800+': { min: 800, max: Infinity }
    };
    
    const range = ranges[priceRange];
    if (!range) return products;
    
    return products.filter(product => 
        product.price >= range.min && product.price <= range.max
    );
}

function sortProducts(products, sortType) {
    const sortedProducts = [...products];
    
    switch (sortType) {
        case 'price-low':
            return sortedProducts.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sortedProducts.sort((a, b) => b.price - a.price);
        case 'rating':
            return sortedProducts.sort((a, b) => b.rating - a.rating);
        case 'newest':
            return sortedProducts.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        default:
            return sortedProducts;
    }
}

function filterByType(products, productType) {
    // This is a placeholder for more specific type filtering
    // In a real implementation, products would have more detailed type information
    return products;
}

function displayProducts(products, container) {
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <p>No products found matching your criteria.</p>
                <button class="btn btn-outline" onclick="clearFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => createProductCard(product)).join('');
}

function updateProductCount(count = null) {
    const countElement = document.getElementById('productCount');
    if (countElement) {
        if (count !== null) {
            countElement.textContent = count;
        } else {
            // Calculate current count based on visible products
            const visibleProducts = document.querySelectorAll('.product-card:visible').length;
            countElement.textContent = visibleProducts;
        }
    }
}

function clearFilters() {
    // Reset all filter selects
    const selects = document.querySelectorAll('.filter-select');
    selects.forEach(select => {
        select.value = 'all';
    });
    
    // Re-apply filters to show all products
    applyFilters();
    
    // Show notification
    if (typeof showNotification !== 'undefined') {
        showNotification('Filters cleared', 'info');
    }
}

// Search functionality for category pages
function initializeCategorySearch() {
    const searchInput = document.getElementById('categorySearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            searchInCategory(query);
        });
    }
}

async function searchInCategory(query) {
    const currentPage = window.location.pathname.split('/').pop();
    let category = '';
    let containerId = '';

    if (currentPage.includes('kitchen-appliances')) {
        category = 'kitchen-appliances';
        containerId = 'homeProducts';
    } else if (currentPage.includes('beauty-personal-care')) {
        category = 'beauty-personal-care';
        containerId = 'beautyProducts';
    } else if (currentPage.includes('photography-content-creation-tools')) {
        category = 'photography-content-creation-tools';
        containerId = 'photographyProducts';
    } else if (currentPage.includes('nail-supplies')) {
        category = 'nail-supplies';
        containerId = 'nailProducts';
    } else if (currentPage.includes('kids-babies')) {
        category = 'kids-babies';
        containerId = 'kidsProducts';
    } else if (currentPage.includes('home-essentials')) {
        category = 'home-essentials';
        containerId = 'homeProducts';
    } else if (currentPage.includes('lighting-home-decor')) {
        category = 'lighting-home-decor';
        containerId = 'decorProducts';
    }

    let products = await getProductsByCategory(category);

    if (query) {
        products = products.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query)
        );
    }

    const container = document.getElementById(containerId);
    if (container) {
        displayProducts(products, container);
        updateProductCount(products.length);
    }
}

function getContainerIdByPage(pageName) {
    if (pageName.includes('consumer-electrics')) return 'electronicsProducts';
    if (pageName.includes('clothing-apparel')) return 'fashionProducts';
    if (pageName.includes('health-beauty')) return 'beautyProducts';
    if (pageName.includes('home-kitchen')) return 'homeProducts';
    if (pageName.includes('jewelry-accessories')) return 'jewelryProducts';
    if (pageName.includes('for-men')) return 'mensProducts';
    if (pageName.includes('for-women')) return 'womensProducts';
    if (pageName.includes('for-kids')) return 'kidsProducts';
    return 'productGrid';
}

// Load more products functionality
function initializeLoadMore() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProducts);
    }
}

function loadMoreProducts() {
    // This would typically load more products from a server
    // For now, we'll just show a message
    if (typeof showNotification !== 'undefined') {
        showNotification('All products loaded', 'info');
    }
}

// Wishlist functionality for category pages
function toggleWishlist(productId) {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const index = wishlist.indexOf(productId);
    
    if (index > -1) {
        wishlist.splice(index, 1);
        showNotification('Removed from wishlist', 'info');
    } else {
        wishlist.push(productId);
        showNotification('Added to wishlist', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistButton(productId);
}

function updateWishlistButton(productId) {
    const button = document.querySelector(`[data-product-id="${productId}"].wishlist-btn`);
    if (button) {
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const isInWishlist = wishlist.includes(productId);
        
        button.classList.toggle('in-wishlist', isInWishlist);
        button.innerHTML = isInWishlist ? 
            '<i class="fas fa-heart"></i>' : 
            '<i class="far fa-heart"></i>';
    }
}

// Comparison functionality
function addToCompare(productId) {
    const compare = JSON.parse(localStorage.getItem('compare')) || [];
    
    if (compare.length >= 3) {
        showNotification('You can only compare up to 3 products', 'error');
        return;
    }
    
    if (compare.includes(productId)) {
        showNotification('Product already in comparison', 'info');
        return;
    }
    
    compare.push(productId);
    localStorage.setItem('compare', JSON.stringify(compare));
    showNotification('Added to comparison', 'success');
    updateCompareCount();
}

function updateCompareCount() {
    const compare = JSON.parse(localStorage.getItem('compare')) || [];
    const countElement = document.getElementById('compareCount');
    if (countElement) {
        countElement.textContent = compare.length;
    }
}

// Export functions for use in HTML
window.toggleWishlist = toggleWishlist;
window.addToCompare = addToCompare;
window.clearFilters = clearFilters;