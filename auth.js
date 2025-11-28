// Authentication System for Netyark Mall
// Handles user registration, login, logout, and session management

// User data storage keys
const USERS_KEY = 'netyark_users';
const CURRENT_USER_KEY = 'netyark_current_user';

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    updateAuthUI();
});

// Initialize authentication
function initializeAuth() {
    // Create default admin user if no users exist
    const users = getUsers();
    if (users.length === 0) {
        const defaultUser = {
            id: 'user_' + Date.now(),
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@netyarkmall.com',
            phone: '+233123456789',
            password: 'admin123',
            createdAt: new Date().toISOString(),
            orders: [],
            wishlist: [],
            reviews: []
        };
        users.push(defaultUser);
        saveUsers(users);
    }

    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// User data management functions
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;

    const users = getUsers();
    return users.find(user => user.id === userId) || null;
}

function setCurrentUser(userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
}

function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
}

// Authentication functions
function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.querySelector('input[name="remember"]').checked;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        setCurrentUser(user.id);
        showNotification('Login successful! Welcome back.', 'success');

        // Redirect to home page after successful login
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        showNotification('Invalid email or password. Please try again.', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        return;
    }

    const users = getUsers();

    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showNotification('Email already registered. Please use a different email.', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: 'user_' + Date.now(),
        firstName,
        lastName,
        email,
        phone,
        password,
        createdAt: new Date().toISOString(),
        orders: [],
        wishlist: [],
        reviews: []
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser.id);

    showNotification('Registration successful! Welcome to Netyark Mall.', 'success');

    // Redirect to home page after successful registration
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function logout() {
    clearCurrentUser();
    showNotification('You have been logged out successfully.', 'info');

    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Update UI based on authentication status
function updateAuthUI() {
    const currentUser = getCurrentUser();

    // Update navigation
    const navMenus = document.querySelectorAll('.nav-menu');
    navMenus.forEach(navMenu => {
        // Remove existing login/register links
        const existingAuthLinks = navMenu.querySelectorAll('li a[href*="login.html"], li a[href*="register.html"]');
        existingAuthLinks.forEach(link => link.parentElement.remove());

        if (currentUser) {
            // Add user menu
            const userMenu = document.createElement('li');
            userMenu.className = 'dropdown auth-link';
            userMenu.innerHTML = `
                <a href="#" class="nav-link dropdown-toggle">${currentUser.firstName} <i class="fas fa-chevron-down"></i></a>
                <ul class="dropdown-menu">
                    <li><a href="profile.html">My Profile</a></li>
                    <li><a href="orders.html">My Orders</a></li>
                    <li><a href="#" onclick="logout()">Logout</a></li>
                </ul>
            `;
            navMenu.appendChild(userMenu);
        } else {
            // Add login/register links
            const loginLink = document.createElement('li');
            loginLink.className = 'auth-link';
            loginLink.innerHTML = '<a href="login.html" class="nav-link">Login</a>';
            navMenu.appendChild(loginLink);

            const registerLink = document.createElement('li');
            registerLink.className = 'auth-link';
            registerLink.innerHTML = '<a href="register.html" class="nav-link">Register</a>';
            navMenu.appendChild(registerLink);
        }
    });
}

// User profile management
function updateUserProfile(updates) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        saveUsers(users);
        return true;
    }

    return false;
}

function addToWishlist(productId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to add items to your wishlist.', 'info');
        return false;
    }

    if (!currentUser.wishlist.includes(productId)) {
        currentUser.wishlist.push(productId);
        updateUserProfile({ wishlist: currentUser.wishlist });
        showNotification('Added to wishlist!', 'success');
        return true;
    }

    return false;
}

function removeFromWishlist(productId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const index = currentUser.wishlist.indexOf(productId);
    if (index > -1) {
        currentUser.wishlist.splice(index, 1);
        updateUserProfile({ wishlist: currentUser.wishlist });
        showNotification('Removed from wishlist.', 'info');
        return true;
    }

    return false;
}

function isInWishlist(productId) {
    const currentUser = getCurrentUser();
    return currentUser && currentUser.wishlist.includes(productId);
}

function addReview(productId, rating, comment, images = []) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to add a review.', 'info');
        return false;
    }

    const review = {
        id: 'review_' + Date.now(),
        productId,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        rating: parseInt(rating),
        comment,
        images,
        date: new Date().toISOString()
    };

    // Add to user's reviews
    if (!currentUser.reviews) currentUser.reviews = [];
    currentUser.reviews.push(review);
    updateUserProfile({ reviews: currentUser.reviews });

    // Add to product's reviews (this would need to be handled in products.js)
    addProductReview(review);

    showNotification('Review added successfully!', 'success');
    return true;
}

function addOrder(orderData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    // Use the order processing from products.js if available
    let order;
    if (typeof processOrder === 'function') {
        order = processOrder(orderData);
    } else {
        // Fallback order creation
        order = {
            id: 'order_' + Date.now(),
            ...orderData,
            userId: currentUser.id,
            createdAt: new Date().toISOString(),
            status: 'processing'
        };
    }

    if (!currentUser.orders) currentUser.orders = [];
    currentUser.orders.push(order);
    updateUserProfile({ orders: currentUser.orders });

    return order;
}

// Export functions for use in other files
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.isInWishlist = isInWishlist;
window.addReview = addReview;
window.addOrder = addOrder;
window.updateAuthUI = updateAuthUI;