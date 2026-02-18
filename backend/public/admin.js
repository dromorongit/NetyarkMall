const API_BASE = '/api';

// Version for cache busting
const APP_VERSION = '2.0.0';
console.log('Admin JS loaded, version:', APP_VERSION);

// Token management system
let token = localStorage.getItem('token');
let refreshToken = localStorage.getItem('refreshToken');
let tokenExpiration = localStorage.getItem('tokenExpiration') ? new Date(localStorage.getItem('tokenExpiration')) : null;

// Set token expiration (7 days from now)
function setTokenExpiration() {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);
    localStorage.setItem('tokenExpiration', expiration.toISOString());
    tokenExpiration = expiration;
}

// Check if token is expired or about to expire
function isTokenExpired() {
    if (!tokenExpiration) return true;
    const now = new Date();
    return now >= new Date(tokenExpiration.getTime() - 5 * 60 * 1000);
}

// Refresh token automatically
async function refreshAuthToken() {
    if (!refreshToken || isTokenExpired()) {
        try {
            const res = await fetch(`${API_BASE}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });

            if (res.ok) {
                const data = await res.json();
                token = data.token;
                refreshToken = data.refreshToken;
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                setTokenExpiration();
                console.log('Token refreshed successfully');
                return true;
            } else {
                console.error('Failed to refresh token');
                return false;
            }
        } catch (err) {
            console.error('Error refreshing token:', err);
            return false;
        }
    }
    return true;
}

// Wrapped fetch with automatic token refresh
async function authFetch(url, options = {}) {
    if (isTokenExpired()) {
        const refreshSuccess = await refreshAuthToken();
        if (!refreshSuccess) {
            showNotification('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = 'admin-login.html';
            }, 2000);
            return null;
        }
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            const refreshSuccess = await refreshAuthToken();
            if (refreshSuccess) {
                headers['Authorization'] = `Bearer ${token}`;
                return await fetch(url, { ...options, headers });
            } else {
                showNotification('Session expired. Please log in again.', 'error');
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 2000);
                return null;
            }
        }

        return response;
    } catch (error) {
        console.error('Auth fetch error:', error);
        showNotification('Network error. Please check your connection.', 'error');
        return null;
    }
}

// Toast notification helper
function showNotification(message, type = 'error') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'error' ? '❌' : '✅'}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Clear product cache across all tabs/windows
function clearProductCacheAcrossTabs() {
    const currentVersion = parseInt(localStorage.getItem('productCacheVersion') || '0');
    localStorage.setItem('productCacheVersion', (currentVersion + 1).toString());
    console.log('Product cache version incremented to:', currentVersion + 1);
}

// Sidebar toggle functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            toggleBtn.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                    toggleBtn.classList.remove('active');
                }
            }
        });
    }
}

// Tab navigation with sidebar
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.dataset.tab;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show target tab
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab + '-tab') {
                    content.classList.add('active');
                }
            });

            // Close sidebar on mobile after selection
            if (window.innerWidth <= 1024) {
                document.getElementById('sidebar').classList.remove('active');
                document.getElementById('sidebar-toggle').classList.remove('active');
            }

            // Load tab data if needed
            loadTabData(targetTab);
        });
    });
}

// Form toggle functionality
function initFormToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const formPanels = document.querySelectorAll('.form-panel');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.toggle;

            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            formPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === target + '-panel') {
                    panel.classList.add('active');
                }
            });
        });
    });
}

// Load tab data on demand
function loadTabData(tabName) {
    switch(tabName) {
        case 'products':
            loadProducts();
            break;
        case 'daily-deals':
            loadDailyDeals();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'users':
            loadUsers();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Check if user is logged in and initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = 'admin-login.html';
  } else {
    if (refreshToken) {
      setTokenExpiration();
    }
    loadDashboard();
  }
  
  // Initialize sidebar and tabs
  initSidebar();
  initTabs();
  initFormToggle();
  
  // Initialize profile navigation immediately
  initProfileNavigation();
  
  // Initialize profile form handlers
  initProfileFormHandlers();
  
  // Initialize password strength
  initPasswordStrength();
  
  // Initialize 2FA toggle
  initTwoFactorToggle();
  
  // Setup other event listeners
  setupEventListeners();
  
  // Initialize product search
  initProductSearch();
  
  // Initialize order search
  initOrderSearch();
});

// Setup other event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  // Add any global event listeners here
}

// Update user info in header
function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        if (userName) {
            userName.textContent = user.name;
        }
        if (userAvatar) {
            // Check if user has a profile picture
            if (user.profilePicture) {
                // Create an img element for the profile picture
                let avatarImg = userAvatar.querySelector('img');
                if (!avatarImg) {
                    avatarImg = document.createElement('img');
                    avatarImg.style.width = '100%';
                    avatarImg.style.height = '100%';
                    avatarImg.style.borderRadius = '50%';
                    avatarImg.style.objectFit = 'cover';
                    userAvatar.textContent = '';
                    userAvatar.appendChild(avatarImg);
                }
                avatarImg.src = user.profilePicture;
                avatarImg.style.display = 'block';
            } else {
                // Show initial if no profile picture
                userAvatar.innerHTML = '';
                userAvatar.textContent = user.name.charAt(0).toUpperCase();
                userAvatar.style.display = 'flex';
            }
        }
    }
}

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiration');
  token = null;
  refreshToken = null;
  tokenExpiration = null;
  window.location.href = 'admin-login.html';
});

// Wholesale checkbox handling
document.getElementById('product-wholesale').addEventListener('change', function() {
  const wholesaleGroups = document.querySelectorAll('.wholesale-group');
  const moqInput = document.getElementById('product-moq');
  const wholesalePriceInput = document.getElementById('product-wholesale-price');
  
  if (this.checked) {
    wholesaleGroups.forEach(group => group.style.display = 'flex');
    moqInput.parentElement.style.display = 'flex';
    moqInput.required = true;
  } else {
    wholesaleGroups.forEach(group => group.style.display = 'none');
    moqInput.parentElement.style.display = 'none';
    moqInput.required = false;
    moqInput.value = '1';
    wholesalePriceInput.value = '';
  }
});

// Product form submission
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Product form submitted');
    
    const submitBtn = e.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Adding...';
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('shortDescription', document.getElementById('product-short-description').value);
    formData.append('longDescription', document.getElementById('product-long-description').value);
    formData.append('brand', document.getElementById('product-brand').value);
    
    const colors = document.getElementById('product-colors').value.split(',').map(c => c.trim()).filter(c => c);
    colors.forEach(color => formData.append('colors', color));
    
    const sizes = document.getElementById('product-sizes').value.split(',').map(s => s.trim()).filter(s => s);
    sizes.forEach(size => formData.append('sizes', size));
    
    formData.append('price', Math.round(parseFloat(document.getElementById('product-price').value) * 100) / 100);
    
    const salesPriceValue = document.getElementById('product-sales-price').value;
    const salesPriceNum = parseFloat(salesPriceValue);
    if (salesPriceValue && !isNaN(salesPriceNum)) {
      formData.append('salesPrice', Math.round(salesPriceNum * 100) / 100);
    }
    
    const originalPriceValue = document.getElementById('product-original-price').value;
    const originalPriceNum = parseFloat(originalPriceValue);
    if (originalPriceValue && !isNaN(originalPriceNum)) {
      formData.append('originalPrice', Math.round(originalPriceNum * 100) / 100);
    }
    
    formData.append('stock', parseInt(document.getElementById('product-stock').value));
    formData.append('category', document.getElementById('product-category').value);
    
    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const additionalMedia = document.getElementById('product-additional-media').files;
    for (let i = 0; i < additionalMedia.length; i++) {
      formData.append('additionalMedia', additionalMedia[i]);
    }
    
    formData.append('isWholesale', document.getElementById('product-wholesale').checked);
    formData.append('minOrderQty', parseInt(document.getElementById('product-moq').value) || 1);
    
    if (document.getElementById('product-wholesale').checked) {
      formData.append('wholesalePrice', parseFloat(document.getElementById('product-wholesale-price').value) || 0);
    }
    
    formData.append('isNewArrival', document.getElementById('product-new-arrival').checked);
    formData.append('isFastSelling', document.getElementById('product-fast-selling').checked);
    formData.append('isShopByCategory', document.getElementById('product-shop-category').checked);
    formData.append('isDailyDeal', document.getElementById('product-daily-deal').checked);
    
    const stockStatus = document.querySelector('input[name="stock-status"]:checked').value;
    formData.append('stockStatus', stockStatus);

    try {
      const res = await authFetch(`${API_BASE}/products`, {
        method: 'POST',
        body: formData
      });
      
      if (res && !res.ok) {
        const errorData = await res.json();
        console.log('Error data:', errorData);
        showNotification(errorData.message || 'Failed to add product', 'error');
      } else if (res) {
        console.log('Product added successfully');
        showNotification('Product added successfully! Images are stored on Cloudinary.', 'success');
        loadProducts();
        clearProductCacheAcrossTabs();
        e.target.reset();
        document.getElementById('product-moq').value = '1';
        // Reset wholesale fields
        document.getElementById('product-wholesale').checked = false;
        document.querySelectorAll('.wholesale-group').forEach(g => g.style.display = 'none');
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      showNotification('Error adding product', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Staff creation form
document.getElementById('create-staff-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('staff-name').value;
  const email = document.getElementById('staff-email').value;
  const password = document.getElementById('staff-password').value;
  
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, email, password, role: 'staff' })
    });
    
    if (res.ok) {
      showNotification('Staff account created successfully!', 'success');
      document.getElementById('create-staff-form').reset();
    } else {
      const data = await res.json();
      showNotification(data.message || 'Failed to create staff', 'error');
    }
  } catch (err) {
    console.error(err);
    showNotification('Error creating staff account', 'error');
  }
});

// Load dashboard data
async function loadDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Update user info in header
  updateUserInfo();
  
  if (user && user.role === 'superadmin') {
    document.getElementById('create-staff-section').style.display = 'block';
    document.getElementById('users-nav-item').style.display = 'flex';
  } else {
    document.getElementById('users-nav-item').style.display = 'none';
  }
  
  loadProducts();
  loadOrders();
  loadMessages();
  loadUsers();
  loadProfile();
  loadDailyDeals();
  
  // Initialize order notification polling
  initOrderNotificationPolling();
}

// Load products
let allProducts = [];

async function loadProducts() {
  try {
    const res = await authFetch(`${API_BASE}/products`);
    if (!res) return;

    allProducts = await res.json();
    renderProducts(allProducts);
  } catch (err) {
    console.error(err);
    showNotification('Error loading products', 'error');
  }
}

// Render products to the list
function renderProducts(products) {
  const list = document.getElementById('products-list');
  
  if (!products || products.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3>No Products Found</h3>
        <p>${allProducts.length === 0 ? 'Add your first product to get started.' : 'No products match your search.'}</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = products.map(p => `
    <div class="product-item">
      <h3>${p.name}</h3>
      <p><strong>Short Desc:</strong> ${p.shortDescription}</p>
      ${p.brand ? `<p><strong>Brand:</strong> ${p.brand}</p>` : ''}
      ${p.colors && p.colors.length ? `<p><strong>Colors:</strong> ${p.colors.join(', ')}</p>` : ''}
      ${p.sizes && p.sizes.length ? `<p><strong>Sizes:</strong> ${p.sizes.join(', ')}</p>` : ''}
      <p><strong>Original Price:</strong> <span style="${p.salesPrice ? 'text-decoration: line-through; color: #999;' : ''}">GHS ${p.price}</span>${p.salesPrice ? ` <strong style="color: var(--primary-color);">SALE: GHS ${p.salesPrice}</strong>` : ''}</p>
      ${p.originalPrice ? `<p><strong>Deals Price:</strong> GHS ${p.originalPrice}</p>` : ''}
      <p><strong>Stock:</strong> ${p.stock}</p>
      <p><strong>Category:</strong> ${p.category}</p>
      <p><strong>Stock Status:</strong> ${p.stockStatus || 'in-stock'}</p>
      <div class="product-actions">
        <button onclick="updateStock('${p._id}', ${p.stock})">Update Stock</button>
        <button onclick="editProduct('${p._id}')">Edit</button>
        <button class="delete-btn" onclick="deleteProduct('${p._id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Search products
function initProductSearch() {
  const searchInput = document.getElementById('product-search');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
      renderProducts(allProducts);
      return;
    }
    
    const filteredProducts = allProducts.filter(product => {
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        (product.shortDescription && product.shortDescription.toLowerCase().includes(searchTerm)) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
        (product.category && product.category.toLowerCase().includes(searchTerm)) ||
        (product.colors && product.colors.some(color => color.toLowerCase().includes(searchTerm))) ||
        (product.sizes && product.sizes.some(size => size.toLowerCase().includes(searchTerm)))
      );
    });
    
    renderProducts(filteredProducts);
  });
}

