let map, placemark;

// Данные о материалах и ценах
const materialData = {
    sand: [
        { name: 'Песок карьерный', price: 900 },
        { name: 'ПГС (до 45% гравия)', price: 1600 },
        { name: 'Песок сеяный', price: 1100 },
        { name: 'Песок мытый', price: 1600 }
    ],
    gravel: [
        { name: 'Щебень вторичный', price: 2100 },
        { name: 'Щебень гравийный', price: 3600 },
        { name: 'Щебень известняковый', price: 2900 },
        { name: 'Щебень гранитный', price: 4700 }
    ],
    asphalt: [
        { name: 'Асфальтовая крошка', price: 2200 }
    ]
};

// Инициализация карты
function initMap() {
    if (typeof ymaps === 'undefined') {
        console.error('Yandex Maps API не загружена');
        return;
    }

    ymaps.ready(function() {
        map = new ymaps.Map('map', {
            center: [55.751574, 37.573856], // Москва по умолчанию
            zoom: 10,
            controls: ['zoomControl', 'geolocationControl']
        });

        // Обработчик клика по карте
        map.events.add('click', function(e) {
            const coords = e.get('coords');
            
            // Удаляем предыдущую метку
            if (placemark) {
                map.geoObjects.remove(placemark);
            }

            // Создаем новую метку
            placemark = new ymaps.Placemark(coords, {
                balloonContent: 'Место доставки'
            }, {
                preset: 'islands#redDotIcon'
            });

            map.geoObjects.add(placemark);
            map.panTo(coords);

            // Сохраняем координаты сразу
            const coordsString = coords.join(',');
            const coordinatesInput = document.getElementById('coordinates');
            const addressInput = document.getElementById('address');
            
            if (coordinatesInput) {
                coordinatesInput.value = coordsString;
            }

            // Получаем адрес по координатам
            ymaps.geocode(coords).then(function(res) {
                const firstGeoObject = res.geoObjects.get(0);
                const address = firstGeoObject ? firstGeoObject.getAddressLine() : 'Адрес не найден';
                if (addressInput) {
                    addressInput.value = address;
                }
                // Показываем адрес пользователю
                const addressDisplay = document.getElementById('addressDisplay');
                const addressText = document.getElementById('addressText');
                if (addressDisplay && addressText) {
                    addressText.textContent = address;
                    addressDisplay.style.display = 'block';
                }
            });
        });

        // Определение местоположения пользователя (только при открытии шторки)
        // Убрано автоматическое определение, чтобы не мешать пользователю
    });
}

// Обновление подтипов материала
function updateMaterialSubtypes(material) {
    const subtypeGroup = document.getElementById('subtypeGroup');
    const subtypeSelect = document.getElementById('materialSubtype');
    const subtypeLabel = document.querySelector('#subtypeGroup label');
    
    if (!subtypeGroup || !subtypeSelect) return;
    
    const subtypes = materialData[material] || [];
    
    // Обновляем текст лейбла в зависимости от материала
    const materialNames = {
        'sand': 'Песок',
        'gravel': 'Щебень',
        'asphalt': 'Асфальт'
    };
    
    if (subtypeLabel && materialNames[material]) {
        subtypeLabel.textContent = materialNames[material];
    }
    
    const shouldHideSubtype = material === 'asphalt';

    if (subtypes.length === 0 || shouldHideSubtype) {
        subtypeGroup.style.display = 'none';
        subtypeSelect.removeAttribute('required');
        if (subtypes.length > 0) {
            subtypeSelect.value = '0';
        }
        calculatePrice();
        return;
    }
    
    subtypeGroup.style.display = 'block';
    subtypeSelect.setAttribute('required', 'required');
    subtypeSelect.innerHTML = '<option value="">Выберите подтип</option>';
    
    subtypes.forEach((subtype, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = subtype.name;
        subtypeSelect.appendChild(option);
    });
    
    // Выбираем первый подтип по умолчанию
    if (subtypes.length > 0) {
        subtypeSelect.value = '0';
    }
    
    calculatePrice();
}

