// Profile Page JavaScript
// Handles user profile management, orders, wishlist, and reviews

// API_BASE is defined in products.js

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    initializeProfile();
});

let orderPollingInterval = null;

async function initializeProfile() {
    // Load user data from backend
    await loadUserProfileFromBackend();
    
    // Load user data
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

    // Avatar upload handling
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', handleAvatarUpload);
    }

    // Profile tab navigation
    setupProfileTabs();
    
    // Start polling for order updates when on orders tab
    startOrderPolling();
}

// Start polling for order updates
function startOrderPolling() {
    // Refresh orders every 5 seconds when on orders tab
    orderPollingInterval = setInterval(async () => {
        const activeTab = document.querySelector('.profile-tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'orders') {
            await loadUserOrders();
        }
    }, 5000);
}

// Stop polling when leaving orders tab
function stopOrderPolling() {
    if (orderPollingInterval) {
        clearInterval(orderPollingInterval);
        orderPollingInterval = null;
    }
}

// Tab Navigation with polling control
function setupProfileTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Stop polling when leaving orders tab
            const currentActiveTab = document.querySelector('.profile-tab.active');
            if (currentActiveTab && currentActiveTab.getAttribute('data-tab') === 'orders' && targetTab !== 'orders') {
                stopOrderPolling();
            }
            
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
            
            // Start polling when entering orders tab
            if (targetTab === 'orders') {
                loadUserOrders();
                startOrderPolling();
            }
        });
    });
}

// Load user profile from backend API
async function loadUserProfileFromBackend() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;

        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const backendUser = await response.json();
            // Convert and store user data
            const frontendUser = convertUserFromBackend(backendUser);
            setCurrentUser(frontendUser);
            
            // Also store for admin system compatibility
            localStorage.setItem('user', JSON.stringify(backendUser));
            return true;
        }
    } catch (error) {
        console.error('Error loading profile from backend:', error);
    }
    return false;
}

function loadUserProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Populate profile form
    document.getElementById('firstName').value = currentUser.firstName || '';
    document.getElementById('lastName').value = currentUser.lastName || '';
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('phone').value = currentUser.phone || '';

    // Update profile display
    const fullName = (currentUser.firstName || '') + ' ' + (currentUser.lastName || '');
    document.getElementById('userNameLarge').textContent = fullName.trim();
    document.getElementById('userEmail').textContent = currentUser.email || '';
    
    // Update avatar - use profilePicture from backend if available
    const avatarImg = document.getElementById('profileAvatarLarge');
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const backendUser = JSON.parse(storedUser);
        if (backendUser.profilePicture) {
            avatarImg.src = backendUser.profilePicture;
        } else {
            const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName.trim()) + '&background=008000&color=fff&size=150';
            avatarImg.src = avatarUrl;
        }
    } else {
        const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName.trim()) + '&background=008000&color=fff&size=150';
        avatarImg.src = avatarUrl;
    }
}

// Handle profile picture upload
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please select a valid image file (JPEG, PNG, GIF, or WebP).', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image file size must be less than 5MB.', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('profilePicture', file);

        showNotification('Uploading profile picture...', 'info');

        const response = await fetch(`${API_BASE}/auth/profile/picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            
            // Update avatar display
            document.getElementById('profileAvatarLarge').src = data.profilePicture;
            
            // Update stored user data
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const backendUser = JSON.parse(storedUser);
                backendUser.profilePicture = data.profilePicture;
                localStorage.setItem('user', JSON.stringify(backendUser));
            }
            
            showNotification('Profile picture updated successfully!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to upload profile picture.', 'error');
        }
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showNotification('Failed to upload profile picture. Please try again.', 'error');
    }
    
    // Reset file input
    event.target.value = '';
}

async function updateProfileStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch orders count
        const ordersResponse = await fetch(`${API_BASE}/orders/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        let orderCount = 0;
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            orderCount = orders.length;
        }

        // Update stats display
        document.getElementById('orderCount').textContent = orderCount;
        
        // Get wishlist count from user data
        const currentUser = getCurrentUser();
        const wishlistCount = currentUser && currentUser.wishlist ? currentUser.wishlist.length : 0;
        document.getElementById('wishlistCount').textContent = wishlistCount;
        
        // Get reviews count from user data
        const reviewsCount = currentUser && currentUser.reviews ? currentUser.reviews.length : 0;
        document.getElementById('reviewCount').textContent = reviewsCount;
        
        const wishlistBadge = document.getElementById('wishlistBadge');
        if (wishlistBadge) {
            wishlistBadge.textContent = `${wishlistCount} Items`;
        }
    } catch (error) {
        console.error('Error updating profile stats:', error);
    }
}

