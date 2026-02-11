// ====================
// Multi-Color Quantity Selector Functions
// ====================

// Change quantity for a specific color
function changeColorQuantity(color, delta) {
    try {
        console.log('changeColorQuantity called with:', { color, delta });
        
        const inputId = `qty-${color.replace(/\s+/g, '-')}`;
        const quantityInput = document.getElementById(inputId);
        if (!quantityInput) {
            console.error('Quantity input not found for color:', color);
            return;
        }
        
        const currentValue = parseInt(quantityInput.value) || 0;
        const minValue = 0;
        const maxValue = parseInt(quantityInput.max) || 999;
        let newValue = currentValue + delta;
        
        // Prevent decreasing below 0
        if (newValue < minValue) {
            newValue = minValue;
        }
        
        // Prevent increasing above max stock
        if (newValue > maxValue) {
            newValue = maxValue;
            showNotification(`Only ${maxValue} items available in stock.`, 'warning');
        }
        
        console.log('Color quantity adjustment:', { currentValue, minValue, maxValue, newValue, delta });
        
        quantityInput.value = newValue;
        
        // Update the Add to Cart button state
        updateMultiColorAddToCartButton();
    } catch (error) {
        console.error('Error in changeColorQuantity:', error);
        showNotification('Error adjusting quantity. Please try again.', 'error');
    }
}

// Update the multi-color Add to Cart button state
function updateMultiColorAddToCartButton() {
    const addBtn = document.getElementById('multiAddToCartBtn');
    if (!addBtn) return;
    
    // Check if any color has quantity > 0
    const quantityInputs = document.querySelectorAll('.color-quantity-controls .qty-input');
    let hasAnyQuantity = false;
    
    quantityInputs.forEach(input => {
        if (parseInt(input.value) > 0) {
            hasAnyQuantity = true;
        }
    });
    
    addBtn.disabled = !hasAnyQuantity;
}

// Handle multi-color Add to Cart
async function handleMultiColorAddToCart(productId) {
    try {
        console.log('handleMultiColorAddToCart called with productId:', productId);
        
        // Collect all color quantities
        const colorQuantities = {};
        const quantityInputs = document.querySelectorAll('.color-quantity-controls .qty-input');
        
        quantityInputs.forEach(input => {
            const color = input.id.replace('qty-', '').replace(/-/g, ' ');
            const quantity = parseInt(input.value) || 0;
            if (quantity > 0) {
                colorQuantities[color] = quantity;
            }
        });
        
        console.log('Color quantities to add:', colorQuantities);
        
        if (Object.keys(colorQuantities).length === 0) {
            showNotification('Please select quantities for at least one color.', 'warning');
            return;
        }
        
        // Add each color as a separate cart item
        for (const [color, quantity] of Object.entries(colorQuantities)) {
            await addToCart(productId, quantity, 'product-detail', color);
        }
        
        // Reset all quantity inputs
        quantityInputs.forEach(input => {
            input.value = 0;
        });
        
        updateMultiColorAddToCartButton();
        
    } catch (error) {
        console.error('Error in handleMultiColorAddToCart:', error);
        showNotification('Error adding items to cart. Please try again.', 'error');
    }
}

// Export multi-color functions to window
window.changeColorQuantity = changeColorQuantity;
window.updateMultiColorAddToCartButton = updateMultiColorAddToCartButton;
window.handleMultiColorAddToCart = handleMultiColorAddToCart;