// Расчет стоимости заказа
function calculatePrice() {
    const materialRadio = document.querySelector('input[name="material"]:checked');
    const subtypeSelect = document.getElementById('materialSubtype');
    const volumeInput = document.getElementById('volume');
    const priceValue = document.getElementById('orderPrice');
    
    if (!materialRadio || !subtypeSelect || !volumeInput || !priceValue) return;
    
    const material = materialRadio.value;
    const subtypes = materialData[material] || [];
    const isSubtypeHidden = material === 'asphalt';
    
    if (subtypes.length === 0) {
        priceValue.textContent = '0 ₽';
        return;
    }
    
    const subtypeIndex = isSubtypeHidden ? 0 : parseInt(subtypeSelect.value);
    if (isNaN(subtypeIndex) || subtypeIndex < 0 || subtypeIndex >= subtypes.length) {
        priceValue.textContent = '0 ₽';
        return;
    }
    
    const pricePerCube = subtypes[subtypeIndex].price;
    const volume = parseFloat(volumeInput.value) || 0;
    const totalPrice = pricePerCube * volume;
    
    priceValue.textContent = totalPrice.toLocaleString('ru-RU') + ' ₽';
}

// Управление bottom sheet с картой
function openMapBottomSheet() {
    const bottomSheet = document.getElementById('mapBottomSheet');
    if (bottomSheet) {
        bottomSheet.classList.add('active');
        document.body.classList.add('no-scroll');
        // Инициализируем карту при открытии шторки
        if (!window.mapInitialized) {
            initMap();
            window.mapInitialized = true;
        } else if (map) {
            // Если карта уже инициализирована, обновляем размер
            map.container.fitToViewport();
        }
    }
}

function closeMapBottomSheet() {
    const bottomSheet = document.getElementById('mapBottomSheet');
    if (bottomSheet) {
        bottomSheet.classList.remove('active');
    }
    document.body.classList.remove('no-scroll');
}

function applyMapSelection() {
    const address = document.getElementById('address').value;
    const addressInput = document.getElementById('addressInput');
    if (addressInput && address) {
        addressInput.value = address;
    }
    closeMapBottomSheet();
}

