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

    // Profile menu navigation
    const menuLinks = document.querySelectorAll('.profile-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);

            // Hide all sections
            document.querySelectorAll('.profile-section').forEach(section => {
                section.style.display = 'none';
            });

            // Show target section
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.style.display = 'block';
            }

            // Update active menu item
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
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
    document.getElementById('userName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
}

function updateProfile(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phone = document.getElementById('phone').value;

    const updates = { firstName, lastName, phone };

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
    if (!currentUser || !currentUser.orders) return;

    const ordersList = document.getElementById('ordersList');

    if (currentUser.orders.length === 0) {
        ordersList.innerHTML = '<p>You haven\'t placed any orders yet.</p>';
        return;
    }

    let ordersHTML = '<div class="order-history">';

    currentUser.orders.forEach(order => {
        const orderDate = new Date(order.createdAt || order.date).toLocaleDateString();
        const total = order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
        const shippingCost = order.shippingCost || 0;
        const finalTotal = total + shippingCost;

        // Get order tracking info
        const trackingInfo = typeof getOrderStatus === 'function' ?
            getOrderStatus(order.id) : { status: order.status || 'processing', estimatedDelivery: 'TBD' };

        ordersHTML += `
            <div class="order-item" onclick="showOrderDetails('${order.id}')">
                <div class="order-image">
                    <img src="${order.items && order.items[0] ? order.items[0].image : 'https://via.placeholder.com/60x60'}" alt="Order Item">
                </div>
                <div class="order-details">
                    <h4>Order #${order.id.slice(-8)}</h4>
                    <p>${orderDate}</p>
                    <p>${order.items ? order.items.length : 0} items</p>
                    <p class="order-tracking">Tracking: ${trackingInfo.trackingNumber || 'Pending'}</p>
                </div>
                <div class="order-status">
                    <span class="status-${trackingInfo.status}">${trackingInfo.status}</span>
                    <div class="estimated-delivery">Est. delivery: ${trackingInfo.estimatedDelivery}</div>
                </div>
                <div class="order-total">
                    ₵${finalTotal.toLocaleString()}
                </div>
            </div>
        `;
    });

    ordersHTML += '</div>';
    ordersList.innerHTML = ordersHTML;
}