// Load daily deals
async function loadDailyDeals() {
  try {
    const res = await authFetch(`${API_BASE}/products/daily-deals`);
    if (!res) return;

    const dailyDeals = await res.json();
    const list = document.getElementById('daily-deals-list');

    if (!dailyDeals || dailyDeals.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔥</div>
          <h3>No Daily Deals</h3>
          <p>Products marked as Daily Deals will appear here.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = dailyDeals.map(p => `
      <div class="product-item">
        <h3>${p.name}</h3>
        <p><strong>Short Desc:</strong> ${p.shortDescription}</p>
        ${p.brand ? `<p><strong>Brand:</strong> ${p.brand}</p>` : ''}
        <p><strong>Original Price:</strong> <span style="${p.salesPrice ? 'text-decoration: line-through; color: #999;' : ''}">GHS ${p.price}</span>${p.salesPrice ? ` <strong style="color: var(--primary-color);">SALE: GHS ${p.salesPrice}</strong>` : ''}</p>
        ${p.originalPrice ? `<p><strong>Deals Price:</strong> GHS ${p.originalPrice}</p>` : ''}
        <p><strong>Stock:</strong> ${p.stock}</p>
        <p><strong>Category:</strong> ${p.category}</p>
        <p><strong>Stock Status:</strong> ${p.stockStatus || 'in-stock'}</p>
        <div class="product-actions">
          <button onclick="updateStock('${p._id}', ${p.stock})">Update Stock</button>
          <button onclick="editProduct('${p._id}')">Edit</button>
          <button class="delete-btn" onclick="deleteProduct('${p._id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading daily deals:', err);
    showNotification('Error loading daily deals', 'error');
  }
}

// Refresh daily deals button
document.getElementById('refresh-daily-deals-btn').addEventListener('click', () => {
    loadDailyDeals();
    showNotification('Daily deals refreshed!', 'success');
});

// Load orders
let allOrders = [];

async function loadOrders() {
  try {
    console.log('Loading orders...');
    const res = await authFetch(`${API_BASE}/orders`);
    if (!res) return;

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const orders = await res.json();
    console.log('Orders received:', orders);
    
    // Store all orders for filtering
    allOrders = orders;

    // Reset order notifications when viewing orders tab
    resetOrderNotifications();

    // Update the order badge with pending orders count
    updateOrderBadge(orders);

    const list = document.getElementById('orders-list');

    if (!orders || orders.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No Orders Yet</h3>
          <p>Customer orders will appear here.</p>
        </div>
      `;
      return;
    }

    renderOrders(orders);
  } catch (err) {
    console.error('Error loading orders:', err);
    showNotification('Error loading orders', 'error');
  }
}

// Render orders to the list
function renderOrders(orders) {
  const list = document.getElementById('orders-list');
  
  if (!orders || orders.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No Orders Found</h3>
        <p>${allOrders.length === 0 ? 'Customer orders will appear here.' : 'No orders match your search.'}</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = orders.map(o => {
    const hasUser = o.user && o.user.name;
    const customerName = hasUser ? 
      `${o.user.name} (User)` :
      (o.customer && o.customer.firstName && o.customer.lastName) ?
      `${o.customer.firstName} ${o.customer.lastName} (Guest)` :
      'Unknown Customer';

    const customerEmail = (o.customer && o.customer.email) ? o.customer.email : 'N/A';
    const customerPhone = (o.customer && o.customer.phone) ? o.customer.phone : 'N/A';
    const orderTotal = o.total ? o.total.toLocaleString() : '0';
    const orderStatus = o.status || 'pending';
    const itemCount = o.products ? o.products.length : 0;
    const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Unknown';
    const orderId = o._id || '';

    return `
      <div class="order-item" data-order-id="${orderId}">
        <div class="order-header">
          <h3>Order #${orderId.substring(0, 8)}</h3>
          <div class="order-actions">
            <button onclick="printOrder('${orderId}')" class="btn-print" title="Print Order">
              <i class="fas fa-print"></i> Print
            </button>
            <button onclick="deleteOrder('${orderId}')" class="btn-delete" title="Delete Order">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="order-details">
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Total:</strong> ₵${orderTotal}</p>
          <p><strong>Status:</strong> 
            <span class="status-badge status-${orderStatus}">${orderStatus}</span>
          </p>
          <p><strong>Items:</strong> ${itemCount} item(s)</p>
          <p><strong>Date:</strong> ${orderDate}</p>
        </div>
        <div class="order-status-update">
          <label>Update Status:</label>
          <select onchange="updateOrderStatus('${orderId}', this.value)">
            <option value="pending" ${orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="processing" ${orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="shipped" ${orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <button onclick="viewOrderDetails('${orderId}')" class="btn-view-details">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Initialize order search
function initOrderSearch() {
  const searchInput = document.getElementById('order-search');
  const statusFilter = document.getElementById('order-status-filter');
  
  if (!searchInput) return;
  
  // Function to filter and render orders
  function filterAndRenderOrders() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const statusValue = statusFilter ? statusFilter.value : 'all';
    
    let filteredOrders = allOrders;
    
    // Apply status filter
    if (statusValue !== 'all') {
      filteredOrders = filteredOrders.filter(order => {
        const orderStatus = (order.status || 'pending').toLowerCase();
        return orderStatus === statusValue;
      });
    }
    
    // Apply search filter
    if (searchTerm !== '') {
      filteredOrders = filteredOrders.filter(order => {
        // Search by customer name (firstName + lastName or user name)
        let customerName = '';
        if (order.user && order.user.name) {
          customerName = order.user.name.toLowerCase();
        } else if (order.customer) {
          customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.toLowerCase();
        }
        
        // Search by email
        const customerEmail = (order.customer && order.customer.email) ? order.customer.email.toLowerCase() : '';
        
        // Search by phone
        const customerPhone = (order.customer && order.customer.phone) ? order.customer.phone.toLowerCase() : '';
        
        return (
          customerName.includes(searchTerm) ||
          customerEmail.includes(searchTerm) ||
          customerPhone.includes(searchTerm)
        );
      });
    }
    
    renderOrders(filteredOrders);
  }
  
  // Search input event
  searchInput.addEventListener('input', filterAndRenderOrders);
  
  // Status filter event
  if (statusFilter) {
    statusFilter.addEventListener('change', filterAndRenderOrders);
  }
}

// Update order badge with count of pending/new orders
function updateOrderBadge(orders) {
  const badge = document.getElementById('order-badge');
  if (!badge) return;
  
  // Get the last viewed timestamp - only count orders created after this time as "new"
  const lastViewedOrders = localStorage.getItem('lastViewedOrders');
  const lastViewedTime = lastViewedOrders ? new Date(lastViewedOrders) : null;
  
  // Count new orders (pending/processing AND created after last viewed time)
  let newOrderCount = 0;
  orders.forEach(order => {
    const orderTime = order.createdAt ? new Date(order.createdAt) : new Date(0);
    const isNewStatus = order.status === 'pending' || order.status === 'processing';
    const isNewOrder = !lastViewedTime || orderTime > lastViewedTime;
    
    if (isNewStatus && isNewOrder) {
      newOrderCount++;
    }
  });
  
  // Store the count for polling
  localStorage.setItem('lastOrderCount', newOrderCount.toString());
  
  // Update badge display
  badge.setAttribute('data-count', newOrderCount);
  badge.textContent = newOrderCount > 99 ? '99+' : newOrderCount;
  
  // Show/hide badge based on count
  if (newOrderCount > 0) {
    badge.style.display = 'flex';
    badge.style.animation = 'pulse 2s infinite';
  } else {
    badge.style.display = 'none';
  }
}

// Reset order notification when viewing orders
function resetOrderNotifications() {
  // Update the last viewed timestamp to now
  localStorage.setItem('lastViewedOrders', new Date().toISOString());
  
  // Immediately update the badge to show 0 (since we've seen all orders)
  const badge = document.getElementById('order-badge');
  if (badge) {
    badge.setAttribute('data-count', '0');
    badge.textContent = '0';
    badge.style.display = 'none';
  }
  
  // Clear any stored count
  localStorage.setItem('lastOrderCount', '0');
  
  console.log('Order notifications reset at:', new Date().toISOString());
}

// Initialize order notification polling
function initOrderNotificationPolling() {
  // Check for new orders immediately
  checkNewOrders();
  
  // Poll every 30 seconds for new orders
  setInterval(() => {
    checkNewOrders();
  }, 30000);
}

// Check for new orders and update badge
async function checkNewOrders() {
  try {
    const res = await authFetch(`${API_BASE}/orders`);
    if (!res) return;

    const orders = await res.json();
    updateOrderBadge(orders);
  } catch (err) {
    console.error('Error checking new orders:', err);
  }
}

// Load messages
async function loadMessages() {
  console.log('loadMessages called');
  try {
    const res = await authFetch(`${API_BASE}/messages`);
    if (!res) {
      console.log('No response from server');
      return;
    }

    if (!res.ok) {
      console.error('Server returned error:', res.status, res.statusText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const messages = await res.json();
    console.log('Messages received:', messages);
    
    // Debug: Log the conversationId of each message
    messages.forEach((m, index) => {
      console.log(`Message ${index}: conversationId = ${m.conversationId}, type = ${typeof m.conversationId}`);
    });

    // Fix legacy data: Generate conversationId for messages that don't have one
    messages.forEach(m => {
      if (!m.conversationId || m.conversationId === undefined || m.conversationId === 'undefined' || m.conversationId === 'null') {
        // Use the message's MongoDB _id as the conversationId for legacy messages
        m.conversationId = m._id;
        console.log(`Generated conversationId for message ${m._id}: ${m.conversationId}`);
      }
    });

    // Group messages by conversation
    const conversations = {};
    messages.forEach(m => {
      const convId = m.conversationId;
      console.log('Processing message with conversationId:', convId);
      if (!conversations[convId]) {
        conversations[convId] = [];
      }
      conversations[convId].push(m);
    });

    console.log('Conversations object keys:', Object.keys(conversations));
    console.log('Conversations found:', Object.keys(conversations).length);

    const list = document.getElementById('messages-list');

    if (Object.keys(conversations).length === 0) {
      console.log('No conversations, showing empty state');
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <h3>No Messages</h3>
          <p>Customer messages will appear here.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = Object.entries(conversations).map(([convId, msgs]) => {
      console.log('Rendering conversation:', convId);
      const latestMsg = msgs[msgs.length - 1];
      const senderInfo = msgs.find(m => m.sender !== 'admin') || latestMsg;
      const status = latestMsg.status || 'open';
      const isClosed = status === 'closed';

      // Ensure convId is a valid string
      const safeConvId = convId ? String(convId) : 'unknown';

      return `
        <div class="conversation-item ${isClosed ? 'closed' : ''}" data-conversation-id="${safeConvId}">
          <div class="conversation-header">
            <h4>${senderInfo.senderName || senderInfo.sender} (${senderInfo.senderEmail || 'No email'})</h4>
            <div style="display: flex; gap: 10px; align-items: center;">
              <span class="conversation-status ${status}">${status}</span>
              ${isClosed ? 
                `<button class="btn-secondary btn-sm" onclick="openConversation('${safeConvId}')">Open</button>` : 
                `<button class="close-conversation-btn" onclick="closeConversation('${safeConvId}')">Close</button>`
              }
              <button class="btn-danger-outline btn-sm" onclick="deleteConversation('${safeConvId}')">Delete</button>
            </div>
          </div>
          <div class="conversation-messages" style="${isClosed ? 'display: none;' : ''}">
            ${msgs.map(m => `
              <div class="message-bubble ${m.sender === 'admin' ? 'admin-message' : 'user-message'}">
                <p><strong>${m.sender === 'admin' ? 'You (Admin)' : m.senderName || m.sender}:</strong> ${m.message}</p>
                <small>${new Date(m.timestamp).toLocaleString()}</small>
                ${m.response ? `
                  <div class="response-bubble">
                    <p><strong>Response:</strong> ${m.response}</p>
                    <small>Responded: ${new Date(m.responseTimestamp).toLocaleString()}</small>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <div class="conversation-actions" style="${isClosed ? 'display: none;' : ''}">
            <textarea placeholder="Type your response..." id="response-${convId}"></textarea>
            <button onclick="respondToMessage('${convId}')">Send Response</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading messages:', err);
    showNotification('Error loading messages', 'error');
    // Show empty state on error
    const list = document.getElementById('messages-list');
    if (list) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <h3>No Messages</h3>
          <p>Customer messages will appear here.</p>
        </div>
      `;
    }
  }
}

// Update stock
async function updateStock(id, currentStock) {
  const newStock = prompt('Enter new stock:', currentStock);
  if (newStock !== null) {
    try {
      await fetch(`${API_BASE}/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: parseInt(newStock) })
      });
      showNotification('Stock updated successfully!', 'success');
      loadProducts();
      clearProductCacheAcrossTabs();
    } catch (err) {
      console.error(err);
      showNotification('Error updating stock', 'error');
    }
  }
}

