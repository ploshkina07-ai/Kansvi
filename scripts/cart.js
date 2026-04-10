// scripts/cart.js

const CART_GUEST_KEY = 'shoppingCart_guest';
const CART_COUNT_BADGE_CLASS = 'cart-count-badge';

function getCurrentUserEmail() {
    const email = localStorage.getItem('userEmail');
    return email ? email.trim().toLowerCase() : null;
}

function getCartKey() {
    const userEmail = getCurrentUserEmail();
    return userEmail ? `shoppingCart_${userEmail}` : CART_GUEST_KEY;
}

function readCart(key = getCartKey()) {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Не вдалося прочитати кошик:', error);
        return [];
    }
}

function getCart() {
    return readCart();
}

function writeCart(cart, key = getCartKey()) {
    localStorage.setItem(key, JSON.stringify(cart));
    updateCartIconCount();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    Object.assign(toast.style, {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'rgba(30, 30, 30, 0.96)',
        color: '#fff',
        fontSize: '14px',
        lineHeight: '1.4',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateY(8px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
        maxWidth: 'calc(100vw - 32px)',
    });

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    window.setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        window.setTimeout(() => toast.remove(), 250);
    }, 1800);
}

function mergeGuestCartToUser() {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) return;

    const guestCart = readCart(CART_GUEST_KEY);
    if (!guestCart.length) {
        localStorage.removeItem(CART_GUEST_KEY);
        return;
    }

    const userKey = getCartKey();
    const userCart = readCart(userKey);

    guestCart.forEach((guestItem) => {
        const existingItem = userCart.find((cartItem) => cartItem.name === guestItem.name);

        if (existingItem) {
            existingItem.quantity += Number(guestItem.quantity) || 1;
        } else {
            userCart.push({
                name: guestItem.name,
                price: Number(guestItem.price) || 0,
                quantity: Number(guestItem.quantity) || 1,
                imageUrl: guestItem.imageUrl || '',
                url: guestItem.url || '#',
            });
        }
    });

    localStorage.removeItem(CART_GUEST_KEY);
    localStorage.setItem(userKey, JSON.stringify(userCart));
}

function addToCart(productName, productPrice, productImageUrl, productUrl) {
    const cartKey = getCartKey();
    const cart = readCart(cartKey);
    const price = Number(productPrice) || 0;

    const existingItem = cart.find((item) => item.name === productName);
    if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 0) + 1;
    } else {
        cart.push({
            name: productName,
            price,
            quantity: 1,
            imageUrl: productImageUrl || '',
            url: productUrl || '#',
        });
    }

    writeCart(cart, cartKey);
    showToast('Товар додано до кошику');
}

function getCartLinks() {
    return Array.from(document.querySelectorAll('.main-nav a[href="/delivery.html"]'));
}

function syncCartBadge(link, totalItems) {
    if (!link) return;

    link.style.position = 'relative';
    link.style.display = 'inline-flex';
    link.style.alignItems = 'center';
    link.style.justifyContent = 'center';
    link.style.overflow = 'visible';

    let badge = link.querySelector(`.${CART_COUNT_BADGE_CLASS}`);
    if (!badge) {
        badge = document.createElement('span');
        badge.className = CART_COUNT_BADGE_CLASS;
        badge.setAttribute('aria-hidden', 'true');
        link.appendChild(badge);
    }

    if (totalItems > 0) {
        badge.textContent = String(totalItems);
        badge.style.cssText = [
            'position: absolute',
            'top: -6px',
            'right: -6px',
            'min-width: 18px',
            'height: 18px',
            'padding: 0 4px',
            'border-radius: 999px',
            'background: #b20f0f',
            'color: #fff',
            'font-size: 10px',
            'font-weight: 700',
            'line-height: 18px',
            'text-align: center',
            'z-index: 5',
            'box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18)',
        ].join(';');
        badge.hidden = false;
    } else {
        badge.textContent = '';
        badge.hidden = true;
    }
}

function updateCartIconCount() {
    const totalItems = getCart().reduce((sum, item) => {
        return sum + (Number(item.quantity) || 0);
    }, 0);

    const cartLinks = getCartLinks();
    cartLinks.forEach((link) => syncCartBadge(link, totalItems));
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartItemsContainer || !cartTotalElement) return;

    const cart = getCart();
    const deliveryTabButton = document.querySelector('[data-tab="delivery"]');

    cartItemsContainer.innerHTML = '';

    if (!cart.length) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">Ваш кошик порожній. Час обрати щось прекрасне! ✨</p>';
        cartTotalElement.textContent = '0.00 UAH';
        if (deliveryTabButton) deliveryTabButton.style.display = 'none';
        updateCartIconCount();
        return;
    }

    if (deliveryTabButton) deliveryTabButton.style.display = 'block';

    let total = 0;

    cart.forEach((item, index) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const itemTotal = price * quantity;
        total += itemTotal;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.imageUrl || ''}" alt="${item.name || 'Товар'}">
            </div>
            <div class="cart-item-details">
                <a href="${item.url || '#'}" class="item-name">${item.name || 'Товар'}</a>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" data-index="${index}" data-action="decrease" type="button">-</button>
                <span class="quantity-value">${quantity}</span>
                <button class="quantity-btn" data-index="${index}" data-action="increase" type="button">+</button>
            </div>
            <div class="cart-item-subtotal">${itemTotal.toFixed(2)} UAH</div>
        `;
        cartItemsContainer.appendChild(row);
    });

    cartTotalElement.textContent = `${total.toFixed(2)} UAH`;

    cartItemsContainer.querySelectorAll('.quantity-btn').forEach((button) => {
        button.addEventListener('click', handleQuantityChange);
    });

}

function handleQuantityChange(event) {
    const index = Number(event.currentTarget.dataset.index);
    const action = event.currentTarget.dataset.action;
    const cart = getCart();

    if (!Number.isInteger(index) || index < 0 || index >= cart.length) return;

    const currentQuantity = Number(cart[index].quantity) || 0;
    if (action === 'increase') {
        cart[index].quantity = currentQuantity + 1;
    } else if (action === 'decrease') {
        cart[index].quantity = currentQuantity - 1;
    }

    if ((Number(cart[index].quantity) || 0) < 1) {
        cart.splice(index, 1);
    }

    writeCart(cart);
    renderCart();
}

function clearCart() {
    if (!confirm('Ви впевнені, що хочете повністю очистити кошик?')) return;

    localStorage.removeItem(getCartKey());
    updateCartIconCount();
    renderCart();
}

function initCartPage() {
    mergeGuestCartToUser();
    updateCartIconCount();

    if (document.getElementById('cart-items') && document.getElementById('cart-total')) {
        renderCart();
    }
}

document.addEventListener('DOMContentLoaded', initCartPage);
