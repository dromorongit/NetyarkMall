const API_BASE = '/api'; // Adjust if needed

let token = localStorage.getItem('token');

// Check if user is logged in
if (!token) {
  window.location.href = 'admin-login.html';
} else {
  loadDashboard();
}


document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  token = null;
  window.location.href = 'admin-login.html';
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + '-tab').style.display = 'block';
  });
});

document.getElementById('product-wholesale').addEventListener('change', function() {
  const wholesalePriceField = document.getElementById('product-wholesale-price');
  if (this.checked) {
    wholesalePriceField.style.display = 'block';
    wholesalePriceField.required = true;
  } else {
    wholesalePriceField.style.display = 'none';
    wholesalePriceField.required = false;
    wholesalePriceField.value = '';
  }
});

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('shortDescription', document.getElementById('product-short-description').value);
    formData.append('longDescription', document.getElementById('product-long-description').value);
    formData.append('brand', document.getElementById('product-brand').value);
    const colors = document.getElementById('product-colors').value.split(',').map(c => c.trim()).filter(c => c);
    colors.forEach(color => formData.append('colors', color));
    const sizes = document.getElementById('product-sizes').value.split(',').map(s => s.trim()).filter(s => s);
    sizes.forEach(size => formData.append('sizes', size));
    formData.append('price', parseFloat(document.getElementById('product-price').value));
    formData.append('stock', parseInt(document.getElementById('product-stock').value));
    formData.append('category', document.getElementById('product-category').value);
    formData.append('image', document.getElementById('product-image').files[0]);
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
    // Add stock status field
    const stockStatus = document.querySelector('input[name="stock-status"]:checked').value;
    formData.append('stockStatus', stockStatus);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        loadProducts();
        document.getElementById('product-form').reset();
        document.getElementById('product-moq').value = '1';
      }
    } catch (err) {
      console.error(err);
    }
  });

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
      alert('Staff account created successfully');
      document.getElementById('create-staff-form').reset();
    } else {
      const data = await res.json();
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
});

async function loadDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role === 'superadmin') {
    document.getElementById('create-staff-section').style.display = 'block';
    document.querySelector('[data-tab="users"]').style.display = 'inline-block';
  } else {
    document.querySelector('[data-tab="users"]').style.display = 'none';
  }
  loadProducts();
  loadOrders();
  loadMessages();
  loadUsers();
  loadProfile();
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await res.json();
    const list = document.getElementById('products-list');
    list.innerHTML = products.map(p => `
      <div class="product-item">
        <h3>${p.name}</h3>
        <p><strong>Short Desc:</strong> ${p.shortDescription}</p>
        ${p.longDescription ? `<p><strong>Long Desc:</strong> ${p.longDescription}</p>` : ''}
        ${p.brand ? `<p><strong>Brand:</strong> ${p.brand}</p>` : ''}
        ${p.colors && p.colors.length ? `<p><strong>Colors:</strong> ${p.colors.join(', ')}</p>` : ''}
        ${p.sizes && p.sizes.length ? `<p><strong>Sizes:</strong> ${p.sizes.join(', ')}</p>` : ''}
        <p><strong>Price:</strong> GHS ${p.price}</p>
        <p><strong>Stock:</strong> ${p.stock}</p>
        <p><strong>Category:</strong> ${p.category}</p>
        <p><strong>Wholesale:</strong> ${p.isWholesale ? 'Yes (MOQ: ' + p.minOrderQty + ')' : 'No'}</p>
        <p><strong>Stock Status:</strong> ${p.stockStatus || 'in-stock'}</p>
        <p><strong>Sections:</strong> ${[
          p.isNewArrival ? 'New Arrivals' : '',
          p.isFastSelling ? 'Fast-Selling Items' : '',
          p.isShopByCategory ? 'Shop by Category' : ''
        ].filter(s => s).join(', ') || 'None'}</p>
        <button onclick="updateStock('${p._id}', ${p.stock})">Update Stock</button>
        <button onclick="editProduct('${p._id}')">Edit</button>
        <button onclick="deleteProduct('${p._id}')">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function loadOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const orders = await res.json();
    const list = document.getElementById('orders-list');

    if (orders.length === 0) {
      list.innerHTML = '<p>No orders found.</p>';
      return;
    }

    list.innerHTML = orders.map(o => `
      <div class="order-item">
        <p><strong>Order ID:</strong> ${o._id}</p>
        <p><strong>Customer:</strong> ${o.user ? o.user.name : `${o.customer.firstName} ${o.customer.lastName} (Guest)`}</p>
        <p><strong>Email:</strong> ${o.customer.email}</p>
        <p><strong>Phone:</strong> ${o.customer.phone}</p>
        <p><strong>Total:</strong> ₵${o.total.toLocaleString()}</p>
        <p><strong>Status:</strong> ${o.status}</p>
        <p><strong>Items:</strong> ${o.products.length} item(s)</p>
        <p><strong>Date:</strong> ${new Date(o.createdAt).toLocaleDateString()}</p>
        <div class="order-actions">
          <select onchange="updateOrderStatus('${o._id}', this.value)">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
          <button onclick="viewOrderDetails('${o._id}')">View Details</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading orders:', err);
    document.getElementById('orders-list').innerHTML = '<p>Error loading orders. Please try again.</p>';
  }
}

