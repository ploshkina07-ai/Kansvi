function changeImage(thumbnail) {
  const mainImg = document.getElementById('mainImage');
  if (mainImg && thumbnail && thumbnail.src) {
    mainImg.src = thumbnail.src;
  }
}

function getProfileStorageKey() {
  let email = null;
  if (typeof getCurrentUserEmail === 'function') {
    email = getCurrentUserEmail();
  }
  if (!email) {
    email = localStorage.getItem('userEmail');
  }
  return email ? `userProfile_${email}` : 'userProfile_guest';
}

function getProfileData() {
  const raw = localStorage.getItem(getProfileStorageKey());
  const email = localStorage.getItem('userEmail') || '';
  const profile = raw ? JSON.parse(raw) : {};
  return {
    email,
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    birthdate: profile.birthdate || '',
    delivery: {
      address: profile.delivery?.address || '',
      city: profile.delivery?.city || '',
      house: profile.delivery?.house || '',
      apartment: profile.delivery?.apartment || '',
      comment: profile.delivery?.comment || ''
    },
    payment: {
      cardNumber: profile.payment?.cardNumber || '',
      cardExpiry: profile.payment?.cardExpiry || '',
      cardCVC: profile.payment?.cardCVC || ''
    }
  };
}

function saveProfileData(profilePart) {
  const raw = localStorage.getItem(getProfileStorageKey());
  const existing = raw ? JSON.parse(raw) : {};
  const merged = {
    ...existing,
    ...profilePart,
    delivery: {
      ...(existing.delivery || {}),
      ...(profilePart.delivery || {})
    },
    payment: {
      ...(existing.payment || {}),
      ...(profilePart.payment || {})
    }
  };
  localStorage.setItem(getProfileStorageKey(), JSON.stringify(merged));
}

