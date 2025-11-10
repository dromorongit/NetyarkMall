// Main JavaScript file for Netyark Mall E-commerce Website

// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentSlide = 0;
let slideInterval;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
    initializeNavigation();
    initializeCarousel();
    initializePageSpecific();
    updateCartCount();
    
    // Check which page we're on and initialize accordingly
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'index.html':
        case '':
            initializeHomePage();
            break;
        case 'categories.html':
            initializeCategoriesPage();
            break;
        case 'deals.html':
            initializeDealsPage();
            break;
        case 'cart.html':
            initializeCartPage();
            break;
        case 'contact.html':
            initializeContactPage();
            break;
    }
});

// Cart Management
function initializeCart() {
    updateCartCount();
}

function addToCart(productId, quantity = 1) {
    const product = getProductById(productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }

    saveCart();
    updateCartCount();
    showNotification(`${product.name} added to cart!`, 'success');
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
    const cartCountElements = document.querySelectorAll('#cartCount');
    cartCountElements.forEach(element => {
        element.textContent = getCartItemCount();
    });
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartItemCountElement = document.getElementById('cartItemCount');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');
    
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
            if (taxElement) taxElement.textContent = '₵0.00';
            if (totalElement) totalElement.textContent = '₵50.00';
        } else {
            let cartHTML = '';
            cart.forEach(item => {
                cartHTML += `
                    <div class="cart-item" data-product-id="${item.id}">
                        <div class="item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="item-details">
                            <h3>${item.name}</h3>
                            <p class="item-price">₵${item.price.toLocaleString()}</p>
                        </div>
                        <div class="item-quantity">
                            <button class="quantity-btn decrease" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
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
            
            // Update pricing
            const subtotal = getCartTotal();
            const tax = subtotal * 0.12; // 12% tax
            const total = subtotal + tax + 50; // + shipping
            
            if (subtotalElement) subtotalElement.textContent = `₵${subtotal.toLocaleString()}`;
            if (taxElement) taxElement.textContent = `₵${tax.toLocaleString()}`;
            if (totalElement) totalElement.textContent = `₵${total.toLocaleString()}`;
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
function loadNewArrivals() {
    console.log('Loading new arrivals...');
    const container = document.getElementById('newArrivals');
    if (!container) {
        console.error('newArrivals container not found');
        return;
    }

    const newArrivals = getNewArrivals().slice(0, 8);
    console.log('New arrivals products:', newArrivals);
    container.innerHTML = newArrivals.map(product => createProductCard(product)).join('');
    console.log('New arrivals loaded successfully');
}

function loadFastSellingItems() {
    console.log('Loading fast selling items...');
    const container = document.getElementById('fastSelling');
    if (!container) {
        console.error('fastSelling container not found');
        return;
    }

    const fastSelling = getFastSellingItems().slice(0, 8);
    console.log('Fast selling products:', fastSelling);
    container.innerHTML = fastSelling.map(product => createProductCard(product)).join('');
    console.log('Fast selling items loaded successfully');
}

function loadCategoryHighlights() {
    console.log('Loading category highlights...');
    const container = document.getElementById('categoryGrid');
    if (!container) {
        console.error('categoryGrid container not found');
        return;
    }

    const categories = getCategoryData().slice(0, 6);
    console.log('Categories data:', categories);
    container.innerHTML = categories.map(category => createCategoryCard(category)).join('');
    console.log('Category highlights loaded successfully');
}

function loadFeaturedDeals() {
    const container = document.getElementById('featuredDeals');
    if (!container) return;

    const deals = getAllProducts()
        .filter(product => product.originalPrice > product.price)
        .slice(0, 3);
    
    container.innerHTML = deals.map(product => createDealCard(product)).join('');
}

function loadSuggestedProducts() {
    const container = document.getElementById('suggestedProducts');
    if (!container) return;

    const currentProductIds = cart.map(item => item.id);
    const suggestions = getSuggestedProducts(currentProductIds);
    container.innerHTML = suggestions.map(product => createProductCard(product)).join('');
}

// Create HTML elements
function createProductCard(product) {
    const discount = product.originalPrice > product.price ? 
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            ${product.isNew ? '<div class="product-badge new">New</div>' : ''}
            ${discount > 0 ? `<div class="product-badge discount">-${discount}%</div>` : ''}
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="product-overlay">
                    <button class="quick-view-btn" onclick="quickView('${product.id}')">Quick View</button>
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-rating">
                    <div class="stars">
                        ${generateStarRating(product.rating)}
                    </div>
                    <span class="rating-text">${product.rating} (${product.reviews})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">₵${product.price.toLocaleString()}</span>
                    ${product.originalPrice > product.price ? 
                        `<span class="original-price">₵${product.originalPrice.toLocaleString()}</span>` : ''}
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

function createDealCard(product) {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    
    return `
        <div class="deal-card" data-product-id="${product.id}">
            <div class="deal-badge">${discount}% OFF</div>
            <div class="deal-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
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
    window.location.href = `categories.html#${categoryId}`;
}

function quickView(productId) {
    const product = getProductById(productId);
    if (product) {
        alert(`Quick View: ${product.name}\n\n${product.description}\n\nPrice: ₵${product.price.toLocaleString()}`);
    }
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
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Simulate form submission
            showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
            this.reset();
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

// Export functions for use in HTML
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.navigateToCategory = navigateToCategory;
window.quickView = quickView;