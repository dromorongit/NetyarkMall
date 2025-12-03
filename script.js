// Main JavaScript file for Netyark Mall E-commerce Website

// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentSlide = 0;
let slideInterval;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    // Clear product cache to ensure fresh data from API
    if (typeof clearProductCache === 'function') {
        clearProductCache();
        console.log('Product cache cleared');
    }

    // Force refresh products on page load to ensure latest data
    setTimeout(() => {
        if (typeof fetchProducts === 'function') {
            fetchProducts(true).then(() => {
                console.log('Products refreshed from API');
                // Re-initialize homepage if we're on it
                if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                    loadNewArrivals();
                    loadFastSellingItems();
                    loadCategoryHighlights();
                }
            });
        }
    }, 1000);

    // Add periodic refresh for product data (every 5 minutes)
    setInterval(() => {
        if (typeof fetchProducts === 'function') {
            fetchProducts(true).then(() => {
                console.log('Periodic product refresh completed');
                // Refresh the current page content
                const currentPage = window.location.pathname.split('/').pop() || 'index.html';
                if (currentPage === 'index.html' || currentPage === '') {
                    loadNewArrivals();
                    loadFastSellingItems();
                    loadCategoryHighlights();
                } else if (currentPage === 'wholesale.html') {
                    loadWholesaleProducts();
                } else if (currentPage === 'deals.html') {
                    loadFeaturedDeals();
                }
            });
        }
    }, 300000); // 5 minutes

    initializeCart();
    initializeNavigation();
    initializeCarousel();
    initializeSearch();
    initializeComparison();
    updateCartCount();

    // Initialize authentication UI
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }

    // Check which page we're on and initialize accordingly
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);

    switch(currentPage) {
        case 'index.html':
        case '':
            initializeHomePage();
            break;
        case 'categories.html':
            initializeCategoriesPage();
            break;
        case 'wholesale.html':
            initializeWholesalePage();
            break;
        case 'deals.html':
            initializeDealsPage();
            break;
        case 'cart.html':
            initializeCartPage();
            break;
        case 'checkout.html':
            initializeCheckoutPage();
            break;
        case 'contact.html':
            initializeContactPage();
            break;
        default:
            // Check if it's a category page
            if (currentPage.includes('-') && !currentPage.includes('.')) {
                console.log('Detected category page:', currentPage);
                // Category pages are handled by category-pages.js
            }
            break;
    }
});

// Cart Management
function initializeCart() {
    updateCartCount();
}

async function addToCart(productId, quantity = 1) {
    const product = await getProductById(productId);
    if (!product) {
        console.error('Product not found:', productId);
        showNotification('Product not found.', 'error');
        return;
    }

    // Check inventory
    const inventoryCheck = typeof checkInventory === 'function' ?
        await checkInventory(productId, quantity) : { available: product.inStock };

    if (!inventoryCheck.available) {
        showNotification(inventoryCheck.reason || 'Product is out of stock.', 'error');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        // Check if new total exceeds available stock
        const stockCheck = typeof checkInventory === 'function' ?
            await checkInventory(productId, newQuantity) : { available: true };

        if (!stockCheck.available) {
            showNotification('Cannot add more items. Insufficient stock.', 'error');
            return;
        }
        existingItem.quantity = newQuantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            isWholesale: product.isWholesale || false,
            moq: product.moq || product.minOrderQty || 1
        });
    }

    saveCart();
    updateCartCount();
    updateCartDisplay(); // Update cart display to show shipping
    showNotification(`${product.name} added to cart!`, 'success');
}

async function addWholesaleToCart(productId, quantity = null) {
    try {
        console.log('addWholesaleToCart called with:', { productId, quantity });

        const product = await getProductById(productId);
        if (!product || !product.isWholesale) {
            console.error('Product not found or not wholesale:', productId);
            showNotification('Product not found or not a wholesale item.', 'error');
            return;
        }

        console.log('Found product:', { name: product.name, isWholesale: product.isWholesale });

        const moq = product.moq || product.minOrderQty || 1;
        const addQuantity = quantity || moq;

        console.log('Quantity info:', { moq, addQuantity });

        // Validate quantity meets minimum order quantity
        if (addQuantity < moq) {
            showNotification(`Minimum order quantity is ${moq}.`, 'error');
            return;
        }

        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            // For wholesale, add the specified quantity
            const newQuantity = existingItem.quantity + addQuantity;

            // Check inventory
            const inventoryCheck = typeof checkInventory === 'function' ?
                await checkInventory(productId, newQuantity) : { available: product.inStock };

            console.log('Inventory check for existing item:', inventoryCheck);

            if (!inventoryCheck.available) {
                showNotification(inventoryCheck.reason || 'Cannot add more items. Insufficient stock.', 'error');
                return;
            }

            existingItem.quantity = newQuantity;
            showNotification(`Added ${addQuantity} more ${product.name} to cart!`, 'success');
        } else {
            // First time adding wholesale item

            // Check inventory for the quantity
            const inventoryCheck = typeof checkInventory === 'function' ?
                await checkInventory(productId, addQuantity) : { available: product.inStock };

            console.log('Inventory check for new item:', inventoryCheck);

            if (!inventoryCheck.available) {
                showNotification(inventoryCheck.reason || 'Cannot add item. Insufficient stock.', 'error');
                return;
            }

            cart.push({
                id: productId,
                name: product.name,
                price: product.wholesalePrice || product.price,
                image: product.image,
                quantity: addQuantity,
                isWholesale: true,
                moq: moq
            });

            showNotification(`${product.name} added to cart with quantity ${addQuantity}!`, 'success');
        }

        saveCart();
        updateCartCount();
        updateCartDisplay();
    } catch (error) {
        console.error('Error in addWholesaleToCart:', error);
        showNotification('Error adding item to cart. Please try again.', 'error');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    updateCartDisplay();
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            // For wholesale items, prevent reducing below MOQ
            const moq = item.moq || item.minOrderQty || 1;
            if (item.isWholesale && quantity < moq) {
                showNotification(`Cannot reduce quantity below MOQ of ${moq} for wholesale items.`, 'warning');
                return;
            }
            item.quantity = quantity;
            saveCart();
            updateCartCount();
            updateCartDisplay();
        }
    }
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartCount();
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartItemCount() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cartCount, #mobileCartCount');
    cartCountElements.forEach(element => {
        element.textContent = getCartItemCount();
    });

    // Update mobile tab badge
    const cartTabBadge = document.getElementById('cartTabBadge');
    const itemCount = getCartItemCount();
    if (cartTabBadge) {
        if (itemCount > 0) {
            cartTabBadge.textContent = itemCount > 99 ? '99+' : itemCount;
            cartTabBadge.style.display = 'flex';
        } else {
            cartTabBadge.style.display = 'none';
        }
    }
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartItemCountElement = document.getElementById('cartItemCount');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');
    const shippingCalculator = document.getElementById('shippingCalculator');

    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message" id="emptyCartMessage">
                    <div class="empty-cart-content">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>Your cart is empty</h3>
                        <p>Looks like you haven't added any items to your cart yet.</p>
                        <a href="index.html" class="btn btn-primary">Continue Shopping</a>
                    </div>
                </div>
            `;
            if (cartItemCountElement) cartItemCountElement.textContent = '0';
            if (subtotalElement) subtotalElement.textContent = '₵0.00';
            if (shippingElement) shippingElement.textContent = '₵0.00';
            if (taxElement) taxElement.textContent = '₵0.00';
            if (totalElement) totalElement.textContent = '₵0.00';
            if (shippingCalculator) shippingCalculator.style.display = 'none';
        } else {
            let cartHTML = '';
            cart.forEach(item => {
                const isWholesale = item.isWholesale;
                const moq = item.moq || item.minOrderQty || 1;
                const canDecrease = !isWholesale || item.quantity > moq;

                cartHTML += `
                    <div class="cart-item ${isWholesale ? 'wholesale-item' : ''}" data-product-id="${item.id}">
                        <div class="item-image">
                            <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(item.image) : item.image}" alt="${item.name}">
                        </div>
                        <div class="item-details">
                            <h3>${item.name}</h3>
                            ${isWholesale ? `<small class="wholesale-indicator">Wholesale - MOQ: ${moq}</small>` : ''}
                            <p class="item-price">₵${item.price.toLocaleString()}</p>
                        </div>
                        <div class="item-quantity">
                            <button class="quantity-btn decrease" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})" ${!canDecrease ? 'disabled' : ''}>-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <div class="item-total">
                            ₵${(item.price * item.quantity).toLocaleString()}
                        </div>
                        <button class="remove-item" onclick="removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            cartItemsContainer.innerHTML = cartHTML;

            if (cartItemCountElement) cartItemCountElement.textContent = cart.length;

            // Update pricing with shipping calculation
            const subtotal = getCartTotal();
            const selectedShipping = document.querySelector('input[name="shipping"]:checked');
            const shippingMethod = selectedShipping ? selectedShipping.value : 'standard';
            const shippingCost = typeof calculateShipping === 'function' ?
                calculateShipping(cart, 'accra', shippingMethod) : 50; // Default shipping
            const tax = subtotal * 0.12; // 12% tax
            const total = subtotal + shippingCost + tax;

            if (subtotalElement) subtotalElement.textContent = `₵${subtotal.toLocaleString()}`;
            if (shippingElement) shippingElement.textContent = `₵${shippingCost.toLocaleString()}`;
            if (taxElement) taxElement.textContent = `₵${tax.toLocaleString()}`;
            if (totalElement) totalElement.textContent = `₵${total.toLocaleString()}`;

            // Show shipping calculator
            if (shippingCalculator) {
                shippingCalculator.style.display = 'block';
                updateShippingOptions();
            }
        }
    }
}