function showOrderDetails(orderId) {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.orders) return;

    const order = currentUser.orders.find(o => o.id === orderId);
    if (!order) return;

    // Get detailed tracking info
    const trackingInfo = typeof getOrderStatus === 'function' ?
        getOrderStatus(orderId) : { status: order.status || 'processing', updates: [] };

    const orderDate = new Date(order.createdAt || order.date).toLocaleDateString();
    const total = order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    const shippingCost = order.shippingCost || 0;
    const finalTotal = total + shippingCost;

    // Create order details modal
    const modal = document.createElement('div');
    modal.className = 'order-details-modal';
    modal.innerHTML = `
        <div class="order-details-content">
            <h2>Order Details - #${orderId.slice(-8)}</h2>

            <div class="order-info-grid">
                <div class="order-info-section">
                    <h3>Order Information</h3>
                    <div class="info-row"><strong>Order Date:</strong> ${orderDate}</div>
                    <div class="info-row"><strong>Status:</strong> <span class="status-${trackingInfo.status}">${trackingInfo.status}</span></div>
                    <div class="info-row"><strong>Tracking Number:</strong> ${trackingInfo.trackingNumber || 'Not available'}</div>
                    <div class="info-row"><strong>Estimated Delivery:</strong> ${trackingInfo.estimatedDelivery}</div>
                </div>

                <div class="order-info-section">
                    <h3>Shipping Address</h3>
                    <div class="address-display">
                        ${order.customer ? `
                            <div>${order.customer.firstName} ${order.customer.lastName}</div>
                            <div>${order.customer.address}</div>
                            <div>${order.customer.city}, ${order.customer.region}</div>
                            <div>${order.customer.phone}</div>
                            <div>${order.customer.email}</div>
                        ` : 'Address not available'}
                    </div>
                </div>
            </div>

            <div class="order-items-section">
                <h3>Order Items</h3>
                <div class="order-items-list">
                    ${order.items ? order.items.map(item => `
                        <div class="order-item-detail">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="item-info">
                                <h4>${item.name}</h4>
                                <p>Quantity: ${item.quantity}</p>
                                <p>Price: ₵${item.price.toLocaleString()} each</p>
                            </div>
                            <div class="item-total">₵${(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                    `).join('') : 'No items found'}
                </div>
            </div>

            <div class="order-summary-section">
                <h3>Order Summary</h3>
                <div class="order-summary-details">
                    <div class="summary-row"><span>Subtotal:</span><span>₵${total.toLocaleString()}</span></div>
                    <div class="summary-row"><span>Shipping:</span><span>₵${shippingCost.toLocaleString()}</span></div>
                    <div class="summary-row total"><span>Total:</span><span>₵${finalTotal.toLocaleString()}</span></div>
                </div>
            </div>

            ${trackingInfo.updates && trackingInfo.updates.length > 0 ? `
                <div class="order-tracking-section">
                    <h3>Order Tracking</h3>
                    <div class="tracking-timeline">
                        ${trackingInfo.updates.map(update => `
                            <div class="tracking-step ${update.status === trackingInfo.status ? 'active' : 'completed'}">
                                <div class="tracking-icon">
                                    <i class="fas fa-${getTrackingIcon(update.status)}"></i>
                                </div>
                                <div class="tracking-info">
                                    <h4>${update.status.charAt(0).toUpperCase() + update.status.slice(1)}</h4>
                                    <p>${update.message}</p>
                                    <small>${new Date(update.timestamp).toLocaleString()}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="order-actions">
                <button onclick="this.closest('.order-details-modal').remove()" class="btn btn-outline">Close</button>
                ${trackingInfo.status === 'delivered' ? '<button class="btn btn-primary">Write Review</button>' : ''}
                ${['processing', 'shipped'].includes(trackingInfo.status) ? '<button class="btn btn-outline">Cancel Order</button>' : ''}
            </div>

            <button onclick="this.closest('.order-details-modal').remove()" class="modal-close">&times;</button>
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
    if (!currentUser || !currentUser.wishlist) return;

    const wishlistGrid = document.getElementById('wishlistGrid');

    if (currentUser.wishlist.length === 0) {
        wishlistGrid.innerHTML = '<p>Your wishlist is empty.</p>';
        return;
    }

    let wishlistHTML = '';

    currentUser.wishlist.forEach(productId => {
        const product = getProductById(productId);
        if (product) {
            wishlistHTML += createWishlistCard(product);
        }
    });

    wishlistGrid.innerHTML = wishlistHTML;
}

function createWishlistCard(product) {
    const discount = product.originalPrice > product.price ?
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    return `
        <div class="product-card" data-product-id="${product.id}">
            ${product.isNew ? '<div class="product-badge new">New</div>' : ''}
            ${discount > 0 ? `<div class="product-badge discount">-${discount}%</div>` : ''}
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <div class="product-overlay">
                    <button class="quick-view-btn" onclick="viewProductDetails('${product.id}')">Quick View</button>
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
            <button class="wishlist-btn in-wishlist" onclick="removeFromWishlist('${product.id}'); loadUserWishlist();">
                <i class="fas fa-heart"></i>
            </button>
        </div>
    `;
}

function loadUserReviews() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.reviews) return;

    const reviewsList = document.getElementById('reviewsList');

    if (currentUser.reviews.length === 0) {
        reviewsList.innerHTML = '<p>You haven\'t written any reviews yet.</p>';
        return;
    }

    let reviewsHTML = '';

    currentUser.reviews.forEach(review => {
        const reviewDate = new Date(review.date).toLocaleDateString();
        const product = getProductById(review.productId);

        reviewsHTML += `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}
                        </div>
                        <div>
                            <strong>${review.userName}</strong>
                            <div class="review-rating">
                                ${generateStarRating(review.rating)}
                            </div>
                        </div>
                    </div>
                    <div class="review-date">${reviewDate}</div>
                </div>
                <div class="review-content">
                    <p>${review.comment}</p>
                    ${review.images && review.images.length > 0 ?
                        `<div class="review-images">
                            ${review.images.map(img => `<img src="${img}" alt="Review image">`).join('')}
                        </div>` : ''}
                </div>
                ${product ? `<p><em>Review for: ${product.name}</em></p>` : ''}
            </div>
        `;
    });

    reviewsList.innerHTML = reviewsHTML;
}

function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const users = JSON.parse(localStorage.getItem('netyark_users') || '[]');
    const updatedUsers = users.filter(u => u.id !== currentUser.id);

    localStorage.setItem('netyark_users', JSON.stringify(updatedUsers));
    localStorage.removeItem('netyark_current_user');

    showNotification('Account deleted successfully.', 'info');

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Export functions for use in HTML
window.loadUserProfile = loadUserProfile;
window.loadUserOrders = loadUserOrders;
window.loadUserWishlist = loadUserWishlist;
window.loadUserReviews = loadUserReviews;