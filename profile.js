// Profile Page JavaScript
// Handles user profile management, orders, wishlist, and reviews

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    initializeProfile();
});

function initializeProfile() {
    loadUserProfile();
    loadUserOrders();
    loadUserWishlist();
    loadUserReviews();
    updateProfileStats();

    // Profile form handling
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    // Password form handling
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', changePassword);
    }

    // Profile tab navigation
    setupProfileTabs();
}

// Tab Navigation
function setupProfileTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show target content
            document.querySelectorAll('.profile-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function loadUserProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Populate profile form
    document.getElementById('firstName').value = currentUser.firstName || '';
    document.getElementById('lastName').value = currentUser.lastName || '';
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('phone').value = currentUser.phone || '';

    // Update profile display
    document.getElementById('userName').textContent = currentUser.firstName + ' ' + currentUser.lastName;
    document.getElementById('userNameLarge').textContent = currentUser.firstName + ' ' + currentUser.lastName;
    document.getElementById('userEmail').textContent = currentUser.email || '';
    
    // Update avatar
    const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.firstName) + '+' + encodeURIComponent(currentUser.lastName) + '&background=008000&color=fff&size=150';
    document.getElementById('profileAvatarLarge').src = avatarUrl;
}

function updateProfileStats() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const orderCount = currentUser.orders ? currentUser.orders.length : 0;
    const wishlistCount = currentUser.wishlist ? currentUser.wishlist.length : 0;
    const reviewCount = currentUser.reviews ? currentUser.reviews.length : 0;

    document.getElementById('orderCount').textContent = orderCount;
    document.getElementById('wishlistCount').textContent = wishlistCount;
    document.getElementById('reviewCount').textContent = reviewCount;
    
    const wishlistBadge = document.getElementById('wishlistBadge');
    if (wishlistBadge) {
        wishlistBadge.textContent = wishlistCount + ' Items';
    }
}

function updateProfile(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phone = document.getElementById('phone').value;

    const updates = { firstName: firstName, lastName: lastName, phone: phone };

    if (updateUserProfile(updates)) {
        showNotification('Profile updated successfully!', 'success');
        loadUserProfile(); // Refresh display
        updateAuthUI(); // Update header
    } else {
        showNotification('Failed to update profile.', 'error');
    }
}

function changePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Verify current password
    if (currentUser.password !== currentPassword) {
        showNotification('Current password is incorrect.', 'error');
        return;
    }

    // Verify new passwords match
    if (newPassword !== confirmNewPassword) {
        showNotification('New passwords do not match.', 'error');
        return;
    }

    // Verify new password is different
    if (newPassword === currentPassword) {
        showNotification('New password must be different from current password.', 'error');
        return;
    }

    // Update password
    if (updateUserProfile({ password: newPassword })) {
        showNotification('Password changed successfully!', 'success');
        document.getElementById('passwordForm').reset();
    } else {
        showNotification('Failed to change password.', 'error');
    }
}