// Navigation with Mobile Support
function initializeNavigation() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    console.log('Mobile menu button found:', !!mobileMenuBtn);
    console.log('Nav menu found:', !!navMenu);
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile menu button clicked!');
            navMenu.classList.toggle('active');
            
            // Change icon between hamburger and X
            const icon = this.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
        
        console.log('Mobile menu event listener added');
    } else {
        console.error('Mobile menu elements not found');
    }

    // Dropdown menus
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            // Only prevent default on mobile devices
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = this.closest('.dropdown');
                dropdown.classList.toggle('active');
                
                // Rotate chevron icon
                const chevron = this.querySelector('.fas.fa-chevron-down');
                if (chevron) {
                    if (dropdown.classList.contains('active')) {
                        chevron.style.transform = 'rotate(180deg)';
                    } else {
                        chevron.style.transform = 'rotate(0deg)';
                    }
                }
            }
        });
    });

    // Close mobile menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                if (navMenu) {
                    navMenu.classList.remove('active');
                    if (mobileMenuBtn) {
                        const icon = mobileMenuBtn.querySelector('i');
                        icon.className = 'fas fa-bars';
                    }
                }
            }
        });
    });

    // Close mobile menu and dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!e.target.closest('.nav')) {
                // Close mobile menu
                if (navMenu) {
                    navMenu.classList.remove('active');
                    if (mobileMenuBtn) {
                        const icon = mobileMenuBtn.querySelector('i');
                        icon.className = 'fas fa-bars';
                    }
                }
                // Close all dropdowns
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                    const chevron = dropdown.querySelector('.fas.fa-chevron-down');
                    if (chevron) {
                        chevron.style.transform = 'rotate(0deg)';
                    }
                });
            }
        }
    });
}

// Carousel functionality
function initializeCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.getElementById('indicators');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (slides.length === 0) return;

    // Create indicators
    if (indicators) {
        indicators.innerHTML = '';
        for (let i = 0; i < slides.length; i++) {
            const indicator = document.createElement('span');
            indicator.className = i === 0 ? 'active' : '';
            indicator.addEventListener('click', () => goToSlide(i));
            indicators.appendChild(indicator);
        }
    }

    // Auto-play carousel
    startCarousel();

    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            previousSlide();
            resetCarousel();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetCarousel();
        });
    }

    // Pause on hover
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopCarousel);
        carouselContainer.addEventListener('mouseleave', startCarousel);
    }
}

function goToSlide(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicators span');
    
    if (slides.length === 0) return;

    slides[currentSlide].classList.remove('active');
    if (indicators[currentSlide]) {
        indicators[currentSlide].classList.remove('active');
    }
    
    currentSlide = (n + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    if (indicators[currentSlide]) {
        indicators[currentSlide].classList.add('active');
    }
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function previousSlide() {
    goToSlide(currentSlide - 1);
}

function startCarousel() {
    stopCarousel();
    slideInterval = setInterval(nextSlide, 5000);
}

function stopCarousel() {
    if (slideInterval) {
        clearInterval(slideInterval);
    }
}

function resetCarousel() {
    stopCarousel();
    startCarousel();
}

// Page-specific initializations
function initializeHomePage() {
    console.log('Initializing homepage...');
    loadNewArrivals();
    loadFastSellingItems();
    loadCategoryHighlights();
}

function initializeCategoriesPage() {
    // Category filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            filterCategories(category);
            
            // Update active button
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function initializeWholesalePage() {
    loadWholesaleProducts();
}

function initializeDealsPage() {
    loadFeaturedDeals();
    setupDealFilters();
    startCountdownTimer();
}

function initializeCartPage() {
    updateCartDisplay();
    
    // Clear cart button
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your cart?')) {
                clearCart();
            }
        });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) {
                showNotification('Your cart is empty!', 'error');
                return;
            }
            alert('Checkout functionality would be implemented here.');
        });
    }

    // Suggested products
    loadSuggestedProducts();
}

function initializeContactPage() {
    setupContactForm();
    setupFAQ();
}