// Edit product
async function editProduct(id) {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product data');
    }

    const product = await response.json();

    document.getElementById('edit-product-id').value = product._id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-short-description').value = product.shortDescription;
    document.getElementById('edit-product-long-description').value = product.longDescription || '';
    document.getElementById('edit-product-brand').value = product.brand || '';
    document.getElementById('edit-product-colors').value = product.colors ? product.colors.join(', ') : '';
    document.getElementById('edit-product-sizes').value = product.sizes ? product.sizes.join(', ') : '';
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-sales-price').value = product.salesPrice || '';
    document.getElementById('edit-product-original-price').value = product.originalPrice || '';
    document.getElementById('edit-product-stock').value = product.stock;
    document.getElementById('edit-product-category').value = product.category;

    const stockStatusRadios = document.getElementsByName('edit-stock-status');
    stockStatusRadios.forEach(radio => {
      if (radio.value === (product.stockStatus || 'in-stock')) {
        radio.checked = true;
      }
    });

    const currentImagePreview = document.getElementById('current-image-preview');
    if (product.image) {
      currentImagePreview.innerHTML = `
        <p><strong>Current Image:</strong></p>
        <img src="${product.image}" alt="Current product image">
        <p style="font-size: 12px; color: #666; margin-top: 5px;">Upload a new image to replace the current one</p>
      `;
    } else {
      currentImagePreview.innerHTML = '<p style="font-size: 12px; color: #666;">No image currently set</p>';
    }

    // Display additional media
    const additionalMediaPreview = document.getElementById('current-additional-media-preview');
    if (product.additionalMedia && product.additionalMedia.length > 0) {
      additionalMediaPreview.innerHTML = product.additionalMedia.map((media, index) => `
        <div class="additional-media-item" data-index="${index}" data-url="${media}">
          <img src="${media}" alt="Additional image ${index + 1}">
          <button type="button" class="delete-media-btn" onclick="deleteAdditionalMedia('${product._id}', '${media}', this)" title="Delete image">×</button>
        </div>
      `).join('');
    } else {
      additionalMediaPreview.innerHTML = '<p style="font-size: 12px; color: #666;">No additional images</p>';
    }

    // Set section checkboxes
    document.getElementById('edit-product-new-arrival').checked = product.isNewArrival || false;
    document.getElementById('edit-product-fast-selling').checked = product.isFastSelling || false;
    document.getElementById('edit-product-shop-category').checked = product.isShopByCategory || false;
    document.getElementById('edit-product-daily-deal').checked = product.isDailyDeal || false;

    document.getElementById('edit-product-image').value = '';
    document.getElementById('edit-product-additional-media').value = '';
    document.getElementById('edit-product-modal').style.display = 'block';

  } catch (err) {
    console.error('Error editing product:', err);
    showNotification('Error editing product: ' + err.message, 'error');
  }
}