function loadUserOrders() {
    const currentUser = getCurrentUser();
    const ordersList = document.getElementById('ordersList');

    if (!currentUser || !currentUser.orders || currentUser.orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No Orders Yet</h3><p>You haven\'t placed any orders yet. Start shopping to see your orders here!</p><a href="categories.html" class="btn btn-primary"><i class="fas fa-shopping-cart"></i> Start Shopping</a></div>';
        return;
    }

    let ordersHTML = '<div class="orders-list-container">';

    currentUser.orders.forEach(function(order) {
        const orderDate = new Date(order.createdAt || order.date).toLocaleDateString();
        const total = order.items ? order.items.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0) : 0;
        const shippingCost = order.shippingCost || 0;
        const finalTotal = total + shippingCost;

        // Get order tracking info
        const trackingInfo = typeof getOrderStatus === 'function' ? getOrderStatus(order.id) : { status: order.status || 'processing', estimatedDelivery: 'TBD' };

        const statusClass = trackingInfo.status || 'processing';
        const statusText = (trackingInfo.status || 'processing').charAt(0).toUpperCase() + (trackingInfo.status || 'processing').slice(1);
        const orderImage = order.items && order.items[0] ? order.items[0].image : 'https://via.placeholder.com/80x80';
        const orderId = order.id.slice(-8);

        ordersHTML += '<div class="order-card" onclick="showOrderDetails(\'' + order.id + '\')">';
        ordersHTML += '<img src="' + orderImage + '" alt="Order Item" class="order-card-image">';
        ordersHTML += '<div class="order-card-info">';
        ordersHTML += '<h4>Order #' + orderId + '</h4>';
        ordersHTML += '<p><i class="fas fa-calendar"></i> ' + orderDate + '</p>';
        ordersHTML += '<p><i class="fas fa-box"></i> ' + (order.items ? order.items.length : 0) + ' item(s)</p>';
        ordersHTML += '</div>';
        ordersHTML += '<div class="order-card-status">';
        ordersHTML += '<span class="status-badge status-' + statusClass + '">' + statusText + '</span>';
        ordersHTML += '<div class="order-card-total">GH₵' + finalTotal.toLocaleString() + '</div>';
        ordersHTML += '</div>';
        ordersHTML += '</div>';
    });

    ordersHTML += '</div>';
    ordersList.innerHTML = ordersHTML;
}