// Product loading functions
async function loadNewArrivals(forceRefresh = false) {
    console.log('Loading new arrivals...', forceRefresh ? '(forced refresh)' : '');
    const container = document.getElementById('newArrivals');
    if (!container) {
        console.error('newArrivals container not found');
        return;
    }

    try {
        // Add cache busting parameter to ensure fresh data
        const cacheBust = forceRefresh ? `?timestamp=${Date.now()}` : '';
        const newArrivals = (await getNewArrivals(cacheBust)).slice(0, 8);
        console.log('New arrivals products to display:', newArrivals.length);
        console.log('New arrivals product names:', newArrivals.map(p => p.name));

        // Filter out out-of-stock products
        const inStockArrivals = filterInStockProducts(newArrivals);

        if (inStockArrivals.length === 0) {
            container.innerHTML = '<p>No new arrivals currently in stock.</p>';
        } else {
            container.innerHTML = inStockArrivals.map(product => createProductCard(product)).join('');
        }
        console.log('New arrivals loaded successfully, HTML length:', container.innerHTML.length);
    } catch (error) {
        console.error('Error loading new arrivals:', error);
        container.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
}

// Filter products to only show in-stock items
function filterInStockProducts(products) {
    return products.filter(product => {
        // Check if product has stock information
        const stockCount = product.stockCount || product.stock || 0;

        // Handle backend API format (stockStatus: 'in-stock'/'out-of-stock')
        if (product.stockStatus) {
            return product.stockStatus === 'in-stock' && stockCount > 0;
        }

        // Handle legacy format (inStock: boolean)
        const inStock = product.inStock !== undefined ? product.inStock : stockCount > 0;

        // Check inventory status directly from product data
        return product.stockStatus === 'in-stock' && stockCount > 0;
    });
}

async function loadFastSellingItems(forceRefresh = false) {
    console.log('Loading fast selling items...', forceRefresh ? '(forced refresh)' : '');
    const container = document.getElementById('fastSelling');
    if (!container) {
        console.error('fastSelling container not found');
        return;
    }

    try {
        // Add cache busting parameter to ensure fresh data
        const cacheBust = forceRefresh ? `?timestamp=${Date.now()}` : '';
        const fastSelling = (await getFastSellingItems(cacheBust)).slice(0, 8);
        console.log('Fast selling products to display:', fastSelling.length);
        console.log('Fast selling product names:', fastSelling.map(p => p.name));

        // Filter out out-of-stock products
        const inStockFastSelling = filterInStockProducts(fastSelling);

        if (inStockFastSelling.length === 0) {
            container.innerHTML = '<p>No fast-selling items currently in stock.</p>';
        } else {
            container.innerHTML = inStockFastSelling.map(product => createProductCard(product)).join('');
        }
        console.log('Fast selling items loaded successfully, HTML length:', container.innerHTML.length);
    } catch (error) {
        console.error('Error loading fast selling items:', error);
        container.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
}

async function loadCategoryHighlights() {
    console.log('Loading category highlights...');
    const container = document.getElementById('categoryGrid');
    if (!container) {
        console.error('categoryGrid container not found');
        return;
    }

    try {
        const categories = (await getCategoryData()).slice(0, 6);
        console.log('Categories data:', categories);
        container.innerHTML = categories.map(category => createCategoryCard(category)).join('');
        console.log('Category highlights loaded successfully');
    } catch (error) {
        console.error('Error loading category highlights:', error);
        container.innerHTML = '<p>Error loading categories. Please try again later.</p>';
    }
}

function loadFeaturedDeals() {
    const container = document.getElementById('featuredDeals');
    if (!container) return;

    const deals = getAllProducts()
        .filter(product => product.originalPrice > product.price);

    // Filter out out-of-stock products
    const inStockDeals = filterInStockProducts(deals).slice(0, 3);

    if (inStockDeals.length === 0) {
        container.innerHTML = '<p>No featured deals currently in stock.</p>';
    } else {
        container.innerHTML = inStockDeals.map(product => createDealCard(product)).join('');
    }
}

async function loadWholesaleProducts(forceRefresh = false) {
    console.log('Loading wholesale products...', forceRefresh ? '(forced refresh)' : '');
    const container = document.getElementById('wholesaleGrid');
    if (!container) return;

    try {
        // Add cache busting parameter to ensure fresh data
        const cacheBust = forceRefresh ? `?timestamp=${Date.now()}` : '';
        const wholesaleProducts = await getWholesaleProducts(cacheBust);

        // Filter out out-of-stock products
        const inStockWholesale = filterInStockProducts(wholesaleProducts);

        if (inStockWholesale.length === 0) {
            container.innerHTML = '<p>No wholesale products currently in stock.</p>';
        } else {
            container.innerHTML = inStockWholesale.map(product => createWholesaleProductCard(product)).join('');
        }
        console.log('Wholesale products loaded successfully');
    } catch (error) {
        console.error('Error loading wholesale products:', error);
        container.innerHTML = '<p>Error loading wholesale products. Please try again later.</p>';
    }
}

// Manual refresh function for product data
function refreshProductData() {
    showLoading();
    console.log('Manually refreshing product data...');

    // Clear any existing product cache
    if (typeof clearProductCache === 'function') {
        clearProductCache();
    }

    // Force refresh all product data
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
        loadNewArrivals(true);
        loadFastSellingItems(true);
        loadCategoryHighlights();
    } else if (currentPage === 'wholesale.html') {
        loadWholesaleProducts(true);
    } else if (currentPage === 'deals.html') {
        loadFeaturedDeals();
    }

    // Show notification
    setTimeout(() => {
        hideLoading();
        showNotification('Product data refreshed! New products should now appear.', 'success');
    }, 2000);
}

// Add refresh function to window for global access
window.refreshProductData = refreshProductData;

async function loadSuggestedProducts() {
    const container = document.getElementById('suggestedProducts');
    if (!container) return;

    try {
        const currentProductIds = cart.map(item => item.id);
        const suggestions = await getSuggestedProducts(currentProductIds);
        container.innerHTML = suggestions.map(product => createProductCard(product)).join('');
    } catch (error) {
        console.error('Error loading suggested products:', error);
        container.innerHTML = '<p>Error loading suggestions. Please try again later.</p>';
    }
}

// Create HTML elements
function createProductCard(product) {
    // Handle API product properties (use _id if id not present, stock if stockCount not present, etc.)
    const productId = product.id || product._id;
    const stockCount = product.stockCount || product.stock || 0;
    const isNew = product.isNew || product.isNewArrival;
    const inStock = product.inStock !== undefined ? product.inStock : stockCount > 0;

    const discount = product.originalPrice > product.price ?
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const isProductInWishlist = typeof window.isInWishlist === 'function' && window.isInWishlist(productId);

    // Check inventory status directly from product data
    const available = product.stockStatus === 'in-stock' && stockCount > 0;
    const lowStock = available && stockCount <= 5; // Consider low stock if 5 or fewer items

    const stockStatus = !available ? 'out-of-stock' :
                        lowStock ? 'low-stock' : 'in-stock';

    const stockText = !available ? 'Out of Stock' :
                      (lowStock && stockCount > 0) ? `Only ${stockCount} left` : '';

    return `
        <div class="product-card ${stockStatus}" data-product-id="${productId}">
            ${discount > 0 ? `<div class="product-badge discount">-${discount}%</div>` : ''}
            <div class="product-image">
                <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(product.image) : product.image}" alt="${product.name}" loading="lazy">
                <div class="product-overlay">
                    <button class="quick-view-btn" onclick="quickView('${productId}')">Quick View</button>
                    <button class="add-to-cart-btn" onclick="addToCart('${productId}')" ${!available ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> ${!available ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name || 'Unnamed Product'}</h3>
                ${product.brand ? `<p class="product-brand">Brand: ${product.brand}</p>` : ''}
                <p class="product-description">${product.shortDescription || product.description || 'No description available'}</p>
                ${product.colors && product.colors.length > 0 ? `<p class="product-colors">Colors: ${product.colors.join(', ')}</p>` : ''}
                ${product.sizes && product.sizes.length > 0 ? `<p class="product-sizes">Sizes: ${product.sizes.join(', ')}</p>` : ''}
                <div class="product-rating">
                    <div class="stars">
                        ${generateStarRating(product.rating || 0)}
                    </div>
                    <span class="rating-text">${product.rating || 0} (${product.reviews || 0})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">₵${(product.price || 0).toLocaleString()}</span>
                    ${product.originalPrice > product.price ?
                        `<span class="original-price">₵${product.originalPrice.toLocaleString()}</span>` : ''}
                </div>
                <div class="product-card-actions">
                    <button class="btn btn-primary add-to-cart-btn" onclick="addToCart('${productId}')" ${!available ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="btn btn-outline view-details-btn" onclick="viewProductDetails('${productId}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <div class="product-actions">
                        <button class="action-btn compare-btn" onclick="addToCompare('${productId}')" title="Compare">
                            <i class="fas fa-balance-scale"></i>
                        </button>
                        <button class="action-btn wishlist-btn ${isProductInWishlist ? 'in-wishlist' : ''}" onclick="toggleWishlist('${productId}')" title="Wishlist">
                            <i class="fa${isProductInWishlist ? 's' : 'r'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createCategoryCard(category) {
    return `
        <div class="category-card" onclick="navigateToCategory('${category.id}')">
            <div class="category-image">
                <img src="${category.image}" alt="${category.name}" loading="lazy">
            </div>
            <div class="category-content">
                <h3>${category.name}</h3>
                <p>${category.productCount}+ Products</p>
            </div>
        </div>
    `;
}

function createWholesaleProductCard(product) {
    // Handle API product properties
    const productId = product.id || product._id;
    const stockCount = product.stockCount || product.stock || 0;
    const inStock = product.inStock !== undefined ? product.inStock : stockCount > 0;
    const moq = product.moq || product.minOrderQty || 1;

    const discount = product.originalPrice > product.price ?
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const isProductInWishlist = typeof window.isInWishlist === 'function' && window.isInWishlist(productId);

    // Check inventory status directly from product data
    const available = product.stockStatus === 'in-stock' && stockCount > 0;
    const lowStock = available && stockCount <= 5; // Consider low stock if 5 or fewer items

    // Debug logging
    console.log('Wholesale Product Debug:', {
        productId: productId,
        productName: product.name,
        wholesalePrice: product.wholesalePrice,
        regularPrice: product.price,
        stockStatus: product.stockStatus,
        stockCount: stockCount,
        inStock: inStock,
        available: available,
        lowStock: lowStock
    });

    const stockStatus = !available ? 'out-of-stock' : '';
    const stockText = !available ? 'Out of Stock' : (lowStock && stockCount > 0) ? `Only ${stockCount} left` : '';

    // Debug logging for stock status
    console.log('Wholesale Product Stock Debug for product', productId, ':', {
        available: available,
        lowStock: lowStock,
        stockStatus: stockStatus,
        stockCount: stockCount,
        inStock: inStock,
        productStockStatus: product.stockStatus
    });

    return `
        <div class="product-card wholesale-card ${stockStatus}" data-product-id="${productId}">
            <div class="product-badge wholesale">WHOLESALE</div>
            ${discount > 0 ? `<div class="product-badge discount">-${discount}%</div>` : ''}
            <div class="product-image">
                <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(product.image) : product.image}" alt="${product.name || 'Unnamed Product'}" loading="lazy">
                <div class="product-overlay">
                    <button class="quick-view-btn" onclick="console.log('Quick View button clicked for product:', '${productId}'); quickView('${productId}')" style="position: relative; z-index: 10;">Quick View</button>
                    <button class="add-to-cart-btn" onclick="console.log('Overlay Add to Cart button clicked for product:', '${productId}'); addWholesaleToCart('${productId}', ${moq})" style="position: relative; z-index: 10;">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name || 'Unnamed Product'}</h3>
                <p class="product-description">${product.description || product.shortDescription || 'No description available'}</p>
                <div class="wholesale-moq">
                    <span class="moq-label">MOQ: ${moq} units</span>
                </div>
                <div class="product-rating">
                    <div class="stars">
                        ${generateStarRating(product.rating || 0)}
                    </div>
                    <span class="rating-text">${product.rating || 0} (${product.reviews || 0})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">₵${(product.wholesalePrice || 0).toLocaleString()}</span>
                    ${product.originalPrice > product.price ?
                        `<span class="original-price">₵${product.originalPrice.toLocaleString()}</span>` : ''}
                    <div class="wholesale-savings">
                        <small>Wholesale pricing</small>
                    </div>
                </div>
                <div class="product-card-actions">
                    <div class="wholesale-quantity-controls" style="margin-bottom: 10px;">
                        <label style="font-size: 12px; color: var(--medium-gray); margin-bottom: 5px; display: block;">Quantity (Min: ${moq}):</label>
                        <div class="quantity-controls" style="display: flex; align-items: center; gap: 10px;">
                            <button class="quantity-btn decrease" onclick="console.log('Decrease button clicked for product:', '${productId}'); adjustWholesaleQuantity('${productId}', -1)" style="width: 30px; height: 30px; border: 1px solid var(--light-gray); background: white; border-radius: 4px; cursor: pointer; z-index: 20; position: relative; pointer-events: auto;">-</button>
                            <input type="number" id="wholesale-qty-${productId}" value="${moq}" min="${moq}" step="1" style="width: 60px; text-align: center; padding: 5px; border: 1px solid var(--light-gray); border-radius: 4px;">
                            <button class="quantity-btn increase" onclick="console.log('Increase button clicked for product:', '${productId}'); adjustWholesaleQuantity('${productId}', 1)" style="width: 30px; height: 30px; border: 1px solid var(--light-gray); background: white; border-radius: 4px; cursor: pointer; z-index: 20; position: relative; pointer-events: auto;">+</button>
                        </div>
                    </div>
                    <button class="btn btn-primary add-to-cart-btn" onclick="console.log('Add to Cart button clicked for product:', '${productId}'); addWholesaleToCart('${productId}', parseInt(document.getElementById('wholesale-qty-${productId}').value))" style="position: relative; z-index: 20; pointer-events: auto;">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                    <button class="btn btn-outline view-details-btn" onclick="console.log('View Details button clicked for product:', '${productId}'); viewProductDetails('${productId}')" style="position: relative; z-index: 10;">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <div class="product-actions">
                        <button class="action-btn compare-btn" onclick="addToCompare('${productId}')" title="Compare">
                            <i class="fas fa-balance-scale"></i>
                        </button>
                        <button class="action-btn wishlist-btn ${isProductInWishlist ? 'in-wishlist' : ''}" onclick="toggleWishlist('${productId}')" title="Wishlist">
                            <i class="fa${isProductInWishlist ? 's' : 'r'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createDealCard(product) {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    return `
        <div class="deal-card" data-product-id="${product.id}">
            <div class="deal-badge">${discount}% OFF</div>
            <div class="deal-image">
                <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(product.image) : product.image}" alt="${product.name}" loading="lazy">
                <div class="deal-overlay">
                    <button class="quick-view-btn">Quick View</button>
                </div>
            </div>
            <div class="deal-content">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="price-section">
                    <span class="original-price">₵${product.originalPrice.toLocaleString()}</span>
                    <span class="deal-price">₵${product.price.toLocaleString()}</span>
                    <span class="savings">You save ₵${(product.originalPrice - product.price).toLocaleString()}</span>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
}