// Delete additional media
async function deleteAdditionalMedia(productId, mediaUrl, buttonElement) {
  if (!confirm('Are you sure you want to delete this image?')) {
    return;
  }

  try {
    const response = await authFetch(`${API_BASE}/products/${productId}/additional-media`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mediaUrl })
    });

    if (response && response.ok) {
      showNotification('Image deleted successfully!', 'success');
      // Remove the element from the DOM
      buttonElement.closest('.additional-media-item').remove();
      // Clear product cache
      clearProductCacheAcrossTabs();
    } else {
      const errorData = await response.json();
      showNotification('Failed to delete image: ' + (errorData.message || 'Unknown error'), 'error');
    }
  } catch (err) {
    console.error('Error deleting image:', err);
    showNotification('Error deleting image: ' + err.message, 'error');
  }
}

function closeEditModal() {
  document.getElementById('edit-product-modal').style.display = 'none';
}

// Edit product form submission
if (document.getElementById('edit-product-form')) {
  document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('edit-product-id').value;
    const formData = new FormData();

    console.log('Frontend: Starting edit product submission for ID:', productId);

    formData.append('name', document.getElementById('edit-product-name').value);
    formData.append('shortDescription', document.getElementById('edit-product-short-description').value);
    formData.append('longDescription', document.getElementById('edit-product-long-description').value);
    formData.append('brand', document.getElementById('edit-product-brand').value);

    const colors = document.getElementById('edit-product-colors').value.split(',').map(c => c.trim()).filter(c => c);
    colors.forEach(color => formData.append('colors', color));

    const sizes = document.getElementById('edit-product-sizes').value.split(',').map(s => s.trim()).filter(s => s);
    sizes.forEach(size => formData.append('sizes', size));

    formData.append('price', Math.round(parseFloat(document.getElementById('edit-product-price').value) * 100) / 100);
    
    const salesPriceValue = document.getElementById('edit-product-sales-price').value;
    const salesPriceNum = parseFloat(salesPriceValue);
    if (salesPriceValue && !isNaN(salesPriceNum)) {
      formData.append('salesPrice', Math.round(salesPriceNum * 100) / 100);
    }
    
    const originalPriceValue = document.getElementById('edit-product-original-price').value;
    const originalPriceNum = parseFloat(originalPriceValue);
    if (originalPriceValue && !isNaN(originalPriceNum)) {
      formData.append('originalPrice', Math.round(originalPriceNum * 100) / 100);
    }
    formData.append('category', document.getElementById('edit-product-category').value);
    formData.append('stockStatus', document.querySelector('input[name="edit-stock-status"]:checked').value);

    const imageFile = document.getElementById('edit-product-image').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    // Handle additional media uploads
    const additionalMediaFiles = document.getElementById('edit-product-additional-media').files;
    const replaceAdditionalMedia = document.getElementById('edit-replace-additional-media').checked;
    
    if (additionalMediaFiles.length > 0) {
      formData.append('replaceAdditionalMedia', replaceAdditionalMedia);
      for (let i = 0; i < additionalMediaFiles.length; i++) {
        formData.append('additionalMedia', additionalMediaFiles[i]);
      }
    }

    // Add section checkboxes
    formData.append('isNewArrival', document.getElementById('edit-product-new-arrival').checked);
    formData.append('isFastSelling', document.getElementById('edit-product-fast-selling').checked);
    formData.append('isShopByCategory', document.getElementById('edit-product-shop-category').checked);
    formData.append('isDailyDeal', document.getElementById('edit-product-daily-deal').checked);

    try {
      const response = await authFetch(`${API_BASE}/products/${productId}`, {
        method: 'PUT',
        body: formData
      });

      if (response && response.ok) {
        showNotification('Product updated successfully!', 'success');
        closeEditModal();
        loadProducts();
        clearProductCacheAcrossTabs();
      } else {
        const errorData = await response.json();
        showNotification('Failed to update product: ' + (errorData.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Frontend: Error updating product:', err);
      showNotification('Error updating product: ' + err.message, 'error');
    }
  });
}

// Delete product
async function deleteProduct(id) {
  if (confirm('Delete this product?')) {
    try {
      const response = await authFetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE'
      });
      if (!response) return;

      if (response.ok) {
        showNotification('Product deleted successfully!', 'success');
        loadProducts();
        clearProductCacheAcrossTabs();
      } else {
        const errorData = await response.json();
        showNotification('Failed to delete product: ' + (errorData.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      showNotification('Error deleting product: ' + err.message, 'error');
    }
  }
}

// Update order status
async function updateOrderStatus(id, status) {
  try {
    await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    showNotification('Order status updated!', 'success');
    loadOrders();
  } catch (err) {
    console.error(err);
    showNotification('Error updating order status', 'error');
  }
}

// Delete order permanently
async function deleteOrder(id) {
  if (confirm('Are you sure you want to delete this order permanently? This action cannot be undone.')) {
    try {
      const res = await authFetch(`${API_BASE}/orders/${id}`, {
        method: 'DELETE'
      });
      
      if (res && res.ok) {
        showNotification('Order deleted successfully!', 'success');
        loadOrders();
      } else {
        const errorData = await res.json();
        showNotification(errorData.message || 'Error deleting order', 'error');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      showNotification('Error deleting order', 'error');
    }
  }
}

// Print order
async function printOrder(orderId) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch order details');
    }

    const order = await res.json();
    
    // Create printable content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order._id.substring(0, 8)} - Netyark Mall</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            background: #fff;
          }
          .print-header {
            text-align: center;
            border-bottom: 2px solid #008000;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .print-header h1 {
            color: #008000;
            font-size: 28px;
          }
          .print-header p {
            color: #666;
            font-size: 14px;
          }
          .order-info {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .order-info h2 {
            font-size: 18px;
            color: #333;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dashed #eee;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th {
            background: #008000;
            color: white;
            padding: 12px;
            text-align: left;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
          }
          .items-table tr:nth-child(even) {
            background: #f9f9f9;
          }
          .order-total {
            text-align: right;
            font-size: 20px;
            font-weight: bold;
            color: #008000;
            padding: 15px 0;
            border-top: 2px solid #008000;
            margin-top: 20px;
          }
          .print-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-pending { background: #fff3cd; color: #856404; }
          .status-processing { background: #cce5ff; color: #004085; }
          .status-shipped { background: #d4edda; color: #155724; }
          .status-delivered { background: #28a745; color: white; }
          .status-cancelled { background: #f8d7da; color: #721c24; }
          @media print {
            body {
              padding: 10px;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Netyark Mall</h1>
          <p>Order Invoice</p>
        </div>
        
        <div class="order-info">
          <h2>Order Information</h2>
          <div class="info-row">
            <span class="info-label">Order ID:</span>
            <span class="info-value">#${order._id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Order Date:</span>
            <span class="info-value">${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="info-value"><span class="status-badge status-${order.status}">${order.status}</span></span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Method:</span>
            <span class="info-value">${order.paymentMethod ? order.paymentMethod.replace('-', ' ').toUpperCase() : 'N/A'}</span>
          </div>
        </div>
        
        <div class="order-info">
          <h2>Customer Information</h2>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${(order.customer && order.customer.firstName && order.customer.lastName) ? `${order.customer.firstName} ${order.customer.lastName}` : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${(order.customer && order.customer.email) ? order.customer.email : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${(order.customer && order.customer.phone) ? order.customer.phone : 'N/A'}</span>
          </div>
        </div>
        
        <div class="order-info">
          <h2>Shipping Address</h2>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${(order.shipping && order.shipping.address) ? order.shipping.address : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">City:</span>
            <span class="info-value">${(order.shipping && order.shipping.city) ? order.shipping.city : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Region:</span>
            <span class="info-value">${(order.shipping && order.shipping.region) ? order.shipping.region.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</span>
          </div>
        </div>
        
        <h2>Order Items</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.products && order.products.length > 0) ? order.products.map(item => `
              <tr>
                <td>${item.product && typeof item.product === 'object' ? item.product.name : item.product || 'N/A'}${item.color || item.size ? `<br><small style="color: #666;">${item.color ? `Color: ${item.color}` : ''}${item.color && item.size ? ' | ' : ''}${item.size ? `Size: ${item.size}` : ''}</small>` : ''}</td>
                <td>${item.quantity || 0}</td>
                <td>₵${(item.price || 0).toLocaleString()}${item.originalPrice && item.originalPrice > item.price ? ` <span style="text-decoration: line-through; color: #999; font-size: 0.9em;">(₵${(item.originalPrice || 0).toLocaleString()})</span>` : ''}</td>
                <td>₵${((item.price || 0) * (item.quantity || 0)).toLocaleString()}</td>
              </tr>
            `).join('') : '<tr><td colspan="4" style="text-align: center;">No items found</td></tr>'}}
          </tbody>
        </table>
        
        <div class="order-total">
          Total: ₵${(order.total || 0).toLocaleString()}
        </div>
        
        <div class="print-footer">
          <p>Thank you for shopping with Netyark Mall!</p>
          <p>Santa Maria, Accra, Ghana | info@netyarkmall.com</p>
          <p>Printed on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; background: #008000; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Order</button>
          <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
  } catch (err) {
    console.error('Error printing order:', err);
    showNotification('Error loading order details for printing', 'error');
  }
}

// View order details
async function viewOrderDetails(orderId) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch order details');
    }

    const order = await res.json();

    const modal = document.createElement('div');
    modal.className = 'order-details-modal';
    modal.innerHTML = `
      <div class="order-details-content">
        <button onclick="this.closest('.order-details-modal').remove()" class="btn-close-modal" title="Close">&times;</button>
        <div class="order-details-header">
          <div class="order-header-left">
            <h2>Order Details</h2>
            <span class="order-id-badge">#${order._id ? order._id.substring(0, 8) : 'N/A'}</span>
          </div>
          <div class="order-header-actions">
            <button onclick="printOrder('${order._id}')" class="btn-modal btn-print-modal" title="Print Order">
              <span class="btn-icon"><i class="fas fa-print"></i></span>
              <span class="btn-text">Print Invoice</span>
            </button>
            <button onclick="closeOrderDetails(this)" class="btn-modal btn-back-modal" title="Back to Orders">
              <span class="btn-icon"><i class="fas fa-arrow-left"></i></span>
              <span class="btn-text">Back</span>
            </button>
          </div>
        </div>
        <div class="order-details-body">
          <div class="order-info-section">
            <h3><i class="fas fa-user"></i> Customer Information</h3>
            <p><strong>Name:</strong> ${(order.customer && order.customer.firstName && order.customer.lastName) ? `${order.customer.firstName} ${order.customer.lastName}` : 'N/A'}</p>
            <p><strong>Email:</strong> ${(order.customer && order.customer.email) ? order.customer.email : 'N/A'}</p>
            <p><strong>Phone:</strong> ${(order.customer && order.customer.phone) ? order.customer.phone : 'N/A'}</p>
          </div>

          <div class="order-info-section">
            <h3><i class="fas fa-shipping-fast"></i> Shipping Information</h3>
            <p><strong>Address:</strong> ${(order.shipping && order.shipping.address) ? order.shipping.address : 'N/A'}</p>
            <p><strong>City:</strong> ${(order.shipping && order.shipping.city) ? order.shipping.city : 'N/A'}</p>
            <p><strong>Region:</strong> ${(order.shipping && order.shipping.region) ? order.shipping.region.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</p>
            <p><strong>Zone:</strong> ${(order.shipping && order.shipping.zone) ? order.shipping.zone : 'N/A'}</p>
            <p><strong>Method:</strong> ${(order.shipping && order.shipping.method) ? order.shipping.method : 'N/A'}</p>
          </div>

          <div class="order-info-section">
            <h3><i class="fas fa-box-open"></i> Order Items</h3>
            ${(order.products && order.products.length > 0) ? order.products.map(item => `
              <div class="order-item-detail">
                <div class="item-header">
                  <span class="item-name">${item.product && typeof item.product === 'object' ? item.product.name : item.product || 'N/A'}</span>
                  <span class="item-price">₵${((item.price || 0) * (item.quantity || 0)).toLocaleString()}</span>
                </div>
                <div class="item-details">
                  <span><strong>Qty:</strong> ${item.quantity || 0}</span>
                  <span><strong>Unit Price:</strong> ₵${(item.price || 0).toLocaleString()}${item.originalPrice && item.originalPrice > item.price ? ` <span style="text-decoration: line-through; color: #999; font-size: 0.9em;">(₵${(item.originalPrice || 0).toLocaleString()})</span>` : ''}</span>
                  ${item.color ? `<span><strong>Color:</strong> ${item.color}</span>` : ''}
                  ${item.size ? `<span><strong>Size:</strong> ${item.size}</span>` : ''}
                </div>
              </div>
            `).join('') : '<p>No items found</p>'}
          </div>

          <div class="order-info-section order-summary">
            <h3><i class="fas fa-receipt"></i> Order Summary</h3>
            <div class="summary-row">
              <span>Payment Method:</span>
              <span>${order.paymentMethod ? order.paymentMethod.replace('-', ' ').toUpperCase() : 'N/A'}</span>
            </div>
            <div class="summary-row">
              <span>Status:</span>
              <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
            <div class="summary-row">
              <span>Order Date:</span>
              <span>${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown'}</span>
            </div>
            <div class="summary-total">
              <span>Total:</span>
              <span class="total-amount">₵${(order.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

  } catch (err) {
    console.error('Error viewing order details:', err);
    showNotification('Error loading order details: ' + err.message, 'error');
  }
}

// Close order details modal
function closeOrderDetails(button) {
  button.closest('.order-details-modal').remove();
}

// Respond to message
async function respondToMessage(conversationId) {
  const response = document.getElementById(`response-${conversationId}`).value;
  if (!response) {
    showNotification('Please enter a response', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/messages/conversation/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const messages = await res.json();
    if (messages.length === 0) {
      showNotification('No messages found in this conversation', 'error');
      return;
    }

    const latestMessage = messages[messages.length - 1];

    await fetch(`${API_BASE}/messages/${latestMessage._id}/respond`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        response,
        sender: 'admin',
        senderId: JSON.parse(localStorage.getItem('user')).id,
        senderName: JSON.parse(localStorage.getItem('user')).name,
        conversationId
      })
    });

    document.getElementById(`response-${conversationId}`).value = '';
    loadMessages();
    showNotification('Response sent!', 'success');

  } catch (err) {
    console.error(err);
    showNotification('Error sending response', 'error');
  }
}

// Close conversation
async function closeConversation(conversationId) {
  try {
    const res = await fetch(`${API_BASE}/messages/conversation/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const messages = await res.json();
    if (messages.length === 0) {
      showNotification('No messages found in this conversation', 'error');
      return;
    }

    const latestMessage = messages[messages.length - 1];

    await fetch(`${API_BASE}/messages/${latestMessage._id}/close`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    loadMessages();
    showNotification('Conversation closed!', 'success');

  } catch (err) {
    console.error(err);
    showNotification('Error closing conversation', 'error');
  }
}

// Open conversation (reopen a closed conversation)
async function openConversation(conversationId) {
  try {
    const res = await fetch(`${API_BASE}/messages/conversation/${conversationId}/open`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      showNotification('Conversation reopened!', 'success');
      loadMessages();
    } else {
      showNotification('Error reopening conversation', 'error');
    }
  } catch (err) {
    console.error(err);
    showNotification('Error reopening conversation', 'error');
  }
}

// Delete conversation
async function deleteConversation(conversationId) {
  console.log('deleteConversation called with:', conversationId, 'type:', typeof conversationId);
  
  // Validate conversationId
  if (!conversationId || 
      conversationId === 'undefined' || 
      conversationId === 'null' ||
      conversationId === 'unknown' ||
      conversationId.trim() === '' ||
      conversationId.length < 3) {
    console.error('Invalid conversationId:', conversationId);
    showNotification('Error: Invalid conversation ID', 'error');
    return;
  }
  
  // Additional validation: ensure it's a valid string format
  if (typeof conversationId !== 'string') {
    console.error('conversationId is not a string:', conversationId);
    showNotification('Error: Invalid conversation ID format', 'error');
    return;
  }
  
  if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
    console.log('Deleting conversation:', conversationId);
    try {
      const res = await authFetch(`${API_BASE}/messages/conversation/${encodeURIComponent(conversationId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Delete response:', res);
      if (res && res.ok) {
        console.log('Delete successful, reloading messages...');
        showNotification('Conversation deleted!', 'success');
        loadMessages();
      } else {
        const errorData = await res.json();
        console.error('Delete failed:', errorData);
        showNotification(errorData.message || 'Error deleting conversation', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showNotification('Error deleting conversation', 'error');
    }
  }
}

// Load users
async function loadUsers() {
  try {
    const res = await authFetch(`${API_BASE}/auth/users`);
    if (!res) return;

    const allUsers = await res.json();
    
    // Filter to only show admin/staff accounts (exclude customer accounts)
    const users = allUsers.filter(u => u.role === 'superadmin' || u.role === 'staff');
    
    const list = document.getElementById('users-list');

    if (!users || users.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>No Admin Users</h3>
          <p>No admin or staff accounts found.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = users.map(u => `
      <div class="user-item">
        <h3>${u.name}</h3>
        <p>${u.email}</p>
        <p><strong>Role:</strong> ${u.role === 'superadmin' ? 'Super Admin' : 'Staff'}</p>
        <button onclick="deleteUser('${u._id}')">Delete User</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    showNotification('Error loading users', 'error');
  }
}

// Delete user
async function deleteUser(id) {
  if (confirm('Delete this user?')) {
    try {
      await fetch(`${API_BASE}/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showNotification('User deleted successfully!', 'success');
      loadUsers();
    } catch (err) {
      console.error(err);
      showNotification('Error deleting user', 'error');
    }
  }
}

// Load profile
async function loadProfile() {
  try {
    // Fetch latest profile data from server
    const res = await authFetch(`${API_BASE}/auth/profile`);
    if (!res) return;
    
    const user = await res.json();
    
    // Update local storage with latest user data
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update profile sidebar
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    document.getElementById('profile-name-display').textContent = user.name;
    document.getElementById('profile-role-display').textContent = user.role === 'superadmin' ? 'Super Admin' : 'Staff';
    
    // Update avatar initial
    const initial = user.name.charAt(0).toUpperCase();
    const avatarInitial = document.getElementById('profile-avatar-initial');
    const avatarImg = document.getElementById('profile-avatar-img');
    
    if (user.profilePicture) {
      avatarImg.src = user.profilePicture;
      avatarImg.style.display = 'block';
      avatarInitial.style.display = 'none';
    } else {
      avatarImg.style.display = 'none';
      avatarInitial.style.display = 'flex';
      avatarInitial.textContent = initial;
    }
    
    // Update header avatar
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
      userAvatar.textContent = initial;
    }
    
    // Update personal info form
    document.getElementById('profile-first-name').value = firstName;
    document.getElementById('profile-last-name').value = lastName;
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-bio').value = user.bio || '';
    document.getElementById('profile-location').value = user.location || '';
    
    // Set 2FA toggle
    const twoFactorToggle = document.getElementById('two-factor-toggle');
    if (twoFactorToggle) {
      twoFactorToggle.checked = user.twoFactorEnabled || false;
    }
    
    // Load saved preferences
    loadPreferences(user.preferences);
    
    // Load activity log from server
    loadActivityLogFromServer();
    
    // Load active sessions from server
    loadActiveSessionsFromServer();
    
    // Initialize profile navigation
    initProfileNavigation();
    
    // Initialize form handlers
    initProfileFormHandlers();
    
    // Initialize password strength checker
    initPasswordStrength();
    
    // Initialize 2FA toggle
    initTwoFactorToggle();
    
  } catch (err) {
    console.error('Error loading profile:', err);
    showNotification('Error loading profile', 'error');
  }
}

// Load activity log from server
async function loadActivityLogFromServer() {
  try {
    const res = await authFetch(`${API_BASE}/auth/activity`);
    if (!res || !res.ok) {
      // Fallback to localStorage
      loadActivityLog();
      return;
    }
    
    const activities = await res.json();
    const timeline = document.getElementById('activity-timeline');
    
    if (timeline && activities && activities.length > 0) {
      timeline.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-icon ${activity.color || 'info'}">
            <i class="fas ${activity.icon || 'fa-circle'}"></i>
          </div>
          <div class="activity-content">
            <p class="activity-message">${activity.message}</p>
            <small class="activity-time">${formatActivityTime(activity.timestamp)}</small>
          </div>
        </div>
      `).join('');
    } else {
      // Fallback to localStorage
      loadActivityLog();
    }
  } catch (err) {
    console.error('Error loading activity log from server:', err);
    // Fallback to localStorage
    loadActivityLog();
  }
}

// Initialize profile navigation immediately
function initProfileNavigation() {
  const navItems = document.querySelectorAll('.profile-nav-item');
  const sections = document.querySelectorAll('.profile-section');
  
  if (navItems.length === 0) {
    console.log('Profile nav items not found yet');
    return;
  }
  
  navItems.forEach(item => {
    // Remove any existing listeners to avoid duplicates
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    
    newItem.addEventListener('click', function(e) {
      e.preventDefault();
      const targetSection = this.dataset.section;
      
      // Update active nav item
      const allNavItems = document.querySelectorAll('.profile-nav-item');
      allNavItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      // Show target section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetSection) {
          section.classList.add('active');
        }
      });
    });
  });
}

// Profile Form Handlers
function initProfileFormHandlers() {
  // Personal Info Form
  const personalInfoForm = document.getElementById('personal-info-form');
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const firstName = document.getElementById('profile-first-name').value.trim();
      const lastName = document.getElementById('profile-last-name').value.trim();
      const phone = document.getElementById('profile-phone').value.trim();
      const bio = document.getElementById('profile-bio').value.trim();
      const location = document.getElementById('profile-location').value.trim();
      
      const user = JSON.parse(localStorage.getItem('user'));
      
      try {
        const res = await authFetch(`${API_BASE}/auth/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${firstName} ${lastName}`,
            phone,
            bio,
            location
          })
        });
        
        if (res && res.ok) {
          const updatedUser = await res.json();
          localStorage.setItem('user', JSON.stringify(updatedUser));
          showNotification('Profile updated successfully!', 'success');
          loadProfile();
          logActivity('profile', 'Profile information updated');
        } else {
          const data = await res.json();
          showNotification(data.message || 'Failed to update profile', 'error');
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        showNotification('Error updating profile', 'error');
      }
    });
  }
  
  // Change Password Form
  const passwordForm = document.getElementById('change-password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-new-password').value;
      
      if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
      }
      
      if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
      }
      
      try {
        const res = await authFetch(`${API_BASE}/auth/password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (res && res.ok) {
          showNotification('Password changed successfully!', 'success');
          passwordForm.reset();
          logActivity('password', 'Password changed');
        } else {
          const data = await res.json();
          showNotification(data.message || 'Failed to change password', 'error');
        }
      } catch (err) {
        console.error('Error changing password:', err);
        showNotification('Error changing password', 'error');
      }
    });
  }
}

// Reset Personal Form
function resetPersonalForm() {
  loadProfile();
  showNotification('Changes discarded', 'info');
}

// Password Toggle Visibility
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const icon = field.nextElementSibling.querySelector('i');
  
  if (field.type === 'password') {
    field.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    field.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

// Password Strength Checker
function initPasswordStrength() {
  const newPasswordField = document.getElementById('new-password');
  const strengthBar = document.querySelector('.strength-bar');
  const strengthText = document.querySelector('.strength-text');
  
  if (newPasswordField) {
    newPasswordField.addEventListener('input', function() {
      const password = this.value;
      const strength = calculatePasswordStrength(password);
      
      strengthBar.className = 'strength-bar ' + strength.class;
      strengthText.textContent = strength.text;
      strengthText.className = 'strength-text ' + strength.class;
    });
  }
}

function calculatePasswordStrength(password) {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) {
    return { class: 'weak', text: 'Weak' };
  } else if (score <= 4) {
    return { class: 'fair', text: 'Fair' };
  } else if (score <= 5) {
    return { class: 'good', text: 'Good' };
  } else {
    return { class: 'strong', text: 'Strong' };
  }
}

// Profile Picture Upload
const avatarEditBtn = document.getElementById('avatar-edit-btn');
const profilePictureInput = document.getElementById('profile-picture-input');

if (avatarEditBtn && profilePictureInput) {
  avatarEditBtn.addEventListener('click', () => {
    profilePictureInput.click();
  });
  
  profilePictureInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image size must be less than 5MB', 'error');
      return;
    }
    
    // Preview image immediately
    const reader = new FileReader();
    reader.onload = async (e) => {
      const avatarImg = document.getElementById('profile-avatar-img');
      const avatarInitial = document.getElementById('profile-avatar-initial');
      
      avatarImg.src = e.target.result;
      avatarImg.style.display = 'block';
      avatarInitial.style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    // Upload to server
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    // Show loading state
    avatarEditBtn.disabled = true;
    avatarEditBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
      // Get fresh token if needed
      if (isTokenExpired()) {
        await refreshAuthToken();
      }
      
      const response = await fetch(`${API_BASE}/auth/profile/picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        const user = JSON.parse(localStorage.getItem('user'));
        user.profilePicture = data.profilePicture;
        localStorage.setItem('user', JSON.stringify(user));
        showNotification('Profile picture updated!', 'success');
        logActivity('profile', 'Profile picture updated');
        // Update header avatar
        updateUserInfo();
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Failed to upload profile picture', 'error');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      showNotification('Error uploading profile picture', 'error');
    } finally {
      avatarEditBtn.disabled = false;
      avatarEditBtn.innerHTML = '<i class="fas fa-camera"></i>';
    }
  });
}