function formatDate(dateString) {
  if (!dateString) return 'не вказано';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toggleFormInfo(form, info, showInfo) {
  if (form) form.style.display = showInfo ? 'none' : 'grid';
  if (info) info.style.display = showInfo ? 'block' : 'none';
}

function getLatestOrderKey() {
  const email = typeof getCurrentUserEmail === 'function' ? getCurrentUserEmail() : (localStorage.getItem('userEmail') || '').trim().toLowerCase();
  return email ? `latestOrder_${email}` : 'latestOrder_guest';
}

function getOrdersHistoryKey() {
  const email = typeof getCurrentUserEmail === 'function' ? getCurrentUserEmail() : (localStorage.getItem('userEmail') || '').trim().toLowerCase();
  return email ? `ordersHistory_${email}` : 'ordersHistory_guest';
}

function generateOrderNumber() {
  return `KSV-${Date.now().toString().slice(-8)}`;
}

function getPaymentLabel(method) {
  if (method === 'card') return 'Оплата карткою';
  if (method === 'apple') return 'Apple Pay';
  if (method === 'google') return 'Google Pay';
  if (method === 'cash') return 'Оплата при отриманні';
  return 'Не вказано';
}

function getDeliveryMethodLabel(method) {
  if (method === 'nova') return 'Нова Пошта';
  if (method === 'ukr') return 'Укрпошта';
  if (method === 'courier') return 'Курʼєр';
  return 'Не вказано';
}

function saveLatestOrder(orderData) {
  localStorage.setItem(getLatestOrderKey(), JSON.stringify(orderData));
}

function getLatestOrder() {
  const raw = localStorage.getItem(getLatestOrderKey());
  return raw ? JSON.parse(raw) : null;
}

function getOrdersHistory() {
  const raw = localStorage.getItem(getOrdersHistoryKey());
  if (raw) {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  const latestOrder = getLatestOrder();
  if (!latestOrder) return [];

  const migratedOrders = [latestOrder];
  localStorage.setItem(getOrdersHistoryKey(), JSON.stringify(migratedOrders));
  return migratedOrders;
}

function saveOrderToHistory(orderData) {
  const orders = getOrdersHistory();
  const updatedOrders = [orderData, ...orders.filter((order) => order.orderNumber !== orderData.orderNumber)];
  localStorage.setItem(getOrdersHistoryKey(), JSON.stringify(updatedOrders));
  saveLatestOrder(orderData);
}

function getOrderByNumber(orderNumber) {
  if (!orderNumber) return getLatestOrder();
  return getOrdersHistory().find((order) => order.orderNumber === orderNumber) || null;
}

function renderAccountInfo(profile, profileForm, profileInfo) {
  if (!profileInfo) return;
  profileInfo.innerHTML = `
    <p>Збережені дані профілю:</p>
    <p><strong>${profile.fullName || 'ПІБ не вказане'}</strong></p>
    <p>${profile.phone || 'Телефон не вказано'}</p>
    <p>Дата народження: ${formatDate(profile.birthdate)}</p>
  `;
}

function renderDeliveryInfo(delivery, deliveryForm, deliveryInfo) {
  if (!deliveryInfo) return;
  const hasData = delivery.address || delivery.city || delivery.house || delivery.apartment || delivery.comment;
  deliveryInfo.innerHTML = `
    <p>Збережені дані доставки:</p>
    <p><strong>Адреса:</strong> ${delivery.address || 'не вказано'}</p>
    <p><strong>Місто:</strong> ${delivery.city || 'не вказано'}</p>
    <p><strong>Будинок:</strong> ${delivery.house || 'не вказано'}</p>
    <p><strong>Квартира:</strong> ${delivery.apartment || 'не вказано'}</p>
    <p><strong>Коментар:</strong> ${delivery.comment || 'немає'}</p>
    ${hasData ? '<button type="button" class="button button-outline edit-button">Редагувати</button>' : ''}
  `;
  const editButton = deliveryInfo.querySelector('.edit-button');
  if (editButton && deliveryForm) {
    editButton.addEventListener('click', () => {
      deliveryForm.style.display = 'grid';
      deliveryInfo.style.display = 'none';
    });
  }
}

function renderPaymentInfo(payment, paymentForm, paymentInfo) {
  if (!paymentInfo) return;
  const cardNumberDisplay = payment.cardNumber ? `**** **** **** ${payment.cardNumber.slice(-4)}` : 'не вказано';
  const hasData = payment.cardNumber || payment.cardExpiry || payment.cardCVC;
  paymentInfo.innerHTML = `
    <p>Збережені платіжні дані:</p>
    <p><strong>Номер картки:</strong> ${cardNumberDisplay}</p>
    <p><strong>Термін дії:</strong> ${payment.cardExpiry || 'не вказано'}</p>
    <p><strong>CVC:</strong> ${payment.cardCVC ? '•••' : 'не вказано'}</p>
    ${hasData ? '<button type="button" class="button button-outline edit-button">Редагувати</button>' : ''}
  `;
  const editButton = paymentInfo.querySelector('.edit-button');
  if (editButton && paymentForm) {
    editButton.addEventListener('click', () => {
      paymentForm.style.display = 'grid';
      paymentInfo.style.display = 'none';
    });
  }
}

function renderOrdersInfo(ordersInfo) {
  if (!ordersInfo) return;

  const orders = getOrdersHistory();
  if (!orders.length) {
    ordersInfo.innerHTML = `
      <div class="order-empty-state">
        <p>У вас ще немає оформлених замовлень.</p>
        <a class="orders-link" href="delivery.html">Перейти до кошика</a>
      </div>
    `;
    return;
  }

  ordersInfo.innerHTML = orders.map((order, index) => {
    const itemsMarkup = (order.items || []).map((item) => `
      <div class="profile-order-item">
        <div>
          <strong>${item.name}</strong>
          <p>Кількість: ${item.quantity}</p>
        </div>
        <span>${item.subtotal}</span>
      </div>
    `).join('');

    return `
      <div class="profile-order-card">
        <div class="profile-order-header">
          <div>
            <p class="profile-order-label">${index === 0 ? 'Останнє замовлення' : 'Попереднє замовлення'}</p>
            <h2>${order.orderNumber || 'Без номера'}</h2>
          </div>
          <span class="profile-order-status">${order.status || 'В обробці'}</span>
        </div>
        <div class="profile-order-grid">
          <p><strong>Дата:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString('uk-UA') : 'Не вказано'}</p>
          <p><strong>Сума:</strong> ${order.total || '0.00 грн'}</p>
          <p><strong>Доставка:</strong> ${order.deliveryMethod || 'Не вказано'}</p>
          <p><strong>Відділення / адреса:</strong> ${order.deliveryLocation || 'Не вказано'}</p>
          <p><strong>Отримувач:</strong> ${order.recipient?.fullName || 'Не вказано'}</p>
          <p><strong>Телефон:</strong> ${order.recipient?.phone || 'Не вказано'}</p>
          <p><strong>Email:</strong> ${order.recipient?.email || 'Не вказано'}</p>
          <p><strong>Оплата:</strong> ${order.paymentMethod || 'Не вказано'}</p>
          <p class="full-width"><strong>Коментар:</strong> ${order.comment || 'Немає'}</p>
        </div>
        <div class="profile-order-items">
          <h3>Склад замовлення</h3>
          ${itemsMarkup}
        </div>
        <a class="orders-link" href="order-tracking.html?order=${encodeURIComponent(order.orderNumber || '')}">Відкрити сторінку відстеження</a>
      </div>
    `;
  }).join('');
}

function initScrollMenu() {
  const menu = document.querySelector('.main-nav');
  if (!menu) return;

  const updateMenuState = () => {
    if (window.scrollY > 0) {
      menu.classList.add('scrolled');
    } else {
      menu.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', updateMenuState);
  updateMenuState();
}

function initMobileNav() {
  const nav = document.querySelector('.main-nav');
  const navList = nav?.querySelector('.nav-list');
  if (!nav || !navList) return;

  if (!document.getElementById('mobile-nav-styles')) {
    const style = document.createElement('style');
    style.id = 'mobile-nav-styles';
    style.textContent = `
      .mobile-menu-toggle {
        display: none;
        width: 46px;
        height: 46px;
        padding: 0;
        border: 1px solid rgba(151, 133, 130, 0.35);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.9);
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 5px;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
      }

      .mobile-menu-toggle span {
        display: block;
        width: 20px;
        height: 2px;
        border-radius: 999px;
        background: #6d5d5a;
        transition: transform 0.25s ease, opacity 0.25s ease;
      }

      .main-nav.menu-open .mobile-menu-toggle span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }

      .main-nav.menu-open .mobile-menu-toggle span:nth-child(2) {
        opacity: 0;
      }

      .main-nav.menu-open .mobile-menu-toggle span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }

      @media (max-width: 768px) {
        .main-nav {
          padding: 0 16px !important;
        }

        .main-nav .mobile-quick-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
          margin-right: 12px;
        }

        .main-nav .mobile-quick-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          text-decoration: none;
        }

        .main-nav .mobile-quick-link .icons {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }

        .mobile-menu-toggle {
          display: inline-flex;
        }

        .main-nav .nav-list {
          position: absolute;
          top: calc(100% + 12px);
          left: 16px;
          right: 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 12px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.14);
          border: 1px solid rgba(231, 226, 219, 0.9);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-8px);
          transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s ease;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
        }

        .main-nav.menu-open .nav-list {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0);
        }

        .main-nav .nav-list li {
          width: 100%;
        }

        .main-nav .mobile-profile-item {
          order: -1;
          margin-bottom: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(151, 133, 130, 0.22);
        }

        .main-nav .nav-link,
        .main-nav .nav-icon {
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 48px;
          padding: 10px 12px;
          border-radius: 14px;
          text-decoration: none;
        }

        .main-nav .nav-link {
          font-size: 18px !important;
        }

        .main-nav .nav-link::after {
          display: none;
        }

        .main-nav .nav-link:hover,
        .main-nav .nav-icon:hover {
          background: #f7f1eb;
        }

        body.mobile-menu-open {
          overflow: hidden !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

 

  let toggleButton = nav.querySelector('.mobile-menu-toggle');
  if (!toggleButton) {
    toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'mobile-menu-toggle';
    toggleButton.setAttribute('aria-label', 'Відкрити меню');
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(toggleButton);
  }

  const mediaQuery = window.matchMedia('(max-width: 768px)');
  const profileMenuItem = navList.querySelector('a[href="profile.html"]')?.closest('li');
  if (profileMenuItem) {
    profileMenuItem.classList.add('mobile-profile-item');
  }

  const closeMenu = () => {
    nav.classList.remove('menu-open');
    document.body.classList.remove('mobile-menu-open');
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-label', 'Відкрити меню');
  };

  const openMenu = () => {
    nav.classList.add('menu-open');
    document.body.classList.add('mobile-menu-open');
    toggleButton.setAttribute('aria-expanded', 'true');
    toggleButton.setAttribute('aria-label', 'Закрити меню');
  };

  toggleButton.addEventListener('click', () => {
    if (!mediaQuery.matches) return;
    if (nav.classList.contains('menu-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navList.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (mediaQuery.matches) closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    if (!mediaQuery.matches || !nav.classList.contains('menu-open')) return;
    if (!nav.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const handleViewportChange = () => {
    if (!mediaQuery.matches) closeMenu();
  };

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleViewportChange);
  } else {
    mediaQuery.addListener(handleViewportChange);
  }

}

function initDeliveryTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  if (!tabs.length || !contents.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((btn) => btn.classList.remove('active'));
      contents.forEach((c) => c.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');

      if (tab.dataset.tab === 'description' && typeof renderCart === 'function') {
        renderCart();
      }
    });
  });
}

function initDeliveryForm() {
  const methodSelect = document.getElementById('deliveryMethod');
  const recipientToggleBtn = document.getElementById('recipientToggleBtn');
  const recipientFieldsBlock = document.getElementById('recipientFieldsBlock');
  const recipientInputs = Array.from(document.querySelectorAll('input[name^="recipient"]'));
  const savedAddressBlock = document.getElementById('savedAddressBlock');
  const savedAddressContent = document.getElementById('savedAddressContent');
  const editSavedAddressBtn = document.getElementById('editSavedAddressBtn');
  const locationLabel = document.getElementById('deliveryLocationLabel');
  const locationSelect = document.getElementById('deliveryLocation');
  const deliveryForm = document.getElementById('deliveryForm');
  if (!methodSelect || !locationLabel || !locationSelect || !deliveryForm) return;

  const locations = {
    nova: [
      { value: 'nova_1', text: 'Нова Пошта: відділення №1, Київ, Хрещатик, 1' },
      { value: 'nova_2', text: 'Нова Пошта: поштомат №256, Київ, Саксаганського, 78' },
      { value: 'nova_3', text: 'Нова Пошта: відділення №112, Львів, просп. Свободи, 10' }
    ],
    ukr: [
      { value: 'ukr_1', text: 'Укрпошта: відділення №12, Київ, Велика Васильківська, 23' },
      { value: 'ukr_2', text: 'Укрпошта: відділення №48, Львів, Січових Стрільців, 78' },
      { value: 'ukr_3', text: 'Укрпошта: відділення №104, Одеса, Дерибасівська, 5' }
    ]
  };

  const updateLocationOptions = () => {
    const selected = methodSelect.value;
    if (!selected || !locations[selected]) {
      locationLabel.style.display = 'none';
      locationSelect.innerHTML = '<option value="">Оберіть службу доставки</option>';
      locationSelect.required = false;
      return;
    }

    locationSelect.required = true;
    locationLabel.style.display = 'block';
    locationSelect.innerHTML = locations[selected]
      .map((item) => `<option value="${item.value}">${item.text}</option>`)
      .join('');
  };

  const renderSavedAddress = () => {
    if (!savedAddressBlock) return;

    const profile = getProfileData();
    const delivery = profile.delivery || {};
    const hasSavedAddress = delivery.address || delivery.city || delivery.house || delivery.apartment;

    savedAddressBlock.style.display = 'block';
    if (hasSavedAddress) {
      savedAddressContent.innerHTML = `
        <p><strong>Адреса:</strong> ${delivery.address || 'не вказано'}</p>
        <p><strong>Місто:</strong> ${delivery.city || 'не вказано'}</p>
        <p><strong>Будинок:</strong> ${delivery.house || 'не вказано'}</p>
        <p><strong>Квартира:</strong> ${delivery.apartment || 'не вказано'}</p>
        <p>${delivery.comment ? `Коментар: ${delivery.comment}` : ''}</p>
      `;
      if (editSavedAddressBtn) editSavedAddressBtn.textContent = 'Змінити адресу';
    } else {
      savedAddressContent.innerHTML = '<p>Збережена адреса відсутня. Збережіть її в профілі.</p>';
      if (editSavedAddressBtn) editSavedAddressBtn.textContent = 'Додати адресу';
    }
  };

  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  const cardDetails = document.getElementById('cardDetails');
  const updateCardVisibility = () => {
    const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (!cardDetails) return;
    cardDetails.style.display = selected === 'card' ? 'grid' : 'none';
  };

  let recipientFieldsVisible = false;
  const setRecipientFieldsVisible = (visible) => {
    if (!recipientFieldsBlock) return;
    recipientFieldsVisible = visible;
    recipientFieldsBlock.style.display = visible ? 'grid' : 'none';
    if (savedAddressBlock) {
      savedAddressBlock.style.display = visible ? 'none' : 'block';
    }
    recipientInputs.forEach((input) => {
      input.disabled = !visible;
      input.required = visible;
    });
    if (!recipientToggleBtn) return;
    recipientToggleBtn.classList.toggle('active', visible);
    const icon = recipientToggleBtn.querySelector('i');
    const label = recipientToggleBtn.querySelector('span');
    if (icon) icon.classList.toggle('hidden', !visible);
    if (label) label.textContent = 'Інший отримувач';
  };
  setRecipientFieldsVisible(false);
  if (recipientToggleBtn) {
    recipientToggleBtn.addEventListener('click', () => {
      setRecipientFieldsVisible(!recipientFieldsVisible);
    });
  }

  paymentRadios.forEach((radio) => radio.addEventListener('change', updateCardVisibility));
  updateCardVisibility();

  methodSelect.addEventListener('change', () => {
    updateLocationOptions();
  });
  updateLocationOptions();
  renderSavedAddress();

  if (editSavedAddressBtn) {
    editSavedAddressBtn.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });
  }

  deliveryForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const cart = typeof getCart === 'function' ? getCart() : [];
    if (!cart.length) {
      alert('Ваш кошик порожній. Додайте товари перед оформленням замовлення.');
      return;
    }

    const profile = getProfileData();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';
    const selectedMethod = methodSelect.value;
    const location = locationSelect.options[locationSelect.selectedIndex]?.text || 'не вибрано';
    const comment = document.querySelector('textarea[name="comment"]')?.value.trim() || '';
    const recipientLastName = document.querySelector('input[name="recipientLastName"]')?.value.trim() || '';
    const recipientFirstName = document.querySelector('input[name="recipientFirstName"]')?.value.trim() || '';
    const recipientPhone = document.querySelector('input[name="recipientPhone"]')?.value.trim() || '';
    const recipientAddress = document.querySelector('input[name="recipientAddress"]')?.value.trim() || '';
    const recipientEmail = document.querySelector('input[name="recipientEmail"]')?.value.trim() || '';

    const usingAlternateRecipient = recipientFieldsVisible;
    const recipientFullName = `${recipientLastName} ${recipientFirstName}`.trim();
    const orderTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
    const orderData = {
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      status: 'В обробці',
      total: `${orderTotal.toFixed(2)} грн`,
      items: cart.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        subtotal: `${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)} грн`
      })),
      deliveryMethod: getDeliveryMethodLabel(selectedMethod),
      deliveryLocation: location,
      paymentMethod: getPaymentLabel(paymentMethod),
      comment: comment || 'Немає',
      recipient: {
        fullName: usingAlternateRecipient ? (recipientFullName || 'Не вказано') : (profile.fullName || 'Не вказано'),
        phone: usingAlternateRecipient ? (recipientPhone || 'Не вказано') : (profile.phone || 'Не вказано'),
        email: usingAlternateRecipient ? (recipientEmail || profile.email || 'Не вказано') : (profile.email || 'Не вказано'),
        address: usingAlternateRecipient
          ? (recipientAddress || 'Не вказано')
          : [profile.delivery.address, profile.delivery.city, profile.delivery.house, profile.delivery.apartment].filter(Boolean).join(', ') || 'Не вказано'
      }
    };

    saveOrderToHistory(orderData);
    if (typeof clearCart === 'function') {
      localStorage.removeItem(typeof getCartKey === 'function' ? getCartKey() : 'shoppingCart_guest');
      if (typeof renderCart === 'function') renderCart();
    }
    window.location.href = `order-tracking.html?order=${encodeURIComponent(orderData.orderNumber)}`;
  });
}

function initOrderTrackingPage() {
  const orderNumber = document.getElementById('orderNumber');
  const orderDate = document.getElementById('orderDate');
  const orderStatus = document.getElementById('orderStatus');
  const orderTotal = document.getElementById('orderTotal');
  const orderDelivery = document.getElementById('orderDelivery');
  const orderLocation = document.getElementById('orderLocation');
  const orderPayment = document.getElementById('orderPayment');
  const orderRecipient = document.getElementById('orderRecipient');
  const orderPhone = document.getElementById('orderPhone');
  const orderEmail = document.getElementById('orderEmail');
  const orderAddress = document.getElementById('orderAddress');
  const orderComment = document.getElementById('orderComment');
  const orderItems = document.getElementById('orderItems');

  if (!orderNumber || !orderItems) return;

  const params = new URLSearchParams(window.location.search);
  const orderNumberFromUrl = params.get('order');
  const order = getOrderByNumber(orderNumberFromUrl);
  if (!order) {
    orderItems.innerHTML = '<p class="order-empty">Замовлення ще не створене. Поверніться до кошика та оформіть його.</p>';
    return;
  }

  orderNumber.textContent = order.orderNumber || 'Не вказано';
  orderDate.textContent = order.createdAt ? new Date(order.createdAt).toLocaleString('uk-UA') : 'Не вказано';
  orderStatus.textContent = order.status || 'В обробці';
  orderTotal.textContent = order.total || '0.00 грн';
  orderDelivery.textContent = order.deliveryMethod || 'Не вказано';
  orderLocation.textContent = order.deliveryLocation || 'Не вказано';
  orderPayment.textContent = order.paymentMethod || 'Не вказано';
  orderRecipient.textContent = order.recipient?.fullName || 'Не вказано';
  orderPhone.textContent = order.recipient?.phone || 'Не вказано';
  orderEmail.textContent = order.recipient?.email || 'Не вказано';
  orderAddress.textContent = order.recipient?.address || 'Не вказано';
  orderComment.textContent = order.comment || 'Немає';
  orderItems.innerHTML = (order.items || []).map((item) => `
    <div class="order-item">
      <div>
        <strong>${item.name}</strong>
        <p>Кількість: ${item.quantity}</p>
      </div>
      <div class="order-item-price">${item.subtotal}</div>
    </div>
  `).join('');
}

function initAuthForms() {
  const normalizeEmail = (value) => value?.trim().toLowerCase() || '';

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = normalizeEmail(document.getElementById('loginEmail')?.value);
      const password = document.getElementById('loginPassword')?.value;

      const savedEmail = normalizeEmail(localStorage.getItem('userEmail'));
      const savedPassword = localStorage.getItem('userPassword');

      if (email === savedEmail && password === savedPassword) {
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isLoggedIn', 'true');
        if (typeof mergeGuestCartToUser === 'function') {
          mergeGuestCartToUser();
        }
        window.location.href = 'profile.html';
      } else {
        alert('Невірний email або пароль!');
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = normalizeEmail(document.getElementById('signupEmail')?.value);
      const password = document.getElementById('signupPassword')?.value;

      localStorage.setItem('userEmail', email);
      localStorage.setItem('userPassword', password);

      alert('Акаунт створено! Тепер увійди.');
      window.location.href = 'login.html';
    });
  }
}

function initProfilePage() {
  const profileInfo = document.getElementById('profileInfo');
  const profileInfoActions = document.getElementById('profileInfoActions');
  const deliveryInfo = document.getElementById('deliveryInfo');
  const paymentInfo = document.getElementById('paymentInfo');
  const ordersInfo = document.getElementById('ordersInfo');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileForm = document.getElementById('profileForm');
  const deliveryForm = document.getElementById('deliveryForm');
  const paymentForm = document.getElementById('paymentForm');
  const emailInput = document.getElementById('profileEmail');
  const fullNameInput = document.getElementById('profileFullName');
  const phoneInput = document.getElementById('profilePhone');
  const birthdateInput = document.getElementById('profileBirthdate');
  const deliveryAddress = document.getElementById('deliveryAddress');
  const deliveryCity = document.getElementById('deliveryCity');
  const deliveryHouse = document.getElementById('deliveryHouse');
  const deliveryApartment = document.getElementById('deliveryApartment');
  const deliveryComment = document.getElementById('deliveryComment');
  const cardNumberInput = document.getElementById('cardNumber');
  const cardExpiryInput = document.getElementById('cardExpiry');
  const cardCVCInput = document.getElementById('cardCVC');

  if (!logoutBtn) return;

  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (isLoggedIn !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  const profile = getProfileData();
  if (emailInput) emailInput.value = profile.email || '';
  if (fullNameInput) fullNameInput.value = profile.fullName || '';
  if (phoneInput) phoneInput.value = profile.phone || '';
  if (birthdateInput) birthdateInput.value = profile.birthdate || '';
  if (deliveryAddress) deliveryAddress.value = profile.delivery.address || '';
  if (deliveryCity) deliveryCity.value = profile.delivery.city || '';
  if (deliveryHouse) deliveryHouse.value = profile.delivery.house || '';
  if (deliveryApartment) deliveryApartment.value = profile.delivery.apartment || '';
  if (deliveryComment) deliveryComment.value = profile.delivery.comment || '';
  if (cardNumberInput) cardNumberInput.value = profile.payment.cardNumber || '';
  if (cardExpiryInput) cardExpiryInput.value = profile.payment.cardExpiry || '';
  if (cardCVCInput) cardCVCInput.value = profile.payment.cardCVC || '';

  const hasAccount = profile.fullName || profile.phone || profile.birthdate;
  const hasDelivery = profile.delivery.address || profile.delivery.city || profile.delivery.house || profile.delivery.apartment || profile.delivery.comment;
  const hasPayment = profile.payment.cardNumber || profile.payment.cardExpiry || profile.payment.cardCVC;

  let accountEditButton = null;
  if (profileInfoActions) {
    accountEditButton = profileInfoActions.querySelector('.edit-button');
    if (!accountEditButton) {
      profileInfoActions.insertAdjacentHTML('afterbegin', '<button type="button" class="button button-outline edit-button">Редагувати</button>');
      accountEditButton = profileInfoActions.querySelector('.edit-button');
    }
  }

  const setAccountButtonMode = (mode) => {
    if (!accountEditButton) return;

    if (mode === 'edit') {
      accountEditButton.dataset.mode = 'edit';
      accountEditButton.textContent = 'Зберегти';
      accountEditButton.type = 'button';
      if (profileForm) profileForm.style.display = 'grid';
      if (profileInfo) profileInfo.style.display = 'none';
      return;
    }

    const hasSavedAccountData = Boolean(
      (fullNameInput?.value || '').trim() ||
      (phoneInput?.value || '').trim() ||
      (birthdateInput?.value || '').trim()
    );

    accountEditButton.dataset.mode = hasSavedAccountData ? 'view' : 'edit';
    accountEditButton.textContent = hasSavedAccountData ? 'Редагувати' : 'Зберегти';
    accountEditButton.type = 'button';

    if (hasSavedAccountData) {
      if (profileForm) profileForm.style.display = 'none';
      if (profileInfo) profileInfo.style.display = 'block';
    } else {
      if (profileForm) profileForm.style.display = 'grid';
      if (profileInfo) profileInfo.style.display = 'none';
    }
  };

  renderAccountInfo(profile, profileForm, profileInfo);
  renderDeliveryInfo(profile.delivery, deliveryForm, deliveryInfo);
  renderPaymentInfo(profile.payment, paymentForm, paymentInfo);
  renderOrdersInfo(ordersInfo);

  setAccountButtonMode(hasAccount ? 'view' : 'edit');
  toggleFormInfo(deliveryForm, deliveryInfo, hasDelivery);
  toggleFormInfo(paymentForm, paymentInfo, hasPayment);

  if (accountEditButton) {
    accountEditButton.addEventListener('click', () => {
      if (accountEditButton.dataset.mode === 'view') {
        setAccountButtonMode('edit');
        return;
      }

      if (accountEditButton.dataset.mode === 'edit' && profileForm) {
        profileForm.requestSubmit();
      }
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const savedProfile = {
        email: emailInput?.value || profile.email,
        fullName: fullNameInput?.value.trim() || '',
        phone: phoneInput?.value.trim() || '',
        birthdate: birthdateInput?.value || ''
      };
      saveProfileData(savedProfile);
      const updated = getProfileData();
      renderAccountInfo(updated, profileForm, profileInfo);
      setAccountButtonMode('view');
    });
  }

  if (deliveryForm) {
    deliveryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const savedDelivery = {
        delivery: {
          address: deliveryAddress?.value.trim() || '',
          city: deliveryCity?.value.trim() || '',
          house: deliveryHouse?.value.trim() || '',
          apartment: deliveryApartment?.value.trim() || '',
          comment: deliveryComment?.value.trim() || ''
        }
      };
      saveProfileData(savedDelivery);
      const updated = getProfileData();
      renderDeliveryInfo(updated.delivery, deliveryForm, deliveryInfo);
      toggleFormInfo(deliveryForm, deliveryInfo, true);
    });
  }

  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const savedPayment = {
        payment: {
          cardNumber: cardNumberInput?.value.trim() || '',
          cardExpiry: cardExpiryInput?.value.trim() || '',
          cardCVC: cardCVCInput?.value.trim() || ''
        }
      };
      saveProfileData(savedPayment);
      const updated = getProfileData();
      renderPaymentInfo(updated.payment, paymentForm, paymentInfo);
      toggleFormInfo(paymentForm, paymentInfo, true);
    });
  }

  logoutBtn.addEventListener('click', () => {
    localStorage.setItem('isLoggedIn', 'false');
    window.location.href = 'login.html';
  });
}

function initProfileTabs() {
  const tabButtons = document.querySelectorAll('.profile-nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  if (!tabButtons.length || !tabPanes.length) return;

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      tabPanes.forEach((pane) => pane.classList.remove('active'));

      button.classList.add('active');
      const target = document.getElementById(button.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

function initProfileExtras() {
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  const cardDetails = document.getElementById('cardDetails');
  const deliveryForm = document.getElementById('deliveryForm');
  const paymentForm = document.getElementById('paymentForm');

  const updateCardVisibility = () => {
    const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (!cardDetails) return;
    cardDetails.style.display = selected === 'card' ? 'grid' : 'none';
  };

  if (paymentRadios.length && cardDetails) {
    paymentRadios.forEach((radio) => radio.addEventListener('change', updateCardVisibility));
    updateCardVisibility();
  }

  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Спосіб оплати збережено.');
    });
  }
}

function getProductDetailsFromPage(button) {
  const dataName = button.dataset.name;
  const dataPrice = button.dataset.price;
  const dataImageUrl = button.dataset.imageUrl;
  const dataProductUrl = button.dataset.productUrl;

  let productName = dataName || document.querySelector('h1')?.textContent.trim();
  let productPrice = dataPrice;
  let productImageUrl = dataImageUrl || document.getElementById('mainImage')?.src || document.querySelector('.main-image img')?.src || document.querySelector('.product-images img')?.src;
  let productUrl = dataProductUrl || window.location.pathname;

  if (!productPrice) {
    const priceText = Array.from(document.querySelectorAll('.product-description li, .product-description p, .price, .product-details li, .product-details p, .product-description span'))
      .map((el) => el.textContent)
      .find((text) => /(?:ЦІНА|Ціна|price)/i.test(text));
    if (priceText) {
      const match = priceText.match(/(\d+[\.,]?\d*)/);
      if (match) productPrice = match[1].replace(',', '.');
    }
  }

  return {
    productName,
    productPrice,
    productImageUrl,
    productUrl,
  };
}

function setupAddToCartButton(button) {
  if (!button || button.dataset.cartInit === 'true') return;
  button.dataset.cartInit = 'true';

  button.addEventListener('click', function (event) {
    if (button.type === 'submit') {
      event.preventDefault();
    }

    const { productName, productPrice, productImageUrl, productUrl } = getProductDetailsFromPage(button);
    if (!productName || !productPrice) {
      console.warn('Не вдалося зібрати дані про товар для додавання до кошика. Перевірте структуру сторінки.');
      return;
    }

    if (typeof addToCart === 'function') {
      addToCart(productName, productPrice, productImageUrl, productUrl, '', button);
    } else {
      console.warn('addToCart не знайдено. Переконайтеся, що cart.js підключено.');
    }
  });
}

function initAddToCartButtons() {
  const manualButtons = Array.from(document.querySelectorAll('.add-to-cart'));
  manualButtons.forEach(setupAddToCartButton);

  const productSubmitButtons = Array.from(document.querySelectorAll('.product-form button[type="submit"]'));
  productSubmitButtons.forEach(setupAddToCartButton);
}

function shouldRenderGlobalFooter() {
  if (document.querySelector('footer')) return false;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  return !['login.html', 'signup.html'].includes(currentPage);
}

function ensureGlobalFooterStyles() {
  if (document.getElementById('global-footer-styles')) return;

  const style = document.createElement('style');
  style.id = 'global-footer-styles';
  style.textContent = `
    .site-footer-global {
      margin-top: 0;
      padding: 36px 20px;
      background: #f4efea;
      border-top: 1px solid rgba(151, 133, 130, 0.2);
      color: #3f3836;
      font-family: 'Montserrat', sans-serif;
    }

    .site-footer-global__container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .site-footer-global__grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
      align-items: start;
    }

    .site-footer-global__title {
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7b6763;
    }

    .site-footer-global__text,
    .site-footer-global__link {
      font-size: 15px;
      line-height: 1.7;
      color: #3f3836;
      text-decoration: none;
    }

    .site-footer-global__link:hover {
      color: #7b6763;
    }

    @media (max-width: 768px) {
      .site-footer-global {
        margin-top: 0;
        padding: 28px 16px;
      }

      .site-footer-global__grid {
        grid-template-columns: 1fr;
        gap: 18px;
      }
    }
  `;

  document.head.appendChild(style);
}

function renderGlobalFooter() {
  if (!shouldRenderGlobalFooter()) return;

  ensureGlobalFooterStyles();

  const footer = document.createElement('footer');
  footer.className = 'site-footer-global';
  footer.innerHTML = `
    <div class="site-footer-global__container">
      <div class="site-footer-global__grid">
        <div>
          <div class="site-footer-global__title">Kansvi</div>
          <p class="site-footer-global__text">© 2025 web.ploshka for Kansvi</p>
        </div>
        <div>
          <div class="site-footer-global__title">Instagram</div>
          <a class="site-footer-global__link" href="https://instagram.com/kansvi" target="_blank" rel="noopener noreferrer">@kansvi</a>
        </div>
        <div>
          <div class="site-footer-global__title">Контакти</div>
          <a class="site-footer-global__link" href="mailto:kansvi@gmail.com">kansvi@gmail.com</a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(footer);
}

function initPage() {
  initMobileNav();
  initScrollMenu();
  initDeliveryTabs();
  initDeliveryForm();
  initOrderTrackingPage();
  initAuthForms();
  initProfilePage();
  initProfileTabs();
  initProfileExtras();
  initAddToCartButtons();
  renderGlobalFooter();
}

document.addEventListener('DOMContentLoaded', initPage);