// Utility functions
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
    
    // Manual close
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
}

function navigateToCategory(categoryId) {
    window.location.href = `${categoryId}.html`;
}

async function quickView(productId) {
    const product = await getProductById(productId);
    if (!product) return;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'zoom-modal';
    modal.style.background = 'rgba(0, 0, 0, 0.8)';
    modal.innerHTML = `
        <div style="background: white; margin: 5% auto; max-width: 800px; border-radius: 8px; overflow: hidden; position: relative;">
            <div style="display: flex; padding: 2rem;">
                <div style="flex: 1; margin-right: 2rem;">
                    <div class="product-gallery">
                        <div class="gallery-thumbnails">
                            ${(product.images || [product.image]).map((img, index) =>
                                `<img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(img) : img}" alt="Product image ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${typeof getFullImageUrl === 'function' ? getFullImageUrl(img) : img}')">`
                            ).join('')}
                        </div>
                        <div class="main-image-container">
                            <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(product.images ? product.images[0] : product.image) : (product.images ? product.images[0] : product.image)}" alt="${product.name}" class="main-image" id="mainImage">
                            <button class="image-zoom" onclick="toggleZoom('${typeof getFullImageUrl === 'function' ? getFullImageUrl(product.images ? product.images[0] : product.image) : (product.images ? product.images[0] : product.image)}')">
                                <i class="fas fa-search-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div style="flex: 1;">
                    <h2 style="margin-bottom: 1rem; color: var(--dark-gray);">${product.name}</h2>
                    <p style="color: var(--medium-gray); margin-bottom: 1rem;">${product.description}</p>

                    <div class="product-rating" style="margin-bottom: 1rem;">
                        <div class="stars">${generateStarRating(product.rating)}</div>
                        <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
                    </div>

                    <div class="product-price" style="margin-bottom: 1.5rem;">
                        <span class="current-price">₵${product.price.toLocaleString()}</span>
                        ${product.originalPrice > product.price ?
                            `<span class="original-price">₵${product.originalPrice.toLocaleString()}</span>` : ''}
                    </div>

                    ${product.variants ? `
                        <div class="variant-selector">
                            ${product.variants.colors ? `
                                <div class="variant-group">
                                    <label class="variant-label">Color:</label>
                                    <div class="variant-options">
                                        ${product.variants.colors.map(color =>
                                            `<button class="variant-option" onclick="selectVariant(this, 'color', '${color}')">${color}</button>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            ${product.variants.storage ? `
                                <div class="variant-group">
                                    <label class="variant-label">Storage:</label>
                                    <div class="variant-options">
                                        ${product.variants.storage.map(storage =>
                                            `<button class="variant-option" onclick="selectVariant(this, 'storage', '${storage}')">${storage}</button>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    <div style="margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="addToCart('${product.id}'); this.closest('.zoom-modal').remove();">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="btn btn-outline" onclick="addToCompare('${product.id}'); this.closest('.zoom-modal').remove();">
                            <i class="fas fa-balance-scale"></i> Compare
                        </button>
                    </div>
                </div>
            </div>
            <button onclick="this.closest('.zoom-modal').remove()" style="position: absolute; top: 10px; right: 10px; background: var(--error); color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function changeMainImage(thumbnail, imageSrc) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = imageSrc;
    }

    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
    thumbnail.classList.add('active');
}

function toggleZoom(imageSrc) {
    const existingZoom = document.querySelector('.zoom-modal img[style*="max-width"]');
    if (existingZoom) {
        existingZoom.closest('.zoom-modal').remove();
        return;
    }

    const zoomModal = document.createElement('div');
    zoomModal.className = 'zoom-modal';
    zoomModal.innerHTML = `<img src="${imageSrc}" style="max-width: 90%; max-height: 90%;">`;
    document.body.appendChild(zoomModal);

    zoomModal.addEventListener('click', function() {
        zoomModal.remove();
    });
}

function selectVariant(button, type, value) {
    // Remove selected class from siblings
    const siblings = button.parentElement.querySelectorAll('.variant-option');
    siblings.forEach(sib => sib.classList.remove('selected'));

    // Add selected class to clicked button
    button.classList.add('selected');
}

// Event handlers for add to cart buttons
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
        e.preventDefault();
        const button = e.target.classList.contains('add-to-cart-btn') ? e.target : e.target.closest('.add-to-cart-btn');
        const productId = button.getAttribute('data-product') || button.closest('[data-product-id]')?.getAttribute('data-product-id');
        
        if (productId) {
            addToCart(productId);
        }
    }
});

// Category filtering
function filterCategories(category) {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
            card.classList.remove('fade-in');
        }
    });
}

// Deal page specific functions
function setupDealFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            filterDeals(category);
            
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function filterDeals(category) {
    const dealCards = document.querySelectorAll('.deal-card');
    
    dealCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function startCountdownTimer() {
    // Set target time to end of day
    const now = new Date();
    const targetTime = new Date(now);
    targetTime.setHours(23, 59, 59, 999);
    
    function updateTimer() {
        const currentTime = new Date();
        const timeLeft = targetTime - currentTime;
        
        if (timeLeft <= 0) {
            // Reset to next day
            const nextDay = new Date(targetTime);
            nextDay.setDate(nextDay.getDate() + 1);
            targetTime.setTime(nextDay.getTime());
            return;
        }
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Contact form handling
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);

            try {
                // Send message to API
                const response = await fetch('https://netyarkmall-production.up.railway.app/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: data.name || 'Anonymous',
                        message: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n\n${data.message}`
                    })
                });

                if (response.ok) {
                    showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
                    this.reset();
                } else {
                    showNotification('Failed to send message. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                showNotification('Failed to send message. Please try again.', 'error');
            }
        });
    }
}

// FAQ handling
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', function() {
                const isOpen = item.classList.contains('active');
                
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    if (otherAnswer) {
                        otherAnswer.style.maxHeight = null;
                    }
                });
                
                // Toggle current item
                if (!isOpen) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        }
    });
}

// Newsletter forms
document.addEventListener('submit', function(e) {
    if (e.target.classList.contains('newsletter-form') || e.target.id === 'newsletterForm') {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        showNotification('Thank you for subscribing to our newsletter!', 'success');
        e.target.reset();
    }
});

// Mobile responsiveness
function handleResize() {
    // Close mobile menu on larger screens
    if (window.innerWidth > 768) {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    }
}

window.addEventListener('resize', handleResize);

// Smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

// Loading animation
function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.remove();
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('globalSearch');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput || !searchBtn || !searchResults) return;

    // Search button click
    searchBtn.addEventListener('click', performSearch);

    // Search input enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Live search as user types
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();

        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            performLiveSearch(query);
        }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
}

function performSearch() {
    const query = document.getElementById('globalSearch').value.trim();
    if (query) {
        // Redirect to search results page or show results on current page
        window.location.href = `categories.html?search=${encodeURIComponent(query)}`;
    }
}