async function updateProfile(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!firstName || !lastName) {
        showNotification('Please enter your full name.', 'error');
        return;
    }

    if (!phone) {
        showNotification('Please enter your phone number.', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                phone: phone
            })
        });

        if (response.ok) {
            const updatedUser = await response.json();
            
            // Update local storage with new user data
            const fullName = `${firstName} ${lastName}`.trim();
            const frontendUser = {
                ...getCurrentUser(),
                firstName: firstName,
                lastName: lastName,
                name: fullName,
                phone: phone
            };
            setCurrentUser(frontendUser);
            
            // Also update admin system user data
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const backendUser = JSON.parse(storedUser);
                backendUser.name = fullName;
                backendUser.firstName = firstName;
                backendUser.lastName = lastName;
                backendUser.phone = phone;
                localStorage.setItem('user', JSON.stringify(backendUser));
            }
            
            // Update display
            loadUserProfile();
            updateAuthUI();
            
            showNotification('Profile updated successfully!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to update profile.', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile. Please try again.', 'error');
    }
}

async function changePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

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

    // Verify password length
    if (newPassword.length < 6) {
        showNotification('New password must be at least 6 characters long.', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/auth/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                currentPassword: currentPassword, 
                newPassword: newPassword 
            })
        });

        if (response.ok) {
            showNotification('Password changed successfully!', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to change password.', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Failed to change password.', 'error');
    }
}

async function loadUserOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    // Show loading state
    ordersList.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading your orders...</p></div>';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            ordersList.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No Orders Yet</h3><p>You haven\'t placed any orders yet. Start shopping to see your orders here!</p><a href="categories.html" class="btn btn-primary"><i class="fas fa-shopping-cart"></i> Start Shopping</a></div>';
            return;
        }

        const response = await fetch(`${API_BASE}/orders/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        const orders = await response.json();

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No Orders Yet</h3><p>You haven\'t placed any orders yet. Start shopping to see your orders here!</p><a href="categories.html" class="btn btn-primary"><i class="fas fa-shopping-cart"></i> Start Shopping</a></div>';
            return;
        }

        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        let ordersHTML = `
            <div class="orders-header">
                <h3>Your Orders (${orders.length})</h3>
                <button class="btn btn-outline btn-sm" onclick="loadUserOrders()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            <div class="orders-list-container">
        `;

        orders.forEach(function(order) {
            const orderDate = new Date(order.createdAt || order.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const orderTime = new Date(order.createdAt || order.date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const status = order.status || 'pending';
            const paymentStatus = order.paymentStatus || 'pending';
            const orderId = order._id || order.id;
            const shortOrderId = orderId.slice(-8);
            const itemCount = order.products ? order.products.length : 0;
            
            // Get status badge class
            const statusClass = {
                'pending': 'status-pending',
                'processing': 'status-processing',
                'shipped': 'status-shipped',
                'delivered': 'status-delivered',
                'cancelled': 'status-cancelled'
            }[status] || 'status-pending';

            ordersHTML += `
                <div class="order-card" onclick="showOrderDetails('${orderId}')">
                    <div class="order-card-header">
                        <div class="order-id">
                            <i class="fas fa-receipt"></i>
                            <span>Order #${shortOrderId}</span>
                        </div>
                        <div class="order-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${orderDate} at ${orderTime}
                        </div>
                    </div>
                    <div class="order-card-body">
                        <div class="order-items-preview">
                            <i class="fas fa-box"></i>
                            ${itemCount} item(s)
                        </div>
                        <div class="order-card-status">
                            <span class="status-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                            <span class="payment-badge ${paymentStatus === 'paid' ? 'payment-paid' : 'payment-pending'}">
                                ${paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                            </span>
                        </div>
                        <div class="order-card-total">
                            <span class="total-label">Total:</span>
                            <span class="total-amount">GH₵${(order.total || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="order-card-actions">
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); showOrderDetails('${orderId}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${status === 'delivered' ? `
                            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); alert('Review feature coming soon!')">
                                <i class="fas fa-star"></i> Write Review
                            </button>
                        ` : ''}
                        ${['pending', 'processing'].includes(status) ? `
                            <button class="btn btn-outline-danger btn-sm" onclick="event.stopPropagation(); cancelOrder('${orderId}')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        ordersHTML += '</div>';
        ordersList.innerHTML = ordersHTML;
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Unable to Load Orders</h3>
                <p>We couldn\'t load your orders. Please try again.</p>
                <button class="btn btn-primary" onclick="loadUserOrders()">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Cancel order function
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'cancelled' })
        });

        if (response.ok) {
            showNotification('Order cancelled successfully!', 'success');
            loadUserOrders(); // Refresh the list
            updateProfileStats(); // Update order count
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to cancel order.', 'error');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('Failed to cancel order.', 'error');
    }
}

