// scripts/cart.js

// 1. Управління даними
function getCurrentUserEmail() {
    const email = localStorage.getItem('userEmail');
    return email ? email.trim().toLowerCase() : null;
}

function getCartKey() {
    const userEmail = getCurrentUserEmail();
    return userEmail ? `shoppingCart_${userEmail}` : 'shoppingCart_guest';
}

function getCart() {
    const cart = localStorage.getItem(getCartKey());
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
    updateCartIconCount();
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

    let userCart = getCart();
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

function addToCart(productName, productPrice, productImageUrl, productUrl) {
    let cart = getCart();
    const price = parseFloat(productPrice);

    const existingItem = cart.find(item => item.name === productName);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: price,
            quantity: 1,
            imageUrl: productImageUrl,
            url: productUrl 
        });
    }

    saveCart(cart);
    showCartToast('Товар додано до кошику');
}

function showCartToast(message) {
    if (document.getElementById('cart-toast-styles')) {
        let toast = document.getElementById('cart-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cart-toast';
            toast.className = 'cart-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.remove('is-visible');
        void toast.offsetWidth;
        toast.classList.add('is-visible');

        clearTimeout(showCartToast.hideTimer);
        showCartToast.hideTimer = setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 2200);
        return;
    }

    const style = document.createElement('style');
    style.id = 'cart-toast-styles';
    style.textContent = `
        .cart-toast {
            position: fixed;
            left: 50%;
            bottom: 28px;
            transform: translateX(-50%) translateY(18px);
            background: rgba(43, 34, 33, 0.96);
            color: #fff;
            padding: 14px 20px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
            opacity: 0;
            pointer-events: none;
            z-index: 9999;
            transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .cart-toast.is-visible {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `;
    document.head.appendChild(style);

    let toast = document.getElementById('cart-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cart-toast';
        toast.className = 'cart-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');

    clearTimeout(showCartToast.hideTimer);
    showCartToast.hideTimer = setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 2200);
}

// 2. Оновлення лічильника навігації
function updateCartIconCount() {
    const cart = getCart();
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    // Шукаємо посилання на delivery.html
    const cartLink = document.querySelector('.main-nav a[href="/delivery.html"]'); 
    
    if (cartLink) {
        let countSpan = document.getElementById('cart-count');
        if (!countSpan) {
            countSpan = document.createElement('span');
            countSpan.id = 'cart-count';
            // Вставляємо лічильник після посилання
            cartLink.after(countSpan); 
        }

        if (totalItems > 0) {
            countSpan.textContent = totalItems;
            // Фіксовані стилі, які перекривають CSS, щоб уникнути "з'їжджання"
            countSpan.style.cssText = 'position: absolute; top: 8px; right: 8px; background: #c00; color: white; border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: bold; min-width: 10px; text-align: center; display: inline-block; z-index: 10; line-height: 1;';
        } else {
            countSpan.textContent = '';
            countSpan.style.display = 'none';
        }
    }
}

// 3. Функціонал сторінки Кошика (delivery.html)
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
        cartTotalElement.textContent = '0.00 UAH';
        // Приховуємо вкладку "Доставка", якщо кошик порожній
        if (deliveryTabButton) deliveryTabButton.style.display = 'none';
        return;
    }
    
    // Показуємо вкладку "Доставка"
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
                <p class="item-price">Ціна: ${item.price.toFixed(2)} UAH</p>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" data-index="${index}" data-action="decrease">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
            </div>
            <div class="cart-item-subtotal">
                ${itemTotal.toFixed(2)} UAH
            </div>
            <button class="cart-item-remove" data-index="${index}">&#10006;</button>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    cartTotalElement.textContent = total.toFixed(2) + ' UAH';

    // Додаємо слухачів подій для кнопок
    cartItemsContainer.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', handleQuantityChange);
    });
    cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', removeItem);
    });
}

function handleQuantityChange(event) {
    const index = event.currentTarget.dataset.index;
    const action = event.currentTarget.dataset.action;
    let cart = getCart();

    if (index >= 0 && index < cart.length) {
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
}

function removeItem(event) {
    const index = event.currentTarget.dataset.index;
    let cart = getCart();

    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1); 
        saveCart(cart);
        renderCart();
    }
}

function clearCart() {
    if (confirm('Ви впевнені, що хочете повністю очистити кошик?')) {
        localStorage.removeItem('shoppingCart');
        updateCartIconCount();
        renderCart();
    }
}

document.addEventListener('DOMContentLoaded', updateCartIconCount);