async function performLiveSearch(query) {
    try {
        const results = (await searchProducts(query)).slice(0, 5); // Limit to 5 results
        const searchResults = document.getElementById('searchResults');

        if (results.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        let html = '';
        results.forEach(product => {
            const discount = product.originalPrice > product.price ?
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

            html += `
                <div class="search-result-item" onclick="viewProduct('${product.id}')">
                    <div class="search-result-image">
                        <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(product.image) : product.image}" alt="${product.name}">
                    </div>
                    <div class="search-result-info">
                        <h4>${product.name}</h4>
                        <div class="search-result-price">
                            ₵${product.price.toLocaleString()}
                            ${discount > 0 ? ` <span class="original-price">₵${product.originalPrice.toLocaleString()}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        // Add "View all results" link
        html += `
            <div class="search-result-item view-all" onclick="performSearch()">
                <div class="search-result-info">
                    <h4>View all results for "${query}"</h4>
                </div>
            </div>
        `;

        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
    } catch (error) {
        console.error('Error performing live search:', error);
        document.getElementById('searchResults').style.display = 'none';
    }
}

function viewProduct(productId) {
    // For now, redirect to categories page with product filter
    // In a real implementation, this would go to a product detail page
    window.location.href = `categories.html?product=${productId}`;
}

function viewProductDetails(productId) {
    try {
        console.log('viewProductDetails called with productId:', productId);
        if (!productId) {
            console.error('No productId provided');
            showNotification('Invalid product ID.', 'error');
            return;
        }

        // Redirect to product detail page
        console.log('Redirecting to product details page for:', productId);
        window.location.href = `product.html?id=${productId}`;
    } catch (error) {
        console.error('Error in viewProductDetails:', error);
        showNotification('Error viewing product details. Please try again.', 'error');
    }
}

// Toggle wishlist function
function toggleWishlist(productId) {
    if (typeof addToWishlist === 'function' && typeof removeFromWishlist === 'function') {
        const isInWishlist = window.isInWishlist(productId);

        if (isInWishlist) {
            removeFromWishlist(productId);
        } else {
            addToWishlist(productId);
        }

        // Update UI
        updateWishlistButtons();
    }
}

function updateWishlistButtons() {
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(btn => {
        const productId = btn.closest('[data-product-id]').getAttribute('data-product-id');
        const isInWishlist = typeof window.isInWishlist === 'function' && window.isInWishlist(productId);

        btn.classList.toggle('in-wishlist', isInWishlist);
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isInWishlist ? 'fas fa-heart' : 'far fa-heart';
        }
    });
}

function adjustWholesaleQuantity(productId, delta) {
    try {
        console.log('adjustWholesaleQuantity called with:', { productId, delta });

        // For wholesale, only allow increasing quantity (delta should be positive)
        if (delta < 0) {
            console.log('Wholesale quantity decrease attempted - ignoring');
            showNotification('Wholesale quantities can only be increased.', 'info');
            return;
        }

        const quantityInput = document.getElementById(`wholesale-qty-${productId}`);
        if (!quantityInput) {
            console.error('Quantity input not found for product:', productId);
            return;
        }

        const currentValue = parseInt(quantityInput.value) || 0;
        const minValue = parseInt(quantityInput.min) || 1;
        const newValue = Math.max(minValue, currentValue + delta);

        console.log('Quantity adjustment:', { currentValue, minValue, newValue });

        quantityInput.value = newValue;

        // Remove readonly attribute to make the field editable
        quantityInput.removeAttribute('readonly');

        // Also allow manual input changes
        quantityInput.addEventListener('change', function() {
            const manualValue = parseInt(this.value) || minValue;
            if (manualValue < minValue) {
                this.value = minValue;
                showNotification(`Minimum order quantity is ${minValue}.`, 'warning');
            }
        });
    } catch (error) {
        console.error('Error in adjustWholesaleQuantity:', error);
        showNotification('Error adjusting quantity. Please try again.', 'error');
    }
}

// Product comparison functionality
let compareList = JSON.parse(localStorage.getItem('compare_list') || '[]');

function initializeComparison() {
    updateCompareDisplay();

    // Compare button event
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.addEventListener('click', showCompareModal);
    }

    // Clear compare button
    const clearCompareBtn = document.getElementById('clearCompareBtn');
    if (clearCompareBtn) {
        clearCompareBtn.addEventListener('click', clearCompareList);
    }
}

function addToCompare(productId) {
    if (compareList.length >= 3) {
        showNotification('You can compare up to 3 products at a time.', 'warning');
        return;
    }

    if (!compareList.includes(productId)) {
        compareList.push(productId);
        saveCompareList();
        updateCompareDisplay();
        showNotification('Product added to comparison.', 'success');
    } else {
        showNotification('Product already in comparison.', 'info');
    }
}

function removeFromCompare(productId) {
    const index = compareList.indexOf(productId);
    if (index > -1) {
        compareList.splice(index, 1);
        saveCompareList();
        updateCompareDisplay();
        showNotification('Product removed from comparison.', 'info');
    }
}

function clearCompareList() {
    compareList = [];
    saveCompareList();
    updateCompareDisplay();
    showNotification('Comparison list cleared.', 'info');
}

function saveCompareList() {
    localStorage.setItem('compare_list', JSON.stringify(compareList));
}

function updateCompareDisplay() {
    const compareContainer = document.getElementById('compareContainer');
    const compareItems = document.getElementById('compareItems');

    if (!compareContainer || !compareItems) return;

    if (compareList.length === 0) {
        compareContainer.style.display = 'none';
        return;
    }

    compareContainer.style.display = 'block';
    let html = '';

    compareList.forEach(productId => {
        const product = getProductById(productId);
        if (product) {
            html += `
                <div class="compare-item">
                    <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(product.image) : product.image}" alt="${product.name}">
                    <span>${product.name}</span>
                    <button onclick="removeFromCompare('${productId}')" title="Remove">&times;</button>
                </div>
            `;
        }
    });

    compareItems.innerHTML = html;
}

function showCompareModal() {
    if (compareList.length < 2) {
        showNotification('Please add at least 2 products to compare.', 'warning');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'compare-modal';
    modal.innerHTML = `
        <div class="compare-modal-content">
            <div class="compare-table">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            ${compareList.map(id => {
                                const product = getProductById(id);
                                return `<th>${product ? product.name : 'Unknown'}</th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Image</td>
                            ${compareList.map(id => {
                                const product = getProductById(id);
                                return `<td><img src="${product ? (typeof getFullImageUrl === 'function' ? getFullImageUrl(product.image) : product.image) : ''}" alt="Product" style="width: 100px; height: 100px; object-fit: cover;"></td>`;
                            }).join('')}
                        </tr>
                        <tr>
                            <td>Price</td>
                            ${compareList.map(id => {
                                const product = getProductById(id);
                                return `<td>₵${product ? product.price.toLocaleString() : 'N/A'}</td>`;
                            }).join('')}
                        </tr>
                        <tr>
                            <td>Rating</td>
                            ${compareList.map(id => {
                                const product = getProductById(id);
                                return `<td>${product ? generateStarRating(product.rating) : 'N/A'}</td>`;
                            }).join('')}
                        </tr>
                        <tr>
                            <td>Category</td>
                            ${compareList.map(id => {
                                const product = getProductById(id);
                                return `<td>${product ? product.category : 'N/A'}</td>`;
                            }).join('')}
                        </tr>
                        <tr>
                            <td>Action</td>
                            ${compareList.map(id => `<td><button class="compare-remove" onclick="removeFromCompare('${id}'); showCompareModal();">Remove</button></td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
            <button onclick="this.closest('.compare-modal').remove()" style="position: absolute; top: 10px; right: 10px; background: var(--error); color: white; border: none; padding: 5px 10px; cursor: pointer;">Close</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Mobile Navigation Handling
function initializeMobileNavigation() {
    const tabItems = document.querySelectorAll('.tab-item');

    tabItems.forEach(tab => {
        tab.addEventListener('click', function(e) {
            // Check if profile tab and user not logged in
            if (this.getAttribute('data-tab') === 'profile' && typeof isLoggedIn === 'function' && !isLoggedIn()) {
                e.preventDefault();
                showNotification('Please log in to access your profile.', 'info');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                return;
            }

            // Remove active class from all tabs
            tabItems.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Add ripple effect
            createRippleEffect(e, this);
        });
    });

    // Handle swipe gestures for carousel
    initializeSwipeGestures();
}

function createRippleEffect(event, element) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Swipe Gesture Handling
function initializeSwipeGestures() {
    let startX, startY, endX, endY;

    const carousel = document.querySelector('.carousel-container');
    if (!carousel) return;

    carousel.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });

    carousel.addEventListener('touchend', function(e) {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;

        handleSwipe(startX, startY, endX, endY);
    });
}

function handleSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Check if it's a horizontal swipe (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
            // Swipe right - previous slide
            previousSlide();
        } else {
            // Swipe left - next slide
            nextSlide();
        }
        resetCarousel();
    }
}

// Mobile Performance Optimizations
function initializeMobileOptimizations() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Add passive event listeners for better scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
}

// Mobile Search Functionality
function initializeMobileSearch() {
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileSearchClose = document.getElementById('mobileSearchClose');
    const mobileSearchContainer = document.getElementById('mobileSearchContainer');
    const mobileSearchInput = document.getElementById('mobileGlobalSearch');
    const mobileSearchResults = document.getElementById('mobileSearchResults');

    if (!mobileSearchBtn || !mobileSearchContainer) return;

    // Open mobile search
    mobileSearchBtn.addEventListener('click', function() {
        mobileSearchContainer.classList.add('active');
        if (mobileSearchInput) {
            mobileSearchInput.focus();
        }
    });

    // Close mobile search
    if (mobileSearchClose) {
        mobileSearchClose.addEventListener('click', function() {
            mobileSearchContainer.classList.remove('active');
            if (mobileSearchInput) {
                mobileSearchInput.value = '';
                mobileSearchInput.blur();
            }
            if (mobileSearchResults) {
                mobileSearchResults.innerHTML = '';
            }
        });
    }

    // Mobile search input handling
    if (mobileSearchInput) {
        let mobileSearchTimeout;

        mobileSearchInput.addEventListener('input', function() {
            clearTimeout(mobileSearchTimeout);
            const query = this.value.trim();

            if (query.length < 2) {
                if (mobileSearchResults) {
                    mobileSearchResults.style.display = 'none';
                }
                return;
            }

            mobileSearchTimeout = setTimeout(() => {
                performMobileLiveSearch(query);
            }, 300);
        });

        mobileSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    window.location.href = `categories.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Close search when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileSearchContainer.contains(e.target) && !mobileSearchBtn.contains(e.target)) {
            mobileSearchContainer.classList.remove('active');
            if (mobileSearchInput) {
                mobileSearchInput.value = '';
            }
            if (mobileSearchResults) {
                mobileSearchResults.innerHTML = '';
                mobileSearchResults.style.display = 'none';
            }
        }
    });
}

async function performMobileLiveSearch(query) {
    try {
        const results = (await searchProducts(query)).slice(0, 5);
        const mobileSearchResults = document.getElementById('mobileSearchResults');

        if (!mobileSearchResults) return;

        if (results.length === 0) {
            mobileSearchResults.style.display = 'none';
            return;
        }

        let html = '';
        results.forEach(product => {
            const discount = product.originalPrice > product.price ?
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

            html += `
                <div class="mobile-search-result-item" onclick="viewProduct('${product.id}')">
                    <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(product.image) : product.image}" alt="${product.name}">
                    <div class="mobile-search-result-info">
                        <h4>${product.name}</h4>
                        <div class="mobile-search-result-price">
                            ₵${product.price.toLocaleString()}
                            ${discount > 0 ? ` <span class="original-price">₵${product.originalPrice.toLocaleString()}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        // Add "View all results" option
        html += `
            <div class="mobile-search-result-item view-all" onclick="window.location.href='categories.html?search=${encodeURIComponent(query)}'">
                <div class="mobile-search-result-info">
                    <h4>View all results for "${query}"</h4>
                </div>
            </div>
        `;

        mobileSearchResults.innerHTML = html;
        mobileSearchResults.style.display = 'block';
    } catch (error) {
        console.error('Error performing mobile live search:', error);
        const mobileSearchResults = document.getElementById('mobileSearchResults');
        if (mobileSearchResults) mobileSearchResults.style.display = 'none';
    }
}

// Initialize mobile features
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...

    // Initialize mobile navigation
    initializeMobileNavigation();

    // Initialize mobile search
    initializeMobileSearch();

    // Initialize mobile optimizations
    initializeMobileOptimizations();
});

// Export functions for use in HTML
window.addToCart = addToCart;
window.addWholesaleToCart = addWholesaleToCart;
window.adjustWholesaleQuantity = adjustWholesaleQuantity;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.navigateToCategory = navigateToCategory;
window.quickView = quickView;
window.toggleWishlist = toggleWishlist;
window.viewProduct = viewProduct;
window.viewProductDetails = viewProductDetails;
window.addToCompare = addToCompare;
window.removeFromCompare = removeFromCompare;
window.clearCompareList = clearCompareList;
window.showCompareModal = showCompareModal;

// Shipping Calculator Functions
function updateShippingOptions() {
    const shippingZone = document.getElementById('shippingZone');
    const shippingOptions = document.getElementById('shippingOptions');

    if (!shippingZone || !shippingOptions) return;

    const zone = shippingZone.value;
    const options = typeof getShippingOptions === 'function' ?
        getShippingOptions(zone) : getDefaultShippingOptions();

    let html = '';
    options.forEach(option => {
        html += `
            <div class="shipping-option">
                <label class="shipping-label">
                    <input type="radio" name="shipping" value="${option.method}" ${option.method === 'standard' ? 'checked' : ''}>
                    <div class="shipping-details">
                        <div class="shipping-name">${option.name}</div>
                        <div class="shipping-meta">
                            <span class="shipping-cost">₵${option.cost.toLocaleString()}</span>
                            <span class="shipping-time">${option.description}</span>
                            <span class="shipping-date">Est. delivery: ${option.estimatedDelivery}</span>
                        </div>
                    </div>
                </label>
            </div>
        `;
    });

    shippingOptions.innerHTML = html;

    // Add event listeners for shipping changes
    const shippingInputs = shippingOptions.querySelectorAll('input[name="shipping"]');
    shippingInputs.forEach(input => {
        input.addEventListener('change', updateCartDisplay);
    });
}

function getDefaultShippingOptions() {
    return [
        {
            method: 'standard',
            name: 'Standard Delivery',
            cost: 50,
            description: '3-5 business days',
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            available: true
        },
        {
            method: 'express',
            name: 'Express Delivery',
            cost: 125,
            description: '1-2 business days',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            available: true
        }
    ];
}

// Initialize shipping calculator
function initializeShippingCalculator() {
    const shippingZone = document.getElementById('shippingZone');
    if (shippingZone) {
        shippingZone.addEventListener('change', updateShippingOptions);
    }
}

// Add to cart page initialization
function initializeCartPage() {
    updateCartDisplay();

    // Initialize shipping calculator
    initializeShippingCalculator();

    // Clear cart button
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your cart?')) {
                clearCart();
            }
        });
    }

    // Checkout button - now redirects to checkout page
    // (handled by HTML link)

    // Suggested products
    loadSuggestedProducts();
}

