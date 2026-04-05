let map, placemark, route;

// Получение ID заказа из URL или из ScreenManager
function getOrderId() {
    if (typeof ScreenManager !== 'undefined' && ScreenManager.currentOrderId) {
        return ScreenManager.currentOrderId;
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Инициализация карты для отслеживания
function initTrackingMap(order) {
    if (typeof ymaps === 'undefined') {
        console.error('Yandex Maps API не загружена');
        return;
    }

    if (!order.coordinates) {
        document.getElementById('trackingMap').innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Адрес доставки не указан</p>';
        return;
    }

    ymaps.ready(function() {
        const coords = order.coordinates.split(',').map(Number);
        
        map = new ymaps.Map('trackingMap', {
            center: coords,
            zoom: 15,
            controls: ['zoomControl']
        });

        // Метка места доставки
        placemark = new ymaps.Placemark(coords, {
            balloonContent: order.address || 'Место доставки'
        }, {
            preset: 'islands#redDotIcon'
        });

        map.geoObjects.add(placemark);

        // Симуляция отслеживания груза
        simulateTracking(order, coords);
    });
}

// Симуляция движения груза
function simulateTracking(order, destinationCoords) {
    const trackingInfo = document.getElementById('trackingInfo');
    
    if (order.status === 'pending') {
        trackingInfo.innerHTML = '<p>Заказ ожидает отправки</p>';
        return;
    }

    if (order.status === 'delivered') {
        trackingInfo.innerHTML = '<p>Груз доставлен</p>';
        return;
    }

    // Для статуса "в пути" создаем симуляцию движения
    if (order.status === 'in-transit') {
        // Начальная точка (склад) - немного смещена от места доставки
        const startCoords = [
            destinationCoords[0] + 0.1,
            destinationCoords[1] + 0.1
        ];

        // Создаем маршрут
        ymaps.route([
            startCoords,
            destinationCoords
        ]).then(function(route) {
            map.geoObjects.add(route);
            
            // Метка текущего положения груза (симуляция)
            const vehiclePlacemark = new ymaps.Placemark(startCoords, {
                balloonContent: 'Груз в пути'
            }, {
                preset: 'islands#blueTruckIcon'
            });

            map.geoObjects.add(vehiclePlacemark);
            
            // Анимация движения (упрощенная версия)
            let progress = 0;
            const interval = setInterval(function() {
                progress += 0.05;
                if (progress >= 1) {
                    clearInterval(interval);
                    vehiclePlacemark.geometry.setCoordinates(destinationCoords);
                    trackingInfo.innerHTML = '<p>Груз прибыл к месту доставки</p>';
                } else {
                    const currentCoords = [
                        startCoords[0] + (destinationCoords[0] - startCoords[0]) * progress,
                        startCoords[1] + (destinationCoords[1] - startCoords[1]) * progress
                    ];
                    vehiclePlacemark.geometry.setCoordinates(currentCoords);
                    map.panTo(currentCoords, { duration: 500 });
                }
            }, 1000);
        });

        trackingInfo.innerHTML = '<p>Груз в пути к месту доставки</p>';
    }
}

// Загрузка данных заказа
function loadOrderDetails(orderId) {
    const id = orderId || getOrderId();
    
    if (!id) {
        alert('Заказ не найден');
        if (typeof ScreenManager !== 'undefined') {
            ScreenManager.showScreen('orders');
        } else {
            window.location.href = 'index.html';
        }
        return;
    }

    const order = OrdersStorage.getOrder(id);
    
    if (!order) {
        alert('Заказ не найден');
        if (typeof ScreenManager !== 'undefined') {
            ScreenManager.showScreen('orders');
        } else {
            window.location.href = 'index.html';
        }
        return;
    }

    // Заполнение информации о заказе
    document.getElementById('orderNumber').textContent = id.slice(-6);
    document.getElementById('materialInfo').textContent = Formatters.formatMaterial(order.material);
    document.getElementById('volumeInfo').textContent = `${order.volume} м³`;
    document.getElementById('dateInfo').textContent = Formatters.formatDate(order.date);
    document.getElementById('addressInfo').textContent = order.address || 'Не указан';
    
    if (order.comment) {
        document.getElementById('commentInfo').textContent = order.comment;
        document.getElementById('commentRow').style.display = 'flex';
    }

    // Обновление статуса
    updateStatusDisplay(order.status);

    // Инициализация карты
    initTrackingMap(order);
}

function updateStatusDisplay(status) {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    const statusIcon = document.getElementById('statusIcon');

    statusBadge.className = 'status-badge ' + status;
    
    const statusConfig = {
        'pending': { text: 'Ожидает', icon: 'schedule' },
        'in-transit': { text: 'В пути', icon: 'local_shipping' },
        'delivered': { text: 'Доставлен', icon: 'check_circle' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    statusText.textContent = config.text;
    statusIcon.textContent = config.icon;
}

// Инициализация при загрузке страницы (только если не используется ScreenManager)
if (typeof ScreenManager === 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadOrderDetails);
    } else {
        loadOrderDetails();
    }
}