function showOrderDetails(orderId) {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.orders) return;

    const order = currentUser.orders.find(function(o) { return o.id === orderId; });
    if (!order) return;

    // Get detailed tracking info
    const trackingInfo = typeof getOrderStatus === 'function' ? getOrderStatus(orderId) : { status: order.status || 'processing', updates: [] };

    const orderDate = new Date(order.createdAt || order.date).toLocaleDateString();
    const total = order.items ? order.items.reduce(function(sum, item) { return sum + (item.price * item.quantity); }, 0) : 0;
    const shippingCost = order.shippingCost || 0;
    const finalTotal = total + shippingCost;

    // Create order details modal
    const modal = document.createElement('div');
    modal.className = 'order-details-modal';
    modal.innerHTML = '<div class="order-details-content">' +
        '<h2>Order Details - #' + orderId.slice(-8) + '</h2>' +
        '<div class="order-info-grid">' +
        '<div class="order-info-section">' +
        '<h3>Order Information</h3>' +
        '<div class="info-row"><strong>Order Date:</strong> ' + orderDate + '</div>' +
        '<div class="info-row"><strong>Status:</strong> <span class="status-' + trackingInfo.status + '">' + trackingInfo.status + '</span></div>' +
        '<div class="info-row"><strong>Tracking Number:</strong> ' + (trackingInfo.trackingNumber || 'Not available') + '</div>' +
        '<div class="info-row"><strong>Estimated Delivery:</strong> ' + trackingInfo.estimatedDelivery + '</div>' +
        '</div>' +
        '<div class="order-info-section">' +
        '<h3>Shipping Address</h3>' +
        '<div class="address-display">' +
        (order.customer ? '<div>' + order.customer.firstName + ' ' + order.customer.lastName + '</div>' +
        '<div>' + order.customer.address + '</div>' +
        '<div>' + order.customer.city + ', ' + order.customer.region + '</div>' +
        '<div>' + order.customer.phone + '</div>' +
        '<div>' + order.customer.email + '</div>' : 'Address not available') +
        '</div></div></div>' +
        '<div class="order-items-section"><h3>Order Items</h3><div class="order-items-list">' +
        (order.items ? order.items.map(function(item) {
            return '<div class="order-item-detail">' +
            '<img src="' + item.image + '" alt="' + item.name + '">' +
            '<div class="item-info"><h4>' + item.name + '</h4>' +
            '<p>Quantity: ' + item.quantity + '</p>' +
            '<p>Price: GH₵' + item.price.toLocaleString() + ' each</p></div>' +
            '<div class="item-total">GH₵' + (item.price * item.quantity).toLocaleString() + '</div></div>';
        }).join('') : 'No items found') +
        '</div></div>' +
        '<div class="order-summary-section"><h3>Order Summary</h3><div class="order-summary-details">' +
        '<div class="summary-row"><span>Subtotal:</span><span>GH₵' + total.toLocaleString() + '</span></div>' +
        '<div class="summary-row"><span>Shipping:</span><span>GH₵' + shippingCost.toLocaleString() + '</span></div>' +
        '<div class="summary-row total"><span>Total:</span><span>GH₵' + finalTotal.toLocaleString() + '</span></div></div></div>' +
        (trackingInfo.updates && trackingInfo.updates.length > 0 ? '<div class="order-tracking-section"><h3>Order Tracking</h3><div class="tracking-timeline">' +
        trackingInfo.updates.map(function(update) {
            return '<div class="tracking-step ' + (update.status === trackingInfo.status ? 'active' : 'completed') + '">' +
            '<div class="tracking-icon"><i class="fas fa-' + getTrackingIcon(update.status) + '"></i></div>' +
            '<div class="tracking-info"><h4>' + update.status.charAt(0).toUpperCase() + update.status.slice(1) + '</h4>' +
            '<p>' + update.message + '</p><small>' + new Date(update.timestamp).toLocaleString() + '</small></div></div>';
        }).join('') + '</div></div>' : '') +
        '<div class="order-actions">' +
        '<button onclick="this.closest(\'.order-details-modal\').remove()" class="btn btn-outline">Close</button>' +
        (trackingInfo.status === 'delivered' ? '<button class="btn btn-primary">Write Review</button>' : '') +
        (['processing', 'shipped'].includes(trackingInfo.status) ? '<button class="btn btn-outline">Cancel Order</button>' : '') +
        '</div>' +
        '<button onclick="this.closest(\'.order-details-modal\').remove()" class="modal-close">&times;</button></div>';

    document.body.appendChild(modal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function getTrackingIcon(status) {
    const icons = {
        'processing': 'cog',
        'shipped': 'truck',
        'delivered': 'box-open',
        'cancelled': 'times-circle'
    };
    return icons[status] || 'question-circle';
}

function loadUserWishlist() {
    const currentUser = getCurrentUser();
    const wishlistGrid = document.getElementById('wishlistGrid');

    if (!currentUser || !currentUser.wishlist || currentUser.wishlist.length === 0) {
        wishlistGrid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-heart"></i><h3>Your Wishlist is Empty</h3><p>Save items you love to your wishlist and they\'ll appear here!</p><a href="categories.html" class="btn btn-primary"><i class="fas fa-compass"></i> Explore Products</a></div>';
        updateProfileStats();
        return;
    }

    let wishlistHTML = '';
    let hasItems = false;

    currentUser.wishlist.forEach(function(productId) {
        const product = getProductById(productId);
        if (product) {
            hasItems = true;
            wishlistHTML += createWishlistCard(product);
        }
    });

    if (!hasItems) {
        wishlistHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-heart-broken"></i><h3>Some items are no longer available</h3><p>Items that were removed from the store have been cleaned up from your wishlist.</p><a href="categories.html" class="btn btn-primary"><i class="fas fa-compass"></i> Explore Products</a></div>';
    }

    wishlistGrid.innerHTML = wishlistHTML;
    updateProfileStats();
}

function createWishlistCard(product) {
    const discount = product.originalPrice > product.price ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const isNew = product.isNew || false;

    let badges = '';
    if (isNew) {
        badges += '<div class="product-badge new">New</div>';
    }
    if (discount > 0) {
        badges += '<div class="product-badge discount">-' + discount + '%</div>';
    }

    const overlayButtons = '<button class="quick-view-btn" onclick="viewProductDetails(\'' + product.id + '\')">Quick View</button>' +
        '<button class="add-to-cart-btn" onclick="addToCart(\'' + product.id + '\')"><i class="fas fa-shopping-cart"></i> Add to Cart</button>';

    const originalPriceHtml = product.originalPrice > product.price ? '<span class="original-price">GH₵' + product.originalPrice.toLocaleString() + '</span>' : '';

    return '<div class="product-card" data-product-id="' + product.id + '">' +
        badges +
        '<div class="product-image">' +
        '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy">' +
        '<div class="product-overlay">' + overlayButtons + '</div>' +
        '</div>' +
        '<div class="product-info">' +
        '<h3 class="product-title">' + product.name + '</h3>' +
        '<div class="product-rating"><div class="stars">' + generateStarRating(product.rating) + '</div>' +
        '<span class="rating-text">' + product.rating + ' (' + product.reviews + ')</span></div>' +
        '<div class="product-price"><span class="current-price">GH₵' + product.price.toLocaleString() + '</span>' + originalPriceHtml + '</div>' +
        '</div>' +
        '<button class="wishlist-btn in-wishlist" onclick="removeFromWishlist(\'' + product.id + '\'); loadUserWishlist();"><i class="fas fa-heart"></i></button>' +
        '</div>';
}

function loadUserReviews() {
    const currentUser = getCurrentUser();
    const reviewsList = document.getElementById('reviewsList');

    if (!currentUser || !currentUser.reviews || currentUser.reviews.length === 0) {
        reviewsList.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><h3>No Reviews Yet</h3><p>You haven\'t written any reviews yet. Share your thoughts on products you\'ve purchased!</p><a href="categories.html" class="btn btn-primary"><i class="fas fa-shopping-bag"></i> Browse Products</a></div>';
        return;
    }

    let reviewsHTML = '<div class="reviews-list-container">';

    currentUser.reviews.forEach(function(review) {
        const reviewDate = new Date(review.date).toLocaleDateString();
        const product = getProductById(review.productId);
        const productName = product ? product.name : 'Product';
        const productImage = product ? product.image : 'https://via.placeholder.com/60x60';
        
        let imagesHtml = '';
        if (review.images && review.images.length > 0) {
            imagesHtml = '<div class="review-images">';
            review.images.forEach(function(img) {
                imagesHtml += '<img src="' + img + '" alt="Review image">';
            });
            imagesHtml += '</div>';
        }

        reviewsHTML += '<div class="review-card">' +
            '<div class="review-card-header">' +
            '<div class="review-product-info">' +
            '<img src="' + productImage + '" alt="' + productName + '" class="review-product-image">' +
            '<div><div class="review-product-name">' + productName + '</div>' +
            '<div class="review-rating">' + generateStarRating(review.rating) + '</div></div></div>' +
            '<div class="review-date">' + reviewDate + '</div></div>' +
            '<div class="review-content"><p>' + review.comment + '</p></div>' +
            imagesHtml + '</div>';
    });

    reviewsHTML += '</div>';
    reviewsList.innerHTML = reviewsHTML;
}

function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.')) {
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Double confirmation
    if (!confirm('This is your last chance! Do you really want to delete your account?')) {
        return;
    }

    const users = JSON.parse(localStorage.getItem('netyark_users') || '[]');
    const updatedUsers = users.filter(function(u) { return u.id !== currentUser.id; });

    localStorage.setItem('netyark_users', JSON.stringify(updatedUsers));
    localStorage.removeItem('netyark_current_user');

    showNotification('Account deleted successfully.', 'info');

    setTimeout(function() {
        window.location.href = 'index.html';
    }, 1500);
}

// Password visibility toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('netyark_current_user');
        showNotification('Logged out successfully.', 'info');
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Export functions for use in HTML
window.loadUserProfile = loadUserProfile;
window.loadUserOrders = loadUserOrders;
window.loadUserWishlist = loadUserWishlist;
window.loadUserReviews = loadUserReviews;
window.showOrderDetails = showOrderDetails;
window.deleteAccount = deleteAccount;
window.logout = logout;
window.togglePassword = togglePassword;