// Обработка отправки формы
document.addEventListener('DOMContentLoaded', function() {

    const form = document.getElementById('orderForm');
    const dateInput = document.getElementById('date');
    const volumeInput = document.getElementById('volume');
    const volumeValue = document.getElementById('volumeValue');
    const submitBtn = document.getElementById('submitOrderBtn');
    
    // Устанавливаем минимальную дату (сегодня)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    dateInput.setAttribute('min', today.toISOString().split('T')[0]);
    dateInput.value = tomorrowString;

    // Функция для обновления текста объема с количеством машин
    function updateVolumeLabel(volume) {
        const volumeValue = document.getElementById('volumeValue');
        if (!volumeValue) return;
        
        const trucks = Math.ceil(volume / 20);
        const truckText = trucks === 1 ? 'камаз' : trucks === 2 || trucks === 3 || trucks === 4 ? 'камаза' : 'камазов';
        volumeValue.innerHTML = `${volume} м³ <span>(${trucks} ${truckText})</span>`;
    }

    // Обновление значения объема при изменении слайдера
    if (volumeInput && volumeValue) {
        // Инициализация при загрузке
        updateVolumeLabel(parseFloat(volumeInput.value));
        
        volumeInput.addEventListener('input', function() {
            const volume = parseFloat(this.value);
            updateVolumeLabel(volume);
            calculatePrice();
        });
    }

    // Обработка изменения материала
    const materialRadios = document.querySelectorAll('input[name="material"]');
    materialRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateMaterialSubtypes(this.value);
        });
    });

    // Обработка изменения подтипа
    const subtypeSelect = document.getElementById('materialSubtype');
    if (subtypeSelect) {
        subtypeSelect.addEventListener('change', calculatePrice);
    }

    // Инициализация подтипов для выбранного материала
    const selectedMaterial = document.querySelector('input[name="material"]:checked');
    if (selectedMaterial) {
        updateMaterialSubtypes(selectedMaterial.value);
    }

    // Функция для обновления лейбла даты
    function updateDateLabel() {
        const dateInput = document.getElementById('date');
        const dateLabel = document.querySelector('label[for="date"]');
        
        if (!dateInput || !dateLabel) return;
        
        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        
        selectedDate.setHours(0, 0, 0, 0);
        
        let labelText = 'Дата доставки';
        
        if (selectedDate.getTime() === tomorrow.getTime()) {
            labelText = 'Дата доставки: Завтра';
        } else if (selectedDate.getTime() === dayAfterTomorrow.getTime()) {
            labelText = 'Дата доставки: Послезавтра';
        }
        
        dateLabel.textContent = labelText;
    }

    // Обработка изменения даты
    if (dateInput) {
        dateInput.addEventListener('change', updateDateLabel);
        // Обновляем лейбл при загрузке страницы
        updateDateLabel();
    }

    // Обработка отправки формы
    function handleSubmit(e) {
        e.preventDefault();

        // Получаем значения напрямую из элементов формы
        const materialRadio = document.querySelector('input[name="material"]:checked');
        const material = materialRadio ? materialRadio.value : '';
        const subtypeSelect = document.getElementById('materialSubtype');
        const isSubtypeHidden = material === 'asphalt';
        const parsedSubtypeIndex = subtypeSelect ? parseInt(subtypeSelect.value) : null;
        const subtypeIndex = isSubtypeHidden ? 0 : parsedSubtypeIndex;
        const volume = parseFloat(document.getElementById('volume').value);
        const date = document.getElementById('date').value;
        const addressInput = document.getElementById('addressInput');
        const address = addressInput ? addressInput.value.trim() : '';
        const coordinates = document.getElementById('coordinates').value;
        const phone = document.getElementById('phone').value.trim();
        const comment = document.getElementById('comment').value || '';

        // Получаем информацию о подтипе и цене
        let materialSubtype = null;
        let pricePerCube = 0;
        let totalPrice = 0;

        if (materialData[material] && materialData[material].length > 0) {
            if (subtypeIndex !== null && !isNaN(subtypeIndex) && subtypeIndex >= 0 && subtypeIndex < materialData[material].length) {
                materialSubtype = materialData[material][subtypeIndex].name;
                pricePerCube = materialData[material][subtypeIndex].price;
                totalPrice = pricePerCube * volume;
            }
        }

        const order = {
            material: material,
            materialSubtype: materialSubtype,
            volume: volume,
            pricePerCube: pricePerCube,
            totalPrice: totalPrice,
            date: date,
            address: address,
            coordinates: coordinates,
            phone: phone,
            comment: comment
        };

        // Валидация
        if (!order.material || !order.volume || !order.date) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        if (!isSubtypeHidden && materialData[material] && materialData[material].length > 0) {
            if (!materialSubtype) {
                alert('Пожалуйста, выберите подтип материала');
                return;
            }
        }

        if (!address || address === '') {
            alert('Пожалуйста, введите адрес доставки');
            return;
        }

        if (!phone) {
            alert('Пожалуйста, укажите контактный телефон');
            return;
        }

        // Сохраняем адрес в скрытое поле, если он был выбран на карте
        if (coordinates) {
            document.getElementById('address').value = address;
        }

        // Сохранение заказа
        const newOrder = OrdersStorage.addOrder(order);
        
        // Перенаправление на страницу деталей заказа
        if (typeof ScreenManager !== 'undefined') {
            ScreenManager.showScreen('detail', newOrder.id);
        } else {
            window.location.href = `order-detail.html?id=${newOrder.id}`;
        }
    }

    form.addEventListener('submit', handleSubmit);
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
    }

    // Обработчики для bottom sheet с картой
    const openMapBtn = document.getElementById('openMapBtn');
    const closeMapBtn = document.getElementById('closeMapBtn');
    const applyMapBtn = document.getElementById('applyMapBtn');
    const mapBottomSheetOverlay = document.getElementById('mapBottomSheetOverlay');

    if (openMapBtn) {
        openMapBtn.addEventListener('click', openMapBottomSheet);
    }

    if (closeMapBtn) {
        closeMapBtn.addEventListener('click', closeMapBottomSheet);
    }

    if (applyMapBtn) {
        applyMapBtn.addEventListener('click', applyMapSelection);
    }

    if (mapBottomSheetOverlay) {
        mapBottomSheetOverlay.addEventListener('click', closeMapBottomSheet);
    }
});