async function showOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }

        const order = await response.json();
        
        const orderDate = new Date(order.createdAt || order.date).toLocaleDateString();
        const status = order.status || 'pending';
        const shortOrderId = (order._id || order.id).slice(-8);

        // Create order details modal
        const modal = document.createElement('div');
        modal.className = 'order-details-modal';
        modal.innerHTML = '<div class="order-details-content">' +
            '<h2>Order Details - #' + shortOrderId + '</h2>' +
            '<div class="order-info-grid">' +
            '<div class="order-info-section">' +
            '<h3>Order Information</h3>' +
            '<div class="info-row"><strong>Order Date:</strong> ' + orderDate + '</div>' +
            '<div class="info-row"><strong>Status:</strong> <span class="status-' + status + '">' + status + '</span></div>' +
            '<div class="info-row"><strong>Payment Status:</strong> ' + (order.paymentStatus || 'pending') + '</div>' +
            '</div>' +
            '<div class="order-info-section">' +
            '<h3>Shipping Address</h3>' +
            '<div class="address-display">' +
            (order.shipping ? '<div>' + (order.customer ? order.customer.firstName + ' ' + order.customer.lastName : 'Customer') + '</div>' +
            '<div>' + order.shipping.address + '</div>' +
            '<div>' + order.shipping.city + ', ' + order.shipping.region + '</div>' +
            '<div>' + (order.customer ? order.customer.phone : '') + '</div>' : 'Address not available') +
            '</div></div></div>' +
            '<div class="order-items-section"><h3>Order Items</h3><div class="order-items-list">' +
            (order.products ? order.products.map(function(item) {
                return '<div class="order-item-detail">' +
                '<div class="item-info"><h4>' + (item.product && item.product.name ? item.product.name : 'Product') + '</h4>' +
                '<p>Quantity: ' + item.quantity + '</p>' +
                '<p>Price: GH₵' + (item.product && item.product.price ? item.product.price.toLocaleString() : '0') + ' each</p></div>' +
                '<div class="item-total">GH₵' + ((item.product && item.product.price ? item.product.price : 0) * item.quantity).toLocaleString() + '</div></div>';
            }).join('') : 'No items found') +
            '</div></div>' +
            '<div class="order-summary-section"><h3>Order Summary</h3><div class="order-summary-details">' +
            '<div class="summary-row total"><span>Total:</span><span>GH₵' + (order.total || 0).toLocaleString() + '</span></div></div></div>' +
            '<div class="order-actions">' +
            '<button onclick="this.closest(\'.order-details-modal\').remove()" class="btn btn-outline">Close</button>' +
            '</div>' +
            '<button onclick="this.closest(\'.order-details-modal\').remove()" class="modal-close">&times;</button></div>';

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error showing order details:', error);
        showNotification('Failed to load order details.', 'error');
    }
}

