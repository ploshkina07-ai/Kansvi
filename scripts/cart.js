// scripts/cart.js

function getCurrentUserEmail() {
    const email = localStorage.getItem('userEmail');
    return email ? email.trim().toLowerCase() : null;
}

function getCartKey() {
    const userEmail = getCurrentUserEmail();
    return userEmail ? `shoppingCart_${userEmail}` : 'shoppingCart_guest';
}

function getCart() {
    const cartRaw = localStorage.getItem(getCartKey());
    return cartRaw ? JSON.parse(cartRaw) : [];
}

function saveCart(cart) {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
    updateCartIconCount();
}

function ensureCartFeedbackStyles() {
    if (document.getElementById('cart-feedback-styles')) return;

    const style = document.createElement('style');
    style.id = 'cart-feedback-styles';
    style.textContent = `
        .cart-link-bump {
            animation: cartLinkBump 0.5s ease;
        }

        .add-to-cart-feedback {
            animation: addToCartPulse 0.55s ease;
        }

        .add-to-cart-feedback-success {
            box-shadow: 0 0 0 0 rgba(151, 133, 130, 0.35);
            animation: addToCartSuccess 0.8s ease;
        }

        @keyframes cartLinkBump {
            0% { transform: scale(1); }
            35% { transform: scale(1.14); }
            65% { transform: scale(0.96); }
            100% { transform: scale(1); }
        }

        @keyframes addToCartPulse {
            0% { transform: scale(1); }
            45% { transform: scale(0.96); }
            100% { transform: scale(1); }
        }

        @keyframes addToCartSuccess {
            0% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(151, 133, 130, 0.35);
            }
            50% {
                transform: scale(1.03);
                box-shadow: 0 0 0 10px rgba(151, 133, 130, 0);
            }
            100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(151, 133, 130, 0);
            }
        }
    `;
    document.head.appendChild(style);
}

function mergeGuestCartToUser() {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) return;

    const guestCartRaw = localStorage.getItem('shoppingCart_guest');
    if (!guestCartRaw) return;

    const guestCart = JSON.parse(guestCartRaw);
    if (!Array.isArray(guestCart) || guestCart.length === 0) {
        localStorage.removeItem('shoppingCart_guest');
        return;
    }

    const userCart = getCart();
    guestCart.forEach((item) => {
        const existingItem = userCart.find((cartItem) => cartItem.name === item.name);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            userCart.push(item);
        }
    });

    localStorage.removeItem('shoppingCart_guest');
    saveCart(userCart);
}

function addToCart(productName, productPrice, productImageUrl, productUrl, productDescription, sourceButton) {
    if (!productName) {
        console.warn('Не вказана назва товару для додавання в кошик.');
        return;
    }

    const cart = getCart();
    const price = parseFloat(productPrice) || 0;
    const existingItem = cart.find((item) => item.name === productName);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price,
            quantity: 1,
            imageUrl: productImageUrl || '',
            url: productUrl || window.location.pathname,
            description: productDescription || ''
        });
    }

    saveCart(cart);
    triggerCartIconAnimation(sourceButton);
}

function triggerCartIconAnimation(sourceButton) {
    ensureCartFeedbackStyles();

    const cartLink = document.querySelector('.main-nav a[href="/delivery.html"]');
    if (sourceButton) {
        sourceButton.classList.remove('add-to-cart-feedback', 'add-to-cart-feedback-success');
        void sourceButton.offsetWidth;
        sourceButton.classList.add('add-to-cart-feedback', 'add-to-cart-feedback-success');
        setTimeout(() => {
            sourceButton.classList.remove('add-to-cart-feedback', 'add-to-cart-feedback-success');
        }, 850);
    }

    if (!cartLink) return;

    if (window.getComputedStyle(cartLink).position === 'static') {
        cartLink.style.position = 'relative';
    }

    cartLink.classList.remove('cart-link-bump');
    void cartLink.offsetWidth;
    cartLink.classList.add('cart-link-bump');

    const badge = document.createElement('span');
    badge.textContent = '+1';
    badge.style.cssText =
        'position:absolute; top:-8px; right:-8px; background:#8d6b8f; color:#fff; border-radius:999px; padding:4px 8px; font-size:12px; font-weight:700; line-height:1; pointer-events:none; opacity:1; transform:translateY(0) scale(1); transition:transform 0.45s ease, opacity 0.45s ease;';
    cartLink.appendChild(badge);

    requestAnimationFrame(() => {
        badge.style.transform = 'translateY(-28px) scale(1.08)';
        badge.style.opacity = '0';
    });

    setTimeout(() => {
        if (badge.parentNode) badge.parentNode.removeChild(badge);
        cartLink.classList.remove('cart-link-bump');
    }, 500);
}

function updateCartIconCount() {
    const cart = getCart();
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartLink = document.querySelector('.main-nav a[href="/delivery.html"]');
    if (!cartLink) return;

    if (window.getComputedStyle(cartLink).position === 'static') {
        cartLink.style.position = 'relative';
    }

    let countSpan = cartLink.querySelector('#cart-count');
    if (!countSpan) {
        countSpan = document.createElement('span');
        countSpan.id = 'cart-count';
        countSpan.style.cssText =
            'position:absolute; top:-8px; right:-8px; background:#c00; color:#fff; border-radius:50%; padding:3px 7px; font-size:10px; font-weight:700; min-width:16px; text-align:center; display:inline-flex; align-items:center; justify-content:center; line-height:1;';
        cartLink.appendChild(countSpan);
    }

    if (totalItems > 0) {
        countSpan.textContent = totalItems;
        countSpan.style.display = 'inline-flex';
    } else {
        countSpan.style.display = 'none';
    }
}

function renderCart() {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const deliveryTabButton = document.querySelector('[data-tab="delivery"]');

    if (!cartItemsContainer || !cartTotalElement) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">Ваш кошик порожній. Час обрати щось прекрасне! ✨</p>';
        cartTotalElement.textContent = '0.00 грн';
        if (deliveryTabButton) deliveryTabButton.style.display = 'none';
        return;
    }

    if (deliveryTabButton) deliveryTabButton.style.display = 'block';

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.imageUrl}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <a href="${item.url}" class="item-name">${item.name}</a>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
            </div>
            <div class="cart-item-subtotal">
                ${itemTotal.toFixed(2)} грн
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    cartTotalElement.textContent = total.toFixed(2) + ' грн';
    cartItemsContainer.querySelectorAll('.quantity-btn').forEach((button) => {
        button.addEventListener('click', handleQuantityChange);
    });
}

function handleQuantityChange(event) {
    const index = parseInt(event.currentTarget.dataset.index, 10);
    const action = event.currentTarget.dataset.action;
    let cart = getCart();

    if (!Number.isInteger(index) || index < 0 || index >= cart.length) return;

    if (action === 'increase') {
        cart[index].quantity += 1;
    } else if (action === 'decrease') {
        cart[index].quantity -= 1;
    }

    if (cart[index] && cart[index].quantity < 1) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    renderCart();
}

function removeItem(event) {
    const index = parseInt(event.currentTarget.dataset.index, 10);
    let cart = getCart();

    if (!Number.isInteger(index) || index < 0 || index >= cart.length) return;

    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

function clearCart() {
    if (confirm('Ви впевнені, що хочете повністю очистити кошик?')) {
        localStorage.removeItem(getCartKey());
        updateCartIconCount();
        renderCart();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateCartIconCount();
    renderCart();
});
