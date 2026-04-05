// Хранилище заказов в localStorage
const OrdersStorage = {
    getOrders: function() {
        const orders = localStorage.getItem('orders');
        return orders ? JSON.parse(orders) : [];
    },

    saveOrders: function(orders) {
        localStorage.setItem('orders', JSON.stringify(orders));
    },

    addOrder: function(order) {
        const orders = this.getOrders();
        const newOrder = {
            ...order,
            id: Date.now().toString(),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        orders.unshift(newOrder);
        this.saveOrders(orders);
        return newOrder;
    },

    getOrder: function(id) {
        const orders = this.getOrders();
        return orders.find(order => order.id === id);
    },

    updateOrder: function(id, updates) {
        const orders = this.getOrders();
        const index = orders.findIndex(order => order.id === id);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updates };
            this.saveOrders(orders);
            return orders[index];
        }
        return null;
    }
};

// Утилиты для форматирования
const Formatters = {
    formatMaterial: function(material) {
        const materials = {
            'sand': 'Песок',
            'gravel': 'Щебень',
            'asphalt': 'Асфальт'
        };
        return materials[material] || material;
    },

    formatStatus: function(status) {
        const statuses = {
            'pending': 'Ожидает',
            'in-transit': 'В пути',
            'delivered': 'Доставлен'
        };
        return statuses[status] || status;
    },

    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },

    formatDateTime: function(dateString, timeString) {
        const date = this.formatDate(dateString);
        return `${date}, ${timeString}`;
    }
};

// Инициализация списка заказов на главной странице
function initOrdersList() {
    const ordersList = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyState');
    
    if (!ordersList) return;

    const orders = OrdersStorage.getOrders();

    if (orders.length === 0) {
        ordersList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    ordersList.style.display = 'flex';
    ordersList.innerHTML = '';

    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.onclick = () => {
        if (typeof ScreenManager !== 'undefined') {
            ScreenManager.showScreen('detail', order.id);
        } else {
            window.location.href = `order-detail.html?id=${order.id}`;
        }
    };

    const statusClass = order.status === 'pending' ? 'pending' : 
                       order.status === 'in-transit' ? 'in-transit' : 'delivered';

    card.innerHTML = `
        <div class="order-card-header">
            <div class="order-number">Заказ #${order.id.slice(-6)}</div>
            <div class="order-status ${statusClass}">${Formatters.formatStatus(order.status)}</div>
        </div>
        <div class="order-info">
            <div class="order-info-row">
                <span class="order-info-label">Материал:</span>
                <span class="order-info-value">${Formatters.formatMaterial(order.material)}</span>
            </div>
            <div class="order-info-row">
                <span class="order-info-label">Объем:</span>
                <span class="order-info-value">${order.volume} м³</span>
            </div>
            <div class="order-info-row">
                <span class="order-info-label">Дата доставки:</span>
                <span class="order-info-value">${Formatters.formatDate(order.date)}</span>
            </div>
            <div class="order-info-row">
                <span class="order-info-label">Адрес:</span>
                <span class="order-info-value">${order.address || 'Не указан'}</span>
            </div>
        </div>
    `;

    return card;
}

// Инициализация при загрузке страницы
function initApp() {
    initOrdersList();
    
    // Если используется ScreenManager, обновляем список при возврате на экран заказов
    if (typeof ScreenManager !== 'undefined') {
        const originalShowScreen = ScreenManager.showScreen;
        ScreenManager.showScreen = function(screenName, orderId) {
            originalShowScreen.call(this, screenName, orderId);
            if (screenName === 'orders') {
                initOrdersList();
            }
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