async function loadUserWishlist() {
    const wishlistGrid = document.getElementById('wishlistGrid');
    if (!wishlistGrid) return;

    // First, sync wishlist from backend to ensure we have the latest data
    await getWishlistFromBackend();
    
    const currentUser = getCurrentUser();
    const wishlist = currentUser && currentUser.wishlist ? currentUser.wishlist : [];

    if (wishlist.length === 0) {
        wishlistGrid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-heart"></i><h3>Your Wishlist is Empty</h3><p>Save items you love to your wishlist and they\'ll appear here!</p><a href="categories.html" class="btn btn-primary"><i class="fas fa-compass"></i> Explore Products</a></div>';
        return;
    }

    wishlistGrid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading wishlist items...</p></div>';

    try {
        // Fetch product details for wishlist items
        const products = [];
        for (const productId of wishlist) {
            try {
                const response = await fetch(`${API_BASE}/products/${productId}`);
                if (response.ok) {
                    const product = await response.json();
                    products.push(product);
                }
            } catch (err) {
                console.error('Error fetching product:', err);
            }
        }

        if (products.length === 0) {
            wishlistGrid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-heart"></i><h3>Your Wishlist is Empty</h3><p>Save items you love to your wishlist and they\'ll appear here!</p><a href="categories.html" class="btn btn-primary"><i class="fas fa-compass"></i> Explore Products</a></div>';
            return;
        }

        let wishlistHTML = '';
        products.forEach(product => {
            const imageUrl = product.images && product.images.length > 0 
                ? (product.images[0].url || product.images[0]) 
                : 'https://via.placeholder.com/200x200?text=No+Image';
            
            wishlistHTML += `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                        <button class="remove-wishlist-btn" onclick="removeFromWishlist('${product._id || product.id}')" title="Remove from wishlist">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <h4 class="product-name">${product.name}</h4>
                        <p class="product-price">GH₵${(product.price || 0).toLocaleString()}</p>
                        <button class="btn btn-primary btn-sm" onclick="addToCartFromWishlist('${product._id || product.id}')">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
        });

        wishlistGrid.innerHTML = wishlistHTML;
    } catch (error) {
        console.error('Error loading wishlist:', error);
        wishlistGrid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><i class="fas fa-heart"></i><h3>Error Loading Wishlist</h3><p>Unable to load your wishlist items. Please try again.</p><button class="btn btn-primary" onclick="loadUserWishlist()"><i class="fas fa-sync-alt"></i> Try Again</button></div>';
    }
}

async function loadUserReviews() {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;

    const currentUser = getCurrentUser();
    const reviews = currentUser && currentUser.reviews ? currentUser.reviews : [];

    if (reviews.length === 0) {
        reviewsList.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><h3>No Reviews Yet</h3><p>You haven\'t written any reviews yet. Your reviews will appear here after you rate products.</p></div>';
        return;
    }

    let reviewsHTML = '';
    reviews.forEach(review => {
        const stars = Array(5).fill(0).map((_, i) => 
            `<i class="fas fa-star ${i < review.rating ? 'filled' : ''}"></i>`
        ).join('');

        reviewsHTML += `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-stars">${stars}</div>
                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <p class="review-comment">${review.comment}</p>
                <span class="review-product">Product: ${review.productId || 'Unknown'}</span>
            </div>
        `;
    });

    reviewsList.innerHTML = reviewsHTML;
}

async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.')) {
        return;
    }

    // Double confirmation
    if (!confirm('This is your last chance! Do you really want to delete your account?')) {
        return;
    }

    // Ask for password confirmation
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) {
        showNotification('Password is required to delete account.', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/auth/account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password: password })
        });

        if (response.ok) {
            clearCurrentUser();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showNotification('Account deleted successfully.', 'info');

            setTimeout(function() {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to delete account.', 'error');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Failed to delete account.', 'error');
    }
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

// Remove from wishlist
function removeFromWishlist(productId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please login to manage your wishlist.', 'info');
        return;
    }

    const index = currentUser.wishlist.indexOf(productId);
    if (index > -1) {
        currentUser.wishlist.splice(index, 1);
        
        // Update on backend
        updateUserProfile({ wishlist: currentUser.wishlist })
            .then(success => {
                if (success) {
                    showNotification('Removed from wishlist.', 'info');
                    loadUserWishlist();
                    updateProfileStats();
                } else {
                    showNotification('Failed to remove from wishlist.', 'error');
                }
            });
    }
}

// Add to cart from wishlist
function addToCartFromWishlist(productId) {
    if (typeof addToCart === 'function') {
        addToCart(productId);
    } else {
        showNotification('Adding to cart...', 'info');
        // Fallback to adding to localStorage cart
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => (item.productId || item.id) === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ productId: productId, quantity: 1 });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification('Added to cart!', 'success');
    }
}

// Export functions for use in HTML
window.loadUserProfile = loadUserProfile;
window.loadUserOrders = loadUserOrders;
window.loadUserWishlist = loadUserWishlist;
window.loadUserReviews = loadUserReviews;
window.showOrderDetails = showOrderDetails;
window.cancelOrder = cancelOrder;
window.deleteAccount = deleteAccount;
window.logout = logout;
window.togglePassword = togglePassword;
window.updateProfile = updateProfile;
window.handleAvatarUpload = handleAvatarUpload;
window.removeFromWishlist = removeFromWishlist;
window.addToCartFromWishlist = addToCartFromWishlist;
window.getWishlistFromBackend = getWishlistFromBackend;
