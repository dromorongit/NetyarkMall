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
    formData.append('price', Math.round(parseFloat(document.getElementById('product-price').value) * 100) / 100);
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
      formData.append('wholesalePrice', Math.round(parseFloat(document.getElementById('product-wholesale-price').value) * 100) / 100 || 0);
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
    console.log('Loading orders...');
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const orders = await res.json();
    console.log('Orders received:', orders);

    const list = document.getElementById('orders-list');

    if (!orders || orders.length === 0) {
      list.innerHTML = '<p>No orders found.</p>';
      return;
    }

    list.innerHTML = orders.map(o => {
      // Safe access to customer data
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
          <p><strong>Order ID:</strong> ${o._id || 'N/A'}</p>
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
    document.getElementById('orders-list').innerHTML = '<p>Error loading orders. Please try again.</p>';
  }
}

async function loadMessages() {
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
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
    list.innerHTML = Object.entries(conversations).map(([convId, msgs]) => {
      const latestMsg = msgs[msgs.length - 1];
      const senderInfo = msgs.find(m => m.sender !== 'admin') || latestMsg;
      const status = latestMsg.status || 'open';

      return `
        <div class="conversation-item" data-conversation-id="${convId}">
          <div class="conversation-header">
            <h4>${senderInfo.senderName || senderInfo.sender} (${senderInfo.senderEmail || 'No email'})</h4>
            <span class="conversation-status ${status}">${status}</span>
            <button class="close-conversation-btn" onclick="closeConversation('${convId}')">Close</button>
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
    price: Math.round(parseFloat(document.getElementById('edit-product-price').value) * 100) / 100,
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
    alert('Error loading order details: ' + err.message);
  }
}

async function respondToMessage(conversationId) {
  const response = document.getElementById(`response-${conversationId}`).value;
  if (!response) {
    alert('Please enter a response');
    return;
  }

  try {
    // Get the latest message in this conversation to respond to
    const res = await fetch(`${API_BASE}/messages/conversation/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const messages = await res.json();
    if (messages.length === 0) {
      alert('No messages found in this conversation');
      return;
    }

    const latestMessage = messages[messages.length - 1];

    // Send the response
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

    // Clear the response field
    document.getElementById(`response-${conversationId}`).value = '';

    // Refresh messages
    loadMessages();

    // Notify the user (this would be implemented on the frontend)
    console.log('Response sent, should notify user:', conversationId);

  } catch (err) {
    console.error(err);
    alert('Error sending response');
  }
}

async function closeConversation(conversationId) {
  try {
    // Get the latest message in this conversation to close
    const res = await fetch(`${API_BASE}/messages/conversation/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const messages = await res.json();
    if (messages.length === 0) {
      alert('No messages found in this conversation');
      return;
    }

    const latestMessage = messages[messages.length - 1];

    // Close the conversation
    await fetch(`${API_BASE}/messages/${latestMessage._id}/close`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Refresh messages
    loadMessages();

  } catch (err) {
    console.error(err);
    alert('Error closing conversation');
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