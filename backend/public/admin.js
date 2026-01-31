const API_BASE = '/api';

// Token management system
let token = localStorage.getItem('token');
let refreshToken = localStorage.getItem('refreshToken');
let tokenExpiration = localStorage.getItem('tokenExpiration') ? new Date(localStorage.getItem('tokenExpiration')) : null;

// Set token expiration (1 hour from now)
function setTokenExpiration() {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1);
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

// Check if user is logged in
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

// Update user info in header
function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        if (userAvatar) {
            userAvatar.textContent = user.name.charAt(0).toUpperCase();
        }
        if (userName) {
            userName.textContent = user.name;
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
    
    const originalPrice = document.getElementById('product-original-price').value;
    if (originalPrice) {
      formData.append('originalPrice', Math.round(parseFloat(originalPrice) * 100) / 100);
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
}

// Load products
async function loadProducts() {
  try {
    const res = await authFetch(`${API_BASE}/products`);
    if (!res) return;

    const products = await res.json();
    const list = document.getElementById('products-list');
    
    if (!products || products.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No Products Yet</h3>
          <p>Add your first product to get started.</p>
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
        <p><strong>Price:</strong> GHS ${p.price}</p>
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
    console.error(err);
    showNotification('Error loading products', 'error');
  }
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
        <p><strong>Price:</strong> GHS ${p.price}</p>
        ${p.originalPrice ? `<p><strong>Original:</strong> GHS ${p.originalPrice}</p>` : ''}
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

    list.innerHTML = orders.map(o => {
      const customerName = o.user ? o.user.name :
        (o.customer && o.customer.firstName && o.customer.lastName) ?
        `${o.customer.firstName} ${o.customer.lastName} (Guest)` :
        'Unknown Customer';

      const customerEmail = (o.customer && o.customer.email) ? o.customer.email : 'N/A';
      const customerPhone = (o.customer && o.customer.phone) ? o.customer.phone : 'N/A';
      const orderTotal = o.total ? o.total.toLocaleString() : '0';
      const orderStatus = o.status || 'pending';
      const itemCount = o.products ? o.products.length : 0;
      const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Unknown';

      return `
        <div class="order-item">
          <h3>Order #${o._id ? o._id.substring(0, 8) : 'N/A'}</h3>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Total:</strong> ₵${orderTotal}</p>
          <p><strong>Status:</strong> ${orderStatus}</p>
          <p><strong>Items:</strong> ${itemCount} item(s)</p>
          <p><strong>Date:</strong> ${orderDate}</p>
          <div class="order-actions">
            <select onchange="updateOrderStatus('${o._id || ''}', this.value)">
              <option value="pending" ${orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="processing" ${orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
              <option value="shipped" ${orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button onclick="viewOrderDetails('${o._id || ''}')">View Details</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading orders:', err);
    showNotification('Error loading orders', 'error');
  }
}

// Load messages
async function loadMessages() {
  try {
    const res = await authFetch(`${API_BASE}/messages`);
    if (!res) return;

    const messages = await res.json();

    // Group messages by conversation
    const conversations = {};
    messages.forEach(m => {
      if (!conversations[m.conversationId]) {
        conversations[m.conversationId] = [];
      }
      conversations[m.conversationId].push(m);
    });

    const list = document.getElementById('messages-list');

    if (Object.keys(conversations).length === 0) {
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
      const latestMsg = msgs[msgs.length - 1];
      const senderInfo = msgs.find(m => m.sender !== 'admin') || latestMsg;
      const status = latestMsg.status || 'open';

      return `
        <div class="conversation-item" data-conversation-id="${convId}">
          <div class="conversation-header">
            <h4>${senderInfo.senderName || senderInfo.sender} (${senderInfo.senderEmail || 'No email'})</h4>
            <div style="display: flex; gap: 10px; align-items: center;">
              <span class="conversation-status ${status}">${status}</span>
              <button class="close-conversation-btn" onclick="closeConversation('${convId}')">Close</button>
            </div>
          </div>
          <div class="conversation-messages">
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
          <div class="conversation-actions">
            <textarea placeholder="Type your response..." id="response-${convId}"></textarea>
            <button onclick="respondToMessage('${convId}')">Send Response</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    showNotification('Error loading messages', 'error');
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

    document.getElementById('edit-product-image').value = '';
    document.getElementById('edit-product-modal').style.display = 'block';

  } catch (err) {
    console.error('Error editing product:', err);
    showNotification('Error editing product: ' + err.message, 'error');
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
    formData.append('stock', parseInt(document.getElementById('edit-product-stock').value));
    formData.append('category', document.getElementById('edit-product-category').value);
    formData.append('stockStatus', document.querySelector('input[name="edit-stock-status"]:checked').value);

    const imageFile = document.getElementById('edit-product-image').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

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
        <div class="order-details-header">
          <h2>Order Details - ${order._id}</h2>
          <button onclick="this.closest('.order-details-modal').remove()">&times;</button>
        </div>
        <div class="order-details-body">
          <div class="order-info-section">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${(order.customer && order.customer.firstName && order.customer.lastName) ? `${order.customer.firstName} ${order.customer.lastName}` : 'N/A'}</p>
            <p><strong>Email:</strong> ${(order.customer && order.customer.email) ? order.customer.email : 'N/A'}</p>
            <p><strong>Phone:</strong> ${(order.customer && order.customer.phone) ? order.customer.phone : 'N/A'}</p>
          </div>

          <div class="order-info-section">
            <h3>Shipping Information</h3>
            <p><strong>Address:</strong> ${(order.shipping && order.shipping.address) ? order.shipping.address : 'N/A'}</p>
            <p><strong>City:</strong> ${(order.shipping && order.shipping.city) ? order.shipping.city : 'N/A'}</p>
            <p><strong>Region:</strong> ${(order.shipping && order.shipping.region) ? order.shipping.region : 'N/A'}</p>
            <p><strong>Zone:</strong> ${(order.shipping && order.shipping.zone) ? order.shipping.zone : 'N/A'}</p>
            <p><strong>Method:</strong> ${(order.shipping && order.shipping.method) ? order.shipping.method : 'N/A'}</p>
          </div>

          <div class="order-info-section">
            <h3>Order Items</h3>
            ${(order.products && order.products.length > 0) ? order.products.map(item => `
              <div class="order-item-detail">
                <p><strong>Product:</strong> ${item.product && typeof item.product === 'object' ? item.product.name : item.product || 'N/A'}</p>
                <p><strong>Quantity:</strong> ${item.quantity || 0}</p>
              </div>
            `).join('') : '<p>No items found</p>'}
          </div>

          <div class="order-info-section">
            <h3>Order Summary</h3>
            <p><strong>Total:</strong> ₵${(order.total || 0).toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
            <p><strong>Status:</strong> ${order.status || 'pending'}</p>
            <p><strong>Order Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown'}</p>
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

// Load users
async function loadUsers() {
  try {
    const res = await authFetch(`${API_BASE}/auth/users`);
    if (!res) return;

    const users = await res.json();
    const list = document.getElementById('users-list');

    if (!users || users.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>No Users</h3>
          <p>No users found in the system.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = users.map(u => `
      <div class="user-item">
        <h3>${u.name}</h3>
        <p>${u.email}</p>
        <p><strong>Role:</strong> ${u.role}</p>
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
function loadProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  document.getElementById('profile-info').innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">
        <div class="avatar-circle">${user.name.charAt(0).toUpperCase()}</div>
      </div>
      <div class="profile-details">
        <h3>${user.name}</h3>
        <p class="profile-email">${user.email}</p>
        <span class="profile-role role-${user.role}">${user.role}</span>
        <p class="profile-joined">Member since ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
}

// Delete account
document.getElementById('delete-account-btn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const res = await fetch(`${API_BASE}/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
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
  }
});

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