async function loadMessages() {
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const messages = await res.json();
    const list = document.getElementById('messages-list');
    list.innerHTML = messages.map(m => `
      <div class="message-item">
        <p><strong>${m.sender}:</strong> ${m.message}</p>
        <p>Response: ${m.response || 'No response yet'}</p>
        <textarea placeholder="Respond" id="response-${m._id}"></textarea>
        <button onclick="respondToMessage('${m._id}')">Respond</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

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
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  }
}

async function editProduct(id) {
  try {
    // Fetch the product data
    const response = await fetch(`${API_BASE}/products/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product data');
    }

    const product = await response.json();

    // Populate the edit modal with product data
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

    // Set stock status radio buttons
    const stockStatusRadios = document.getElementsByName('edit-stock-status');
    stockStatusRadios.forEach(radio => {
      if (radio.value === (product.stockStatus || 'in-stock')) {
        radio.checked = true;
      }
    });

    // Show the edit modal
    document.getElementById('edit-product-modal').style.display = 'block';

  } catch (err) {
    console.error('Error editing product:', err);
    alert('Error editing product: ' + err.message);
  }
}

function closeEditModal() {
  document.getElementById('edit-product-modal').style.display = 'none';
}

// Handle edit product form submission
document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('edit-product-id').value;
  const productData = {
    name: document.getElementById('edit-product-name').value,
    shortDescription: document.getElementById('edit-product-short-description').value,
    longDescription: document.getElementById('edit-product-long-description').value,
    brand: document.getElementById('edit-product-brand').value,
    colors: document.getElementById('edit-product-colors').value.split(',').map(c => c.trim()).filter(c => c),
    sizes: document.getElementById('edit-product-sizes').value.split(',').map(s => s.trim()).filter(s => s),
    price: parseFloat(document.getElementById('edit-product-price').value),
    stock: parseInt(document.getElementById('edit-product-stock').value),
    category: document.getElementById('edit-product-category').value,
    stockStatus: document.querySelector('input[name="edit-stock-status"]:checked').value
  };

  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      const errorData = await response.json();
      alert('Failed to update product: ' + (errorData.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error updating product:', err);
    alert('Error updating product: ' + err.message);
  }
});

async function deleteProduct(id) {
  if (confirm('Delete this product?')) {
    try {
      console.log('Deleting product:', id);
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Delete response status:', response.status);
      if (response.ok) {
        console.log('Product deleted successfully');
        loadProducts();
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert('Failed to delete product: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error deleting product: ' + err.message);
    }
  }
}

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
    loadOrders(); // Refresh the orders list
  } catch (err) {
    console.error(err);
  }
}

async function viewOrderDetails(orderId) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch order details');
    }

    const order = await res.json();

    // Create a modal to show order details
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
            <p><strong>Name:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
            <p><strong>Email:</strong> ${order.customer.email}</p>
            <p><strong>Phone:</strong> ${order.customer.phone}</p>
          </div>

          <div class="order-info-section">
            <h3>Shipping Information</h3>
            <p><strong>Address:</strong> ${order.shipping.address}</p>
            <p><strong>City:</strong> ${order.shipping.city}</p>
            <p><strong>Region:</strong> ${order.shipping.region}</p>
            <p><strong>Zone:</strong> ${order.shipping.zone}</p>
            <p><strong>Method:</strong> ${order.shipping.method}</p>
          </div>

          <div class="order-info-section">
            <h3>Order Items</h3>
            ${order.products.map(item => `
              <div class="order-item-detail">
                <p><strong>Product ID:</strong> ${item.product}</p>
                <p><strong>Quantity:</strong> ${item.quantity}</p>
              </div>
            `).join('')}
          </div>

          <div class="order-info-section">
            <h3>Order Summary</h3>
            <p><strong>Total:</strong> ₵${order.total.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

  } catch (err) {
    console.error('Error viewing order details:', err);
    alert('Error loading order details: ' + err.message);
  }
}

async function respondToMessage(id) {
  const response = document.getElementById(`response-${id}`).value;
  try {
    await fetch(`${API_BASE}/messages/${id}/respond`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ response })
    });
    loadMessages();
  } catch (err) {
    console.error(err);
  }
}

async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const users = await res.json();
    const list = document.getElementById('users-list');
    list.innerHTML = users.map(u => `
      <div class="user-item">
        <h3>${u.name} (${u.role})</h3>
        <p>${u.email}</p>
        <button onclick="deleteUser('${u._id}')">Delete</button>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function deleteUser(id) {
  if (confirm('Delete this user?')) {
    try {
      await fetch(`${API_BASE}/auth/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  }
}

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

document.getElementById('delete-account-btn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const res = await fetch(`${API_BASE}/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Account deleted successfully.');
        localStorage.clear();
        window.location.href = 'admin-login.html';
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting account.');
    }
  }
});