// Checkout page initialization
function initializeCheckoutPage() {
    console.log('Initializing checkout page...');

    // Check if cart is empty
    if (cart.length === 0) {
        showNotification('Your cart is empty. Redirecting to shop...', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Load cart items into checkout summary
    loadCheckoutItems();

    // Initialize shipping options
    updateShippingOptions();

    // Handle shipping zone change
    const shippingZone = document.getElementById('shippingZone');
    if (shippingZone) {
        shippingZone.addEventListener('change', updateShippingOptions);
    }

    // Handle form submission
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processCheckoutOrder(this);
        });
    }
}

function initiateCheckout() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        showNotification('Please log in to proceed with checkout.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Create checkout modal
    showCheckoutModal();
}

function showCheckoutModal() {
    const selectedShipping = document.querySelector('input[name="shipping"]:checked');
    const shippingZone = document.getElementById('shippingZone')?.value || 'accra';
    const shippingMethod = selectedShipping ? selectedShipping.value : 'standard';

    const subtotal = getCartTotal();
    const shippingCost = typeof calculateShipping === 'function' ?
        calculateShipping(cart, shippingZone, shippingMethod) : 50;
    const tax = subtotal * 0.12;
    const total = subtotal + shippingCost + tax;

    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    modal.innerHTML = `
        <div class="checkout-modal-content">
            <h2>Complete Your Order</h2>

            <div class="checkout-sections">
                <!-- Order Summary -->
                <div class="checkout-section">
                    <h3>Order Summary</h3>
                    <div class="checkout-items">
                        ${cart.map(item => `
                            <div class="checkout-item">
                                <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(item.image) : item.image}" alt="${item.name}">
                                <div class="checkout-item-details">
                                    <h4>${item.name}</h4>
                                    <p>Quantity: ${item.quantity}</p>
                                    <p>₵${item.price.toLocaleString()} each</p>
                                </div>
                                <div class="checkout-item-total">₵${(item.price * item.quantity).toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="checkout-totals">
                        <div class="checkout-row"><span>Subtotal:</span><span>₵${subtotal.toLocaleString()}</span></div>
                        <div class="checkout-row"><span>Shipping:</span><span>₵${shippingCost.toLocaleString()}</span></div>
                        <div class="checkout-row"><span>Tax (12%):</span><span>₵${tax.toLocaleString()}</span></div>
                        <div class="checkout-row total"><span>Total:</span><span>₵${total.toLocaleString()}</span></div>
                    </div>
                </div>

                <!-- Shipping & Billing -->
                <div class="checkout-section">
                    <h3>Shipping & Billing Information</h3>
                    <form id="checkoutForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName">First Name *</label>
                                <input type="text" id="firstName" required>
                            </div>
                            <div class="form-group">
                                <label for="lastName">Last Name *</label>
                                <input type="text" id="lastName" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="email">Email Address *</label>
                            <input type="email" id="email" required>
                        </div>

                        <div class="form-group">
                            <label for="phone">Phone Number *</label>
                            <input type="tel" id="phone" required>
                        </div>

                        <div class="form-group">
                            <label for="address">Delivery Address *</label>
                            <textarea id="address" rows="3" required placeholder="Enter your full delivery address"></textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="city">City *</label>
                                <input type="text" id="city" required>
                            </div>
                            <div class="form-group">
                                <label for="region">Region *</label>
                                <select id="region" required>
                                    <option value="">Select Region</option>
                                    <option value="greater-accra">Greater Accra</option>
                                    <option value="central">Central</option>
                                    <option value="western">Western</option>
                                    <option value="eastern">Eastern</option>
                                    <option value="volta">Volta</option>
                                    <option value="northern">Northern</option>
                                    <option value="upper-east">Upper East</option>
                                    <option value="upper-west">Upper West</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="paymentMethod">Payment Method *</label>
                            <select id="paymentMethod" required>
                                <option value="">Select Payment Method</option>
                                <option value="card">Credit/Debit Card</option>
                                <option value="mobile-money">Mobile Money</option>
                                <option value="cash">Cash on Delivery</option>
                            </select>
                        </div>

                        <div class="checkout-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.checkout-modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Place Order</button>
                        </div>
                    </form>
                </div>
            </div>

            <button onclick="this.closest('.checkout-modal').remove()" class="modal-close">&times;</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const checkoutForm = modal.querySelector('#checkoutForm');
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        processCheckout(this);
    });
}

