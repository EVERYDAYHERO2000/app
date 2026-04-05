// Менеджер экранов с поддержкой слайдов
const ScreenManager = {
    currentScreen: 'orders',
    screens: {
        orders: document.getElementById('screen-orders'),
        create: document.getElementById('screen-create'),
        detail: document.getElementById('screen-detail')
    },
    touchStartX: 0,
    touchEndX: 0,
    minSwipeDistance: 50,

    init: function() {
        // Инициализируем все экраны
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.style.transform = 'translateX(0)';
                screen.style.zIndex = '1';
            }
        });
        
        // Показываем экран списка заказов по умолчанию
        const ordersScreen = this.screens.orders;
        if (ordersScreen) {
            ordersScreen.style.display = 'flex';
            ordersScreen.style.zIndex = '10';
            ordersScreen.classList.add('active');
        }

        // Обработчики кнопок
        const createOrderBtn = document.getElementById('createOrderBtn');
        if (createOrderBtn) {
            createOrderBtn.addEventListener('click', () => this.showScreen('create'));
        }

        const backFromCreateBtn = document.getElementById('backFromCreateBtn');
        if (backFromCreateBtn) {
            backFromCreateBtn.addEventListener('click', () => this.showScreen('orders'));
        }

        const backFromDetailBtn = document.getElementById('backFromDetailBtn');
        if (backFromDetailBtn) {
            backFromDetailBtn.addEventListener('click', () => this.showScreen('orders'));
        }

        // Обработчики свайпов
        this.initSwipeHandlers();
    },

    showScreen: function(screenName, orderId = null) {
        const currentScreenElement = this.screens[this.currentScreen];
        const newScreenElement = this.screens[screenName];
        
        if (!newScreenElement || this.currentScreen === screenName) return;

        // Убираем класс active у текущего экрана
        if (currentScreenElement) {
            currentScreenElement.classList.remove('active');
            currentScreenElement.style.zIndex = '1';
            currentScreenElement.style.display = 'none';
            currentScreenElement.style.transform = 'translateX(0)';
        }

        // Убираем класс active у нового экрана
        newScreenElement.classList.remove('active');
        
        // Показываем новый экран без анимации
        newScreenElement.style.display = 'flex';
        newScreenElement.style.zIndex = '10';
        newScreenElement.style.transform = 'translateX(0)';
        newScreenElement.classList.add('active');

        // Обновляем текущий экран
        this.currentScreen = screenName;
        this.currentOrderId = orderId;

        // Если переходим к деталям заказа, загружаем данные
        if (screenName === 'detail' && orderId) {
            setTimeout(() => {
                if (typeof loadOrderDetails === 'function') {
                    loadOrderDetails(orderId);
                }
            }, 100);
        }

        // Если переходим к созданию заказа, инициализируем карту
        if (screenName === 'create') {
            setTimeout(() => {
                if (typeof initMap === 'function' && !window.mapInitialized) {
                    initMap();
                    window.mapInitialized = true;
                }
            }, 100);
        }
    },

    initSwipeHandlers: function() {
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.addEventListener('touchstart', (e) => {
                    this.touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });

                screen.addEventListener('touchend', (e) => {
                    this.touchEndX = e.changedTouches[0].screenX;
                    this.handleSwipe();
                }, { passive: true });
            }
        });
    },

    handleSwipe: function() {
        const swipeDistance = this.touchEndX - this.touchStartX;

        if (Math.abs(swipeDistance) < this.minSwipeDistance) {
            return;
        }

        // Свайп вправо (назад)
        if (swipeDistance > 0) {
            if (this.currentScreen === 'create' || this.currentScreen === 'detail') {
                this.showScreen('orders');
            }
        }
        // Свайп влево (вперед) - только для списка заказов
        else {
            // Можно добавить логику для свайпа вперед, если нужно
        }
    }
};

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ScreenManager.init());
} else {
    ScreenManager.init();
}