// Two-Factor Authentication
function initTwoFactorToggle() {
  const toggle = document.getElementById('two-factor-toggle');
  const content = document.getElementById('two-factor-content');
  
  if (toggle && content) {
    toggle.addEventListener('change', async function() {
      content.style.display = this.checked ? 'block' : 'none';
      
      // Enable/disable 2FA on server
      try {
        const res = await authFetch(`${API_BASE}/auth/2fa/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: this.checked, secret: '' })
        });
        
        if (res && res.ok) {
          showNotification(this.checked ? '2FA enabled' : '2FA disabled', 'success');
          logActivity('security', `Two-factor authentication ${this.checked ? 'enabled' : 'disabled'}`);
        } else {
          this.checked = !this.checked;
          showNotification('Failed to toggle 2FA', 'error');
        }
      } catch (err) {
        console.error('Error toggling 2FA:', err);
        this.checked = !this.checked;
        showNotification('Error toggling 2FA', 'error');
      }
    });
  }
}

async function enableTwoFactor() {
  const code = document.getElementById('two-factor-code').value;
  if (code.length !== 6) {
    showNotification('Please enter a 6-digit code', 'error');
    return;
  }
  
  try {
    const res = await authFetch(`${API_BASE}/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    
    const data = await res.json();
    if (data.valid) {
      showNotification('Two-factor authentication enabled!', 'success');
      document.getElementById('two-factor-toggle').checked = true;
      document.getElementById('two-factor-content').style.display = 'none';
      logActivity('security', 'Two-factor authentication enabled');
    } else {
      showNotification('Invalid verification code', 'error');
    }
  } catch (err) {
    console.error('Error verifying 2FA code:', err);
    showNotification('Error verifying 2FA code', 'error');
  }
}

// Active Sessions - Load from Server
async function loadActiveSessionsFromServer() {
  try {
    const res = await authFetch(`${API_BASE}/auth/sessions`);
    if (!res) return;
    
    const sessions = await res.json();
    const sessionsList = document.getElementById('sessions-list');
    
    if (!sessions || sessions.length === 0) {
      sessionsList.innerHTML = `
        <div class="empty-state">
          <p>No active sessions</p>
        </div>
      `;
      return;
    }
    
    sessionsList.innerHTML = sessions.map(session => `
      <div class="session-item ${session.current ? 'current' : ''}">
        <div class="session-icon">
          <i class="fas fa-${session.device.toLowerCase().includes('mobile') ? 'mobile-alt' : 'desktop'}"></i>
        </div>
        <div class="session-info">
          <h4>${session.device} ${session.current ? '<span class="current-badge">Current</span>' : ''}</h4>
          <p>${session.location || 'Unknown'} • IP: ${session.ip || 'N/A'}</p>
          <small>Last active: ${formatActivityTime(session.lastActive)}</small>
        </div>
        ${!session.current ? `
          <button class="btn-danger-outline btn-sm" onclick="revokeSession('${session._id}')">
            Revoke
          </button>
        ` : ''}
      </div>
    `).join('');
    
  } catch (err) {
    console.error('Error loading sessions:', err);
    // Fallback to localStorage
    loadActiveSessions();
  }
}

// Revoke session
async function revokeSession(sessionId) {
  if (confirm('Are you sure you want to revoke this session?')) {
    try {
      const res = await authFetch(`${API_BASE}/auth/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (res && res.ok) {
        showNotification('Session revoked successfully', 'success');
        loadActiveSessionsFromServer();
      } else {
        showNotification('Error revoking session', 'error');
      }
    } catch (err) {
      console.error('Error revoking session:', err);
      showNotification('Error revoking session', 'error');
    }
  }
}

// Legacy function for fallback
function loadActivityLog() {
  const timeline = document.getElementById('activity-timeline');
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Get activities from localStorage or use default
  let activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
  
  if (activities.length === 0) {
    // Default activities
    activities = [
      { type: 'login', message: 'Logged in successfully', timestamp: new Date().toISOString(), icon: 'fa-sign-in-alt', color: 'success' },
      { type: 'profile', message: 'Profile information updated', timestamp: new Date(Date.now() - 86400000).toISOString(), icon: 'fa-user-edit', color: 'info' },
      { type: 'password', message: 'Password changed', timestamp: new Date(Date.now() - 172800000).toISOString(), icon: 'fa-key', color: 'warning' },
      { type: 'orders', message: 'Order #12345678 processed', timestamp: new Date(Date.now() - 259200000).toISOString(), icon: 'fa-shopping-cart', color: 'success' },
      { type: 'login', message: 'Logged in from new device', timestamp: new Date(Date.now() - 432000000).toISOString(), icon: 'fa-desktop', color: 'info' }
    ];
  }
  
  if (timeline) {
    timeline.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.color}">
          <i class="fas ${activity.icon}"></i>
        </div>
        <div class="activity-content">
          <p class="activity-message">${activity.message}</p>
          <small class="activity-time">${formatActivityTime(activity.timestamp)}</small>
        </div>
      </div>
    `).join('');
  }
}

function logActivity(type, message) {
  const activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
  
  const icons = {
    login: 'fa-sign-in-alt',
    profile: 'fa-user-edit',
    password: 'fa-key',
    orders: 'fa-shopping-cart',
    security: 'fa-shield-alt'
  };
  
  const colors = {
    login: 'success',
    profile: 'info',
    password: 'warning',
    orders: 'success',
    security: 'danger'
  };
  
  activities.unshift({
    type,
    message,
    timestamp: new Date().toISOString(),
    icon: icons[type] || 'fa-circle',
    color: colors[type] || 'info'
  });
  
  // Keep only last 50 activities
  localStorage.setItem('user_activities', JSON.stringify(activities.slice(0, 50)));
}

function formatActivityTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
  
  return date.toLocaleDateString();
}

function exportActivityLog() {
  const activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
  const csv = 'Type,Message,Timestamp\n' + activities.map(a => `${a.type},"${a.message}",${a.timestamp}`).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'activity-log.csv';
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Activity log exported', 'success');
}

// Preferences
function loadPreferences(serverPreferences = null) {
  const preferences = serverPreferences || JSON.parse(localStorage.getItem('user_preferences') || '{}');
  
  document.getElementById('language-select').value = preferences.language || 'en';
  document.getElementById('theme-select').value = preferences.theme || 'light';
  document.getElementById('timezone-select').value = preferences.timezone || 'UTC';
  document.getElementById('date-format-select').value = preferences.dateFormat || 'MM/DD/YYYY';
  
  // Notification settings
  document.getElementById('notify-orders').checked = preferences.notifications?.orders !== false;
  document.getElementById('notify-products').checked = preferences.notifications?.products !== false;
  document.getElementById('notify-system').checked = preferences.notifications?.system !== false;
  document.getElementById('notify-push').checked = preferences.notifications?.push || false;
  
  // Save preferences on change
  const preferenceSelects = document.querySelectorAll('.preference-select, #notify-orders, #notify-products, #notify-system, #notify-push');
  preferenceSelects.forEach(select => {
    select.removeEventListener('change', savePreferences);
    select.addEventListener('change', savePreferences);
  });
}

async function savePreferences() {
  const preferences = {
    language: document.getElementById('language-select').value,
    theme: document.getElementById('theme-select').value,
    timezone: document.getElementById('timezone-select').value,
    dateFormat: document.getElementById('date-format-select').value,
    notifications: {
      orders: document.getElementById('notify-orders').checked,
      products: document.getElementById('notify-products').checked,
      system: document.getElementById('notify-system').checked,
      push: document.getElementById('notify-push').checked
    }
  };
  
  // Save to server
  try {
    const res = await authFetch(`${API_BASE}/auth/preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences })
    });
    
    if (res && res.ok) {
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
      showNotification('Preferences saved!', 'success');
      logActivity('profile', 'Preferences updated');
    } else {
      showNotification('Failed to save preferences', 'error');
    }
  } catch (err) {
    console.error('Error saving preferences:', err);
    // Save locally as fallback
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    showNotification('Preferences saved locally', 'info');
  }
}

// Account Deletion/Deactivation
function confirmDeleteAccount() {
  const user = JSON.parse(localStorage.getItem('user'));
  
  const modal = document.createElement('div');
  modal.className = 'confirm-modal';
  modal.innerHTML = `
    <div class="confirm-content">
      <div class="confirm-header danger">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Delete Account</h3>
      </div>
      <div class="confirm-body">
        <p>Are you sure you want to delete your account? This action is <strong>IRREVERSIBLE</strong> and will:</p>
        <ul>
          <li> Permanently delete your account and all data</li>
          <li> Remove access to all products and orders</li>
          <li> Cancel all pending orders</li>
        </ul>
        <div class="form-group">
          <label for="confirm-delete-password">Enter your password to confirm:</label>
          <input type="password" id="confirm-delete-password" placeholder="Enter your password">
        </div>
      </div>
      <div class="confirm-actions">
        <button class="btn-secondary" onclick="this.closest('.confirm-modal').remove()">Cancel</button>
        <button class="btn-danger" id="confirm-delete-btn" disabled>Delete Account</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const passwordInput = document.getElementById('confirm-delete-password');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  
  passwordInput.addEventListener('input', function() {
    confirmBtn.disabled = this.value.length < 6;
  });
  
  confirmBtn.addEventListener('click', async () => {
    const password = passwordInput.value;
    
    try {
      const res = await authFetch(`${API_BASE}/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (res && res.ok) {
        showNotification('Account deleted successfully.', 'success');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = 'admin-login.html';
        }, 1500);
      } else {
        const data = await res.json();
        showNotification(data.message || 'Error deleting account', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error deleting account.', 'error');
    }
    modal.remove();
  });
}

async function deactivateAccount() {
  if (confirm('Are you sure you want to deactivate your account? You can reactivate later by logging in.')) {
    try {
      const res = await authFetch(`${API_BASE}/auth/deactivate`, {
        method: 'POST'
      });
      
      if (res && res.ok) {
        showNotification('Account deactivated. You can reactivate by logging in.', 'info');
        logActivity('security', 'Account deactivated');
        
        setTimeout(() => {
          localStorage.clear();
          window.location.href = 'admin-login.html';
        }, 1500);
      } else {
        showNotification('Error deactivating account', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error deactivating account.', 'error');
    }
  }
}

// Remove old delete account button listener since we have new functionality
// The old listener was attached to id="delete-account-btn" which no longer exists

// Close modal on outside click
window.addEventListener('click', (e) => {
  const modal = document.getElementById('edit-product-modal');
  if (e.target === modal) {
    closeEditModal();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // ESC to close modals
  if (e.key === 'Escape') {
    closeEditModal();
    const orderModals = document.querySelectorAll('.order-details-modal');
    orderModals.forEach(modal => modal.remove());
  }
});