function processCheckout(form) {
    const formData = new FormData(form);
    const orderData = {
        customer: {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            region: formData.get('region')
        },
        items: cart,
        paymentMethod: formData.get('paymentMethod'),
        shipping: {
            zone: document.getElementById('shippingZone')?.value || 'accra',
            method: document.querySelector('input[name="shipping"]:checked')?.value || 'standard'
        }
    };

    // Process order
    if (typeof processOrder === 'function') {
        const order = processOrder(orderData);

        if (order) {
            // Clear cart
            clearCart();

            // Show success message and redirect
            showNotification('Order placed successfully!', 'success');

            setTimeout(() => {
                window.location.href = `profile.html#orders`;
            }, 2000);
        }
    }

    // Close modal
    form.closest('.checkout-modal').remove();
}

// Load checkout items into the checkout summary
function loadCheckoutItems() {
    const checkoutItemsContainer = document.getElementById('checkoutItems');
    if (!checkoutItemsContainer) return;

    let html = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        html += `
            <div class="checkout-item">
                <img src="${typeof getFullImageUrl === 'function' ? getFullImageUrl(item.image) : item.image}" alt="${item.name}">
                <div class="checkout-item-details">
                    <h4>${item.name}</h4>
                    <p>Quantity: ${item.quantity}</p>
                    <p>₵${item.price.toLocaleString()} each</p>
                </div>
                <div class="checkout-item-total">₵${itemTotal.toLocaleString()}</div>
            </div>
        `;
    });

    checkoutItemsContainer.innerHTML = html;

    // Update totals
    const shippingCost = 50; // Default shipping
    const tax = subtotal * 0.12;
    const total = subtotal + shippingCost + tax;

    document.getElementById('checkoutSubtotal').textContent = `₵${subtotal.toLocaleString()}`;
    document.getElementById('checkoutShipping').textContent = `₵${shippingCost.toLocaleString()}`;
    document.getElementById('checkoutTax').textContent = `₵${tax.toLocaleString()}`;
    document.getElementById('checkoutTotal').textContent = `₵${total.toLocaleString()}`;
}

// Process checkout order submission
async function processCheckoutOrder(form) {
    try {
        showLoading();

        const formData = new FormData(form);
        const selectedShipping = document.querySelector('input[name="shipping"]:checked');

        // Calculate totals
        const subtotal = getCartTotal();
        const shippingCost = 50; // Default shipping cost
        const tax = subtotal * 0.12;
        const total = subtotal + shippingCost + tax;

        // Prepare order data
        const orderData = {
            products: cart.map(item => ({
                product: item.id,
                quantity: item.quantity
            })),
            total: total,
            customer: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone')
            },
            shipping: {
                address: formData.get('address'),
                city: formData.get('city'),
                region: formData.get('region'),
                zone: formData.get('shippingZone') || 'accra',
                method: selectedShipping ? selectedShipping.value : 'standard'
            },
            paymentMethod: formData.get('paymentMethod')
        };

        console.log('Submitting order:', orderData);

        // Get auth token (optional for guest checkout)
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add authorization header if user is logged in
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Submit order to backend
        const response = await fetch('https://netyarkmall-production.up.railway.app/api/orders', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const order = await response.json();
            console.log('Order created successfully:', order);

            // Clear cart
            clearCart();
            updateCartCount();

            // Show success message
            const isLoggedIn = localStorage.getItem('token') !== null;
            const successMessage = isLoggedIn
                ? 'Order placed successfully! You can track your order in your profile.'
                : 'Order placed successfully! You will receive a confirmation email shortly.';

            showNotification(successMessage, 'success');

            // Redirect based on login status
            setTimeout(() => {
                if (isLoggedIn) {
                    window.location.href = 'profile.html?tab=orders';
                } else {
                    // For guest users, redirect to home with success message
                    window.location.href = 'index.html?order=success';
                }
            }, 3000);

        } else {
            const error = await response.json();
            console.error('Order submission failed:', error);
            showNotification(error.message || 'Failed to place order. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Error processing checkout:', error);
        showNotification('An error occurred while processing your order. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Live Chat Functionality
let chatMessages = [];
let chatNotificationInterval;
let lastChatActivity = Date.now();

function initializeLiveChat() {
    const liveChatIcon = document.getElementById('liveChatIcon');
    const liveChatModal = document.getElementById('liveChatModal');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatNotification = document.getElementById('chatNotification');
    const openChatBtn = document.getElementById('openChatBtn');
    const dismissNotificationBtn = document.getElementById('dismissNotificationBtn');

    if (!liveChatIcon || !liveChatModal) return;

    // Load chat history from localStorage
    loadChatHistory();

    // Chat icon click is now handled in addDragFunctionality to avoid conflicts

    // Close chat modal
    if (chatClose) {
        chatClose.addEventListener('click', function() {
            closeChatModal();
        });
    }

    // Send message on button click
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', function() {
            sendMessage();
        });
    }

    // Send message on Enter key
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Notification buttons
    if (openChatBtn) {
        openChatBtn.addEventListener('click', function() {
            openChatModal();
            hideChatNotification();
        });
    }

    if (dismissNotificationBtn) {
        dismissNotificationBtn.addEventListener('click', function() {
            hideChatNotification();
        });
    }

    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        if (liveChatModal && liveChatModal.classList.contains('show')) {
            if (!liveChatModal.contains(e.target) && !liveChatIcon.contains(e.target)) {
                closeChatModal();
            }
        }
    });

    // Start notification timer
    startChatNotificationTimer();

    // Update chat timestamp
    updateChatTimestamp();

    // Add drag functionality
    addDragFunctionality(liveChatIcon);
}

function toggleChatModal() {
    const liveChatModal = document.getElementById('liveChatModal');
    if (liveChatModal.classList.contains('show')) {
        closeChatModal();
    } else {
        openChatModal();
    }
}

function openChatModal() {
    const liveChatModal = document.getElementById('liveChatModal');
    const chatInput = document.getElementById('chatInput');

    if (liveChatModal) {
        liveChatModal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Focus on input
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 100);
        }

        // Reset notification badge
        resetChatNotificationBadge();

        // Update activity
        lastChatActivity = Date.now();
    }
}

