$content = @"

/* Product Detail Page Wholesale Add to Cart Styles */

/* Wholesale Section in Product Detail Page */
.wholesale-options-section {
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(255, 107, 53, 0.03) 100%);
    border: 2px solid rgba(255, 107, 53, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
}

.wholesale-options-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 107, 53, 0.2);
}

.wholesale-options-header i {
    font-size: 1.5rem;
    color: var(--primary-orange);
}

.wholesale-options-header h3 {
    margin: 0;
    color: var(--primary-orange);
    font-size: 1.25rem;
}

.wholesale-price-display {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.wholesale-price-display .price {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-orange);
}

.wholesale-price-display .unit {
    font-size: 0.9rem;
    color: var(--medium-gray);
}

.wholesale-price-display .original-price {
    font-size: 1rem;
    color: var(--medium-gray);
    text-decoration: line-through;
}

/* Wholesale Quantity Selector */
.wholesale-quantity-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
}

.wholesale-quantity-selector label {
    font-weight: 600;
    color: var(--dark-gray);
    font-size: 0.95rem;
}

.wholesale-quantity-controls {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--white);
    border-radius: 25px;
    padding: 0.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
}

.wholesale-quantity-btn {
    background: var(--light-gray);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--dark-gray);
}

.wholesale-quantity-btn:hover:not(:disabled) {
    background: var(--primary-orange);
    color: var(--white);
    transform: scale(1.1);
}

.wholesale-quantity-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.wholesale-quantity-input {
    width: 80px;
    text-align: center;
    padding: 0.5rem;
    border: none;
    font-weight: 700;
    font-size: 1.1rem;
    background: transparent;
    color: var(--dark-gray);
}

.wholesale-quantity-input:focus {
    outline: none;
}

.moq-display {
    font-size: 0.85rem;
    color: var(--medium-gray);
    margin-top: 0.5rem;
}

.moq-display strong {
    color: var(--primary-orange);
}

/* Wholesale Add to Cart Button */
.add-wholesale-btn {
    background: linear-gradient(135deg, var(--primary-orange) 0%, #ff8c00 100%);
    color: var(--white);
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    width: 100%;
    margin-top: 1rem;
}

.add-wholesale-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #ff8c00 0%, var(--primary-orange) 100%);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}

.add-wholesale-btn:active:not(:disabled) {
    transform: translateY(-1px);
}

.add-wholesale-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
}

.add-wholesale-btn i {
    font-size: 1.2rem;
}

/* Wholesale Savings Badge */
.wholesale-savings-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, var(--success) 0%, #20c997 100%);
    color: var(--white);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: 0.75rem;
}

.wholesale-savings-badge i {
    font-size: 1rem;
}

/* Wholesale Tier Info */
.wholesale-tier-info {
    background: rgba(255, 107, 53, 0.05);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
}

.wholesale-tier-info h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: var(--dark-gray);
}

.tier-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.tier-list li {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 107, 53, 0.1);
    font-size: 0.85rem;
    color: var(--medium-gray);
}

.tier-list li:last-child {
    border-bottom: none;
}

.tier-list li strong {
    color: var(--primary-orange);
}

/* Mobile Wholesale Styles for Product Detail */
@media (max-width: 768px) {
    .wholesale-options-section {
        padding: 1.25rem 1rem;
        margin: 1rem 0;
    }

    .wholesale-options-header h3 {
        font-size: 1.1rem;
    }

    .wholesale-price-display .price {
        font-size: 1.75rem;
    }

    .wholesale-quantity-selector {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .wholesale-quantity-controls {
        align-self: center;
        width: 100%;
        max-width: 250px;
    }

    .wholesale-quantity-btn {
        width: 44px;
        height: 44px;
    }

    .wholesale-quantity-input {
        width: 100%;
        font-size: 1rem;
    }

    .add-wholesale-btn {
        padding: 1rem 1.5rem;
        font-size: 1rem;
    }

    .wholesale-tier-info {
        padding: 0.75rem;
    }

    .tier-list li {
        font-size: 0.8rem;
    }
}

/* Regular quantity selector (for non-wholesale products) */
.regular-quantity-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
}

.regular-quantity-selector label {
    font-weight: 600;
    color: var(--dark-gray);
    font-size: 0.95rem;
}

.regular-quantity-controls {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--white);
    border-radius: 25px;
    padding: 0.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
}

.regular-quantity-btn {
    background: var(--light-gray);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--dark-gray);
}

.regular-quantity-btn:hover:not(:disabled) {
    background: var(--primary-green);
    color: var(--white);
    transform: scale(1.1);
}

.regular-quantity-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.regular-quantity-input {
    width: 80px;
    text-align: center;
    padding: 0.5rem;
    border: none;
    font-weight: 700;
    font-size: 1.1rem;
    background: transparent;
    color: var(--dark-gray);
}

.regular-quantity-input:focus {
    outline: none;
}

/* Regular Add to Cart Button (for non-wholesale products) */
.regular-add-to-cart-btn {
    background: linear-gradient(135deg, var(--primary-green) 0%, #006600 100%);
    color: var(--white);
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    box-shadow: 0 4px 15px rgba(0, 128, 0, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    width: 100%;
    margin-top: 1rem;
}

.regular-add-to-cart-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #006600 0%, var(--primary-green) 100%);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 128, 0, 0.4);
}

.regular-add-to-cart-btn:active:not(:disabled) {
    transform: translateY(-1px);
}

.regular-add-to-cart-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 128, 0, 0.2);
}

.regular-add-to-cart-btn i {
    font-size: 1.2rem;
}

/* Mobile Responsive for Regular Quantity */
@media (max-width: 768px) {
    .regular-quantity-selector {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .regular-quantity-controls {
        align-self: center;
        width: 100%;
        max-width: 250px;
    }

    .regular-quantity-btn {
        width: 44px;
        height: 44px;
    }

    .regular-quantity-input {
        width: 100%;
        font-size: 1rem;
    }

    .regular-add-to-cart-btn {
        padding: 1rem 1.5rem;
        font-size: 1rem;
    }
}

/* End of Wholesale Add to Cart Styles */
"@
Add-Content -Path 'styles.css' -Value $content