function closeChatModal() {
    const liveChatModal = document.getElementById('liveChatModal');
    if (liveChatModal) {
        liveChatModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (!message) return;

    try {
        // Send message to API
        const response = await fetch('https://netyarkmall-production.up.railway.app/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: 'Customer',
                message: message
            })
        });

        if (response.ok) {
            // Add user message to UI
            addMessage('user', message);
            chatInput.value = '';

            // Update activity
            lastChatActivity = Date.now();

            // Simulate support response after delay (in real implementation, this would come from admin)
            setTimeout(() => {
                const responses = [
                    "Thank you for your message! Our support team will get back to you shortly.",
                    "I understand your concern. Let me connect you with a specialist.",
                    "Thanks for reaching out! How else can I assist you today?",
                    "We're here to help! Is there anything specific you'd like to know about our products?",
                    "Thank you for your patience. A support agent will respond soon.",
                    "I appreciate you contacting us. Let me help you with that.",
                    "Thanks for your message! We're working on getting you a response.",
                    "I see you've reached out. Our team is reviewing your message now."
                ];

                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addMessage('support', randomResponse);
            }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        } else {
            console.error('Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function addMessage(type, content) {
    const chatMessagesContainer = document.getElementById('chatMessages');
    if (!chatMessagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === 'support') {
        messageDiv.innerHTML = `
            <strong>Netyark Support</strong><br>
            ${content}
            <div class="message-time">${timestamp}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            ${content}
            <div class="message-time">${timestamp}</div>
        `;
    }

    chatMessagesContainer.appendChild(messageDiv);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // Save to chat history
    chatMessages.push({
        type: type,
        content: content,
        timestamp: Date.now()
    });
    saveChatHistory();

    // Update timestamp display
    updateChatTimestamp();
}

function updateChatTimestamp() {
    const chatTimestamp = document.getElementById('chatTimestamp');
    if (!chatTimestamp) return;

    if (chatMessages.length === 0) {
        chatTimestamp.textContent = 'Just now';
        return;
    }

    const lastMessage = chatMessages[chatMessages.length - 1];
    const timeDiff = Date.now() - lastMessage.timestamp;
    const minutes = Math.floor(timeDiff / (1000 * 60));

    if (minutes < 1) {
        chatTimestamp.textContent = 'Just now';
    } else if (minutes < 60) {
        chatTimestamp.textContent = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        const hours = Math.floor(minutes / 60);
        chatTimestamp.textContent = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
}

function startChatNotificationTimer() {
    // Show notification every 6-7 minutes (360000-420000 ms)
    function showPeriodicNotification() {
        const timeSinceLastActivity = Date.now() - lastChatActivity;
        const sixMinutes = 6 * 60 * 1000;

        // Only show if user hasn't been active in chat for 6+ minutes
        if (timeSinceLastActivity > sixMinutes) {
            showChatNotification();
        }

        // Schedule next notification (6-7 minutes from now)
        const nextInterval = 360000 + Math.random() * 60000; // 6-7 minutes
        chatNotificationInterval = setTimeout(showPeriodicNotification, nextInterval);
    }

    // Start the cycle
    const initialDelay = 360000 + Math.random() * 60000; // 6-7 minutes
    chatNotificationInterval = setTimeout(showPeriodicNotification, initialDelay);
}

function showChatNotification() {
    const chatNotification = document.getElementById('chatNotification');
    if (!chatNotification) return;

    chatNotification.classList.add('show');

    // Auto-hide after 10 seconds
    setTimeout(() => {
        hideChatNotification();
    }, 10000);
}

function hideChatNotification() {
    const chatNotification = document.getElementById('chatNotification');
    if (chatNotification) {
        chatNotification.classList.remove('show');
    }
}

function resetChatNotificationBadge() {
    const badge = document.getElementById('chatNotificationBadge');
    if (badge) {
        badge.style.display = 'none';
    }
}

function loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        chatMessages = JSON.parse(saved);
        renderChatHistory();
    }
}

function saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(chatMessages.slice(-50))); // Keep last 50 messages
}

function renderChatHistory() {
    const chatMessagesContainer = document.getElementById('chatMessages');
    if (!chatMessagesContainer) return;

    chatMessagesContainer.innerHTML = '';

    // Add welcome message if no history
    if (chatMessages.length === 0) {
        addMessage('support', 'Hi there! 👋 Welcome to Netyark Mall! How can we help you today?');
        return;
    }

    // Render existing messages
    chatMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.type}`;

        const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (msg.type === 'support') {
            messageDiv.innerHTML = `
                <strong>Netyark Support</strong><br>
                ${msg.content}
                <div class="message-time">${timestamp}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                ${msg.content}
                <div class="message-time">${timestamp}</div>
            `;
        }

        chatMessagesContainer.appendChild(messageDiv);
    });

    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// Drag functionality for live chat icon
function addDragFunctionality(element) {
    let isDragging = false;
    let hasDragged = false;
    let startX, startY, initialX, initialY;
    let currentX, currentY;

    // Get initial position
    const rect = element.getBoundingClientRect();
    currentX = rect.left;
    currentY = rect.top;

    // Set initial position
    element.style.position = 'fixed';
    element.style.left = currentX + 'px';
    element.style.top = currentY + 'px';
    element.style.zIndex = '1000';

    // Mouse events
    element.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    // Touch events for mobile
    element.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);

    // Handle click event separately to avoid conflict with drag
    element.addEventListener('click', function(e) {
        // Only toggle modal if we haven't dragged
        if (!hasDragged) {
            toggleChatModal();
        }
        hasDragged = false; // Reset for next interaction
    });

    // Add specific mobile touch handling
    element.addEventListener('touchstart', function(e) {
        // Store the touch start time
        const touchStartTime = Date.now();

        // Store the touch start position
        const touch = e.touches[0];
        const startX = touch.clientX;
        const startY = touch.clientY;

        // Add touchend listener to detect tap vs drag
        const touchEndHandler = function(te) {
            const touchEndTime = Date.now();
            const duration = touchEndTime - touchStartTime;

            // If it's a quick tap (less than 200ms), treat it as a click
            if (duration < 200) {
                const endTouch = te.changedTouches[0];
                const endX = endTouch.clientX;
                const endY = endTouch.clientY;

                // Check if the touch moved significantly
                const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

                // If it didn't move much (less than 10px), treat it as a click
                if (distance < 10) {
                    e.preventDefault();
                    toggleChatModal();
                }
            }

            // Remove the touchend listener
            element.removeEventListener('touchend', touchEndHandler);
        };

        element.addEventListener('touchend', touchEndHandler, { once: true });
    });

    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        hasDragged = false; // Reset drag flag

        // Add dragging class for styling
        element.classList.add('dragging');

        // Get initial mouse/touch position
        if (e.type === 'mousedown') {
            startX = e.clientX;
            startY = e.clientY;
        } else if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }

        // Get current element position
        const rect = element.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
    }

    function drag(e) {
        if (!isDragging) return;

        e.preventDefault();

        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        // Calculate movement
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        // Check if we've moved enough to consider this a drag (prevent accidental drags)
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            hasDragged = true;
        }

        // Calculate new position
        currentX = initialX + deltaX;
        currentY = initialY + deltaY;

        // Constrain to viewport bounds
        const rect = element.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));

        // Apply new position
        element.style.left = currentX + 'px';
        element.style.top = currentY + 'px';
    }

    function stopDrag() {
        if (!isDragging) return;

        isDragging = false;
        element.classList.remove('dragging');

        // Snap to nearest edge for better UX
        snapToEdge();
    }

    function snapToEdge() {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const windowWidth = window.innerWidth;

        // Snap to left or right edge
        if (centerX < windowWidth / 2) {
            currentX = 20; // 20px from left edge
        } else {
            currentX = windowWidth - rect.width - 20; // 20px from right edge
        }

        // Animate to snapped position
        element.style.transition = 'left 0.3s ease';
        element.style.left = currentX + 'px';

        // Remove transition after animation
        setTimeout(() => {
            element.style.transition = '';
        }, 300);
    }
}

// Initialize live chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // ... existing initialization code ...

    // Initialize live chat
    initializeLiveChat();
});

// Test function to verify out-of-stock filtering
function testOutOfStockFiltering() {
    // Create test products
    const testProducts = [
        {
            id: 'test-in-stock',
            name: 'In Stock Product',
            price: 100,
            stockCount: 10,
            inStock: true,
            category: 'test'
        },
        {
            id: 'test-out-of-stock',
            name: 'Out of Stock Product',
            price: 200,
            stockCount: 0,
            inStock: false,
            category: 'test'
        },
        {
            id: 'test-low-stock',
            name: 'Low Stock Product',
            price: 150,
            stockCount: 2,
            inStock: true,
            category: 'test'
        }
    ];

    // Test the filter function
    const filteredProducts = filterInStockProducts(testProducts);

    console.log('Test Results:');
    console.log('Original products:', testProducts.length);
    console.log('Filtered products:', filteredProducts.length);
    console.log('Filtered product names:', filteredProducts.map(p => p.name));

    // Verify results
    const allInStock = filteredProducts.every(p => {
        const stockCount = p.stockCount || p.stock || 0;
        const inStock = p.inStock !== undefined ? p.inStock : stockCount > 0;
        return inStock;
    });

    console.log('All filtered products are in stock:', allInStock);

    return {
        originalCount: testProducts.length,
        filteredCount: filteredProducts.length,
        allInStock: allInStock,
        filteredProductNames: filteredProducts.map(p => p.name)
    };
}

// Test function for refresh button
function testRefreshButton() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        console.log('Refresh button found and initialized');
return true;
    } else {
        console.log('Refresh button not found');
        return false;
    }
}

// Run test on page load
document.addEventListener('DOMContentLoaded', function() {
    if (typeof filterInStockProducts === 'function') {
        const testResults = testOutOfStockFiltering();
        console.log('Out-of-stock filtering test completed:', testResults);
    }

    // Test refresh button
    const refreshTestResult = testRefreshButton();
    console.log('Refresh button test result:', refreshTestResult);
});