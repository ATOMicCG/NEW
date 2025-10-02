// main.js
const openMaps = []; // Массив открытых карт
let activeMapId = null; // ID активной карты
let selectedMapId = null; // Выбранная карта в модальном окне
let mapData = { nodes: [], links: [], last_modified_by: window.currentUser }; // Текущие данные карты

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    loadOpenMapsFromCookies(); // Загружаем открытые карты из cookies
    initializeEventListeners();
    updateTabs();
    if (openMaps.length > 0) {
        openMap(openMaps[0].id); // Открываем первую карту из cookies
    }
});

// Установка обработчиков событий
function initializeEventListeners() {
    // Обработчик для создания новой карты
    d3.select('#create-map').on('click', () => showMapNameModal());
    // Обработчик для открытия карты
    d3.select('#open-map').on('click', () => showOpenMapModal());
    // Обработчик для сохранения карты
    d3.select('#save-map').on('click', () => saveMap());
    // Обработчик для редактирования карты
    d3.select('#edit-map').on('click', () => toggleEditMode());
    // Обработчик контекстного меню
    d3.select('#map').on('contextmenu', showContextMenu);
    // Обработчик создания свитча
    d3.select('#create-switch').on('click', () => showCreateSwitchModal());
}

// Сохранение открытых карт в cookies
function saveOpenMapsToCookies() {
    document.cookie = `openMaps=${JSON.stringify(openMaps)}; path=/; max-age=86400`; // 24 часа
}

// Загрузка открытых карт из cookies
function loadOpenMapsFromCookies() {
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key] = value;
        return acc;
    }, {});
    if (cookies.openMaps) {
        try {
            const maps = JSON.parse(cookies.openMaps);
            openMaps.push(...maps);
            activeMapId = openMaps.length > 0 ? openMaps[0].id : null;
        } catch (error) {
            console.error('Failed to parse openMaps from cookies:', error);
        }
    }
}

// Обновление вкладок
async function updateTabs() {
    const tabs = d3.select('#tabs');
    tabs.selectAll('button').remove();

    const tabSelection = tabs.selectAll('button')
        .data(openMaps)
        .enter()
        .append('button')
        .attr('class', 'tab-button')
        .classed('active', d => d.id === activeMapId);

    // Добавляем текст вкладки
    tabSelection.append('span')
        .attr('class', 'tab-text')
        .text(d => d.name || 'Unnamed');

    // Добавляем кнопку закрытия
    tabSelection.append('span')
        .attr('class', 'tab-close')
        .html('✖')
        .on('click', (event, d) => {
            event.stopPropagation(); // Предотвращаем срабатывание клика по вкладке
            closeTab(d.id);
        });

    // Обработчик клика по вкладке
    tabSelection.on('click', async (event, d) => {
        if (d.id === activeMapId) return; // Игнорируем клик по уже активной вкладке
        try {
            const response = await fetch(`/pinger/api.php?action=load_map&id=${d.id}`);
            if (!response.ok) {
                throw new Error(`HTTP ошибка ${response.status}: ${response.statusText}`);
            }
            const mapDataResponse = await response.json();

            if (mapDataResponse.error) {
                console.error('Не удалось загрузить карту:', mapDataResponse.error);
                alert(`Ошибка: ${mapDataResponse.error}`);
                return;
            }

            console.log('Данные карты загружены:', mapDataResponse);

            // Проверка наличия данных
            if (!mapDataResponse.nodes || !mapDataResponse.links) {
                console.error('Не удалось загрузить карту: Неверные данные карты');
                alert('Неверные данные карты');
                return;
            }

            // Обновляем глобальные данные карты
            mapData = mapDataResponse;
            mapData.last_modified_by = window.currentUser;

            // Обновляем активную вкладку
            activeMapId = d.id;
            tabs.selectAll('button').classed('active', d2 => d2.id === activeMapId);

            // Отрисовываем карту
            renderMap(mapData);
        } catch (error) {
            console.error('Не удалось загрузить карту:', error.message);
            alert(`Ошибка загрузки карты: ${error.message}`);
        }
    });

    saveOpenMapsToCookies(); // Сохраняем открытые карты в cookies
}

// Загрузка списка карт
async function loadMapsList() {
    try {
        const response = await fetch('/pinger/api.php?action=list_maps');
        const maps = await response.json();
        console.log('Maps list:', maps);

        // Обновляем модальное окно для открытия карт
        const tableBody = d3.select('#map-list-body');
        tableBody.selectAll('tr').remove();
        tableBody.selectAll('tr')
            .data(maps)
            .enter()
            .append('tr')
            .classed('selected', d => d.name === selectedMapId)
            .html(d => `
                <td>${d.name}</td>
                <td>${new Date(d.mtime * 1000).toLocaleString('ru-RU')}</td>
                <td>${d.last_modified_by || 'Неизвестно'}</td>
            `)
            .on('click', (event, d) => {
                selectedMapId = d.name; // Сохраняем выбранный ID
                tableBody.selectAll('tr').classed('selected', false);
                d3.select(event.currentTarget).classed('selected', true);
            });
    } catch (error) {
        console.error('Failed to load maps list:', error);
        d3.select('#open-map-error').text('Ошибка загрузки списка карт').style('display', 'block');
    }
}

// Открытие карты
async function openMap(mapId) {
    try {
        const response = await fetch(`/pinger/api.php?action=load_map&id=${mapId}`);
        const mapDataResponse = await response.json();

        if (mapDataResponse.error) {
            console.error('Load map failed:', mapDataResponse.error);
            d3.select('#open-map-error').text(mapDataResponse.error).style('display', 'block');
            return;
        }

        console.log('Load map raw response:', mapDataResponse);

        if (!mapDataResponse.nodes || !mapDataResponse.links) {
            console.error('Load map failed: Invalid map data');
            d3.select('#open-map-error').text('Неверные данные карты').style('display', 'block');
            return;
        }

        // Обновляем глобальные данные карты
        mapData = mapDataResponse;
        mapData.last_modified_by = window.currentUser;

        // Добавляем карту в openMaps
        if (!openMaps.find(m => m.id === mapId)) {
            openMaps.push({ id: mapId, name: mapId, active: true });
        }
        activeMapId = mapId;
        renderMap(mapData);
        updateTabs();
        d3.select('#open-map-modal').style('display', 'none');
        selectedMapId = null; // Сбрасываем выбор
    } catch (error) {
        console.error('Load map failed:', error);
        d3.select('#open-map-error').text('Ошибка загрузки карты').style('display', 'block');
    }
}

// Закрытие вкладки
function closeTab(mapId) {
    const index = openMaps.findIndex(m => m.id === mapId);
    if (index !== -1) {
        openMaps.splice(index, 1);
    }
    if (activeMapId === mapId) {
        activeMapId = openMaps.length > 0 ? openMaps[0].id : null;
        if (activeMapId) {
            openMap(activeMapId);
        } else {
            clearMap();
            mapData = { nodes: [], links: [], last_modified_by: window.currentUser };
        }
    }
    updateTabs();
}

// Отрисовка карты
function renderMap(data) {
    const svg = d3.select('#map');
    svg.selectAll('*').remove();

    // Отрисовка узлов
    const nodes = svg.selectAll('.node')
        .data(data.nodes || [])
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);

    nodes.append('rect')
        .attr('width', 50)
        .attr('height', 30)
        .attr('fill', '#FFC107');

    nodes.append('text')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('x', 25)
        .attr('y', 15)
        .text(d => d.name || 'Node');

    // Отрисовка связей
    const links = svg.selectAll('.link')
        .data(data.links || [])
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('x1', d => d.source.x || 0)
        .attr('y1', d => d.source.y || 0)
        .attr('x2', d => d.target.x || 0)
        .attr('y2', d => d.target.y || 0)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
}

// Очистка карты
function clearMap() {
    d3.select('#map').selectAll('*').remove();
}

// Показать модальное окно для создания карты
function showMapNameModal() {
    d3.select('#map-name-modal').style('display', 'flex');
    d3.select('#map-name-input').node().focus();
    d3.select('#map-name-ok').on('click', () => {
        const name = d3.select('#map-name-input').property('value').trim();
        if (!name) {
            d3.select('#map-name-error').text('Введите название карты').style('display', 'block');
            return;
        }
        openMaps.push({ id: name, name, active: true });
        activeMapId = name;
        mapData = { nodes: [], links: [], last_modified_by: window.currentUser };
        renderMap(mapData);
        updateTabs();
        d3.select('#map-name-modal').style('display', 'none');
        d3.select('#map-name-input').property('value', '');
        d3.select('#map-name-error').style('display', 'none');
    });
    d3.select('#map-name-cancel').on('click', () => {
        d3.select('#map-name-modal').style('display', 'none');
        d3.select('#map-name-input').property('value', '');
        d3.select('#map-name-error').style('display', 'none');
    });
}

// Показать модальное окно для открытия карты
function showOpenMapModal() {
    d3.select('#open-map-modal').style('display', 'flex');
    loadMapsList();
    d3.select('#open-map-ok').on('click', () => {
        if (!selectedMapId) {
            d3.select('#open-map-error').text('Выберите карту').style('display', 'block');
            return;
        }
        openMap(selectedMapId);
    });
    d3.select('#open-map-cancel').on('click', () => {
        d3.select('#open-map-modal').style('display', 'none');
        d3.select('#open-map-error').style('display', 'none');
        selectedMapId = null;
    });
}

// Показать модальное окно для создания свитча
function showCreateSwitchModal() {
    const modal = d3.select('#create-switch-modal');
    if (modal.empty()) {
        console.error('Модальное окно не найдено');
        alert('Ошибка: Модальное окно для создания свитча не найдено. Проверьте загрузку addswitch.php.');
        return;
    }
    modal.style('display', 'flex');
    d3.select('#switch-name').node().focus();

    // Очистка формы
    resetSwitchForm();

    // Функция для обработки ошибок загрузки JSON
    function handleJsonError(err, fileName, responseText, contentType) {
        console.error(`Ошибка загрузки ${fileName}:`, err);
        console.log(`Текст ответа (${fileName}):`, responseText);
        console.log(`Content-Type (${fileName}):`, contentType);
    }

    // Резервные данные на случай ошибки
    const fallbackData = {
        models: [{ id: 'model_1', model_name: 'DES 3200-10', mag_ports: '1-2', uplink: 'port3' }],
        vlans: [{ id: 'vlan1', name: 'VLAN 1' }],
        masters: [{ id: 'master_1', fio: 'Тест Мастер' }],
        firmwares: [{ id: 'firmware_1', model_name: 'DES 3200-10', firmware: 'test_firmware' }]
    };

    // Загрузка моделей
    fetch('/pinger/models/models.json', { credentials: 'include' })
        .then(res => {
            const contentType = res.headers.get('Content-Type');
            if (!res.ok) throw new Error(`HTTP ошибка ${res.status}: ${res.statusText}`);
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Неверный Content-Type: ${contentType}`);
            }
            return res.text();
        })
        .then(text => {
            try {
                const models = JSON.parse(text);
                const modelSelect = d3.select('#switch-model');
                modelSelect.selectAll('option:not(:first-child)').remove();
                modelSelect.selectAll('option.model')
                    .data(models)
                    .enter()
                    .append('option')
                    .attr('class', 'model')
                    .attr('value', d => d.id)
                    .text(d => d.model_name);
            } catch (err) {
                console.log('Содержимое models.json:', text);
                throw new Error(`Ошибка парсинга models.json: ${err.message}`);
            }
        })
        .catch(err => {
            handleJsonError(err, 'models.json', err.message, 'unknown');
            const modelSelect = d3.select('#switch-model');
            modelSelect.selectAll('option:not(:first-child)').remove();
            modelSelect.selectAll('option.model')
                .data(fallbackData.models)
                .enter()
                .append('option')
                .attr('class', 'model')
                .attr('value', d => d.id)
                .text(d => d.model_name);
        });

    // Загрузка VLAN
    fetch('/pinger/lists/mngmtvlan.json', { credentials: 'include' })
        .then(res => {
            const contentType = res.headers.get('Content-Type');
            if (!res.ok) throw new Error(`HTTP ошибка ${res.status}: ${res.statusText}`);
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Неверный Content-Type: ${contentType}`);
            }
            return res.text();
        })
        .then(text => {
            try {
                const vlans = JSON.parse(text);
                const vlanSelect = d3.select('#switch-vlan');
                vlanSelect.selectAll('option:not(:first-child)').remove();
                vlanSelect.selectAll('option.vlan')
                    .data(vlans)
                    .enter()
                    .append('option')
                    .attr('class', 'vlan')
                    .attr('value', d => d.id)
                    .text(d => `${d.id} (${d.gateway}${d.mask})`);
            } catch (err) {
                console.log('Содержимое mngmtvlan.json:', text);
                throw new Error(`Ошибка парсинга mngmtvlan.json: ${err.message}`);
            }
        })
        .catch(err => {
            handleJsonError(err, 'mngmtvlan.json', err.message, 'unknown');
            const vlanSelect = d3.select('#switch-vlan');
            vlanSelect.selectAll('option:not(:first-child)').remove();
            vlanSelect.selectAll('option.vlan')
                .data(fallbackData.vlans)
                .enter()
                .append('option')
                .attr('class', 'vlan')
                .attr('value', d => d.id)
                .text(d => d.name);
        });

    // Загрузка мастеров
    fetch('/pinger/lists/masters.json', { credentials: 'include' })
        .then(res => {
            const contentType = res.headers.get('Content-Type');
            if (!res.ok) throw new Error(`HTTP ошибка ${res.status}: ${res.statusText}`);
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Неверный Content-Type: ${contentType}`);
            }
            return res.text();
        })
        .then(text => {
            try {
                const masters = JSON.parse(text);
                const masterSelect = d3.select('#switch-master');
                masterSelect.selectAll('option:not(:first-child)').remove();
                masterSelect.selectAll('option.master')
                    .data(masters)
                    .enter()
                    .append('option')
                    .attr('class', 'master')
                    .attr('value', d => d.id)
                    .text(d => d.fio);
            } catch (err) {
                console.log('Содержимое masters.json:', text);
                throw new Error(`Ошибка парсинга masters.json: ${err.message}`);
            }
        })
        .catch(err => {
            handleJsonError(err, 'masters.json', err.message, 'unknown');
            const masterSelect = d3.select('#switch-master');
            masterSelect.selectAll('option:not(:first-child)').remove();
            masterSelect.selectAll('option.master')
                .data(fallbackData.masters)
                .enter()
                .append('option')
                .attr('class', 'master')
                .attr('value', d => d.id)
                .text(d => d.fio);
        });

    // Загрузка прошивок
    fetch('/pinger/lists/firmware.json', { credentials: 'include' })
        .then(res => {
            const contentType = res.headers.get('Content-Type');
            if (!res.ok) throw new Error(`HTTP ошибка ${res.status}: ${res.statusText}`);
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Неверный Content-Type: ${contentType}`);
            }
            return res.text();
        })
        .then(text => {
            try {
                const firmwares = JSON.parse(text);
                const firmwareSelect = d3.select('#switch-firmware');
                firmwareSelect.selectAll('option:not(:first-child)').remove();
                firmwareSelect.selectAll('option.firmware')
                    .data(firmwares)
                    .enter()
                    .append('option')
                    .attr('class', 'firmware')
                    .attr('value', d => d.id)
                    .text(d => d.model_name);
            } catch (err) {
                console.log('Содержимое firmware.json:', text);
                throw new Error(`Ошибка парсинга firmware.json: ${err.message}`);
            }
        })
        .catch(err => {
            handleJsonError(err, 'firmware.json', err.message, 'unknown');
            const firmwareSelect = d3.select('#switch-firmware');
            firmwareSelect.selectAll('option:not(:first-child)').remove();
            firmwareSelect.selectAll('option.firmware')
                .data(fallbackData.firmwares)
                .enter()
                .append('option')
                .attr('class', 'firmware')
                .attr('value', d => d.id)
                .text(d => d.model_name);
        });

    // Автозаполнение магистральных портов и uplink
    d3.select('#switch-model').on('change', function() {
        const modelId = this.value;
        console.log('Выбрана модель с ID:', modelId); // Отладка
        if (modelId) {
            fetch(`/pinger/models/${modelId}.json`, { credentials: 'include' })
                .then(res => {
                    const contentType = res.headers.get('Content-Type');
                    if (!res.ok) throw new Error(`HTTP ошибка ${res.status}: ${res.statusText}`);
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error(`Неверный Content-Type: ${contentType}`);
                    }
                    return res.text();
                })
                .then(text => {
                    try {
                        const model = JSON.parse(text);
                        console.log('Данные модели:', model); // Отладка
                        if (model) {
                            d3.select('#switch-trunk-ports').property('value', model.mag_ports || '');
                            d3.select('#switch-uplink').property('value', model.uplink || '');
                        } else {
                            console.warn('Модель с ID', modelId, 'не найдена');
                        }
                    } catch (err) {
                        console.log(`Содержимое ${modelId}.json:`, text);
                        throw new Error(`Ошибка парсинга ${modelId}.json: ${err.message}`);
                    }
                })
                .catch(err => {
                    handleJsonError(err, `${modelId}.json (автозаполнение)`, err.message, 'unknown');
                    const model = fallbackData.models.find(m => m.id === modelId);
                    if (model) {
                        d3.select('#switch-trunk-ports').property('value', model.mag_ports || '');
                        d3.select('#switch-uplink').property('value', model.uplink || '');
                    }
                });
        } else {
            d3.select('#switch-trunk-ports').property('value', '');
            d3.select('#switch-uplink').property('value', '');
        }
    });

    // Копирование данных в Google
    d3.select('#google-copy').on('click', () => {
        const master = d3.select('#switch-master option:checked').text();
        const model = d3.select('#switch-model option:checked').text();
        const name = d3.select('#switch-name').property('value');
        const serial = d3.select('#switch-serial').property('value');
        const mac = d3.select('#switch-mac').property('value');
        const password = d3.select('#switch-password').property('value');
        const text = `${master}\t${model}\t${name}\t${serial}\t${mac}\t${password}`;
        navigator.clipboard.writeText(text)
            .then(() => alert('Данные скопированы в буфер обмена'))
            .catch(err => console.error('Ошибка копирования:', err));
    });

    // Копирование прошивки
    d3.select('#flash-button').on('click', () => {
        const firmwareId = d3.select('#switch-firmware').property('value');
        if (firmwareId) {
            fetch('/pinger/lists/firmware.json', { credentials: 'include' })
                .then(res => {
                    const contentType = res.headers.get('Content-Type');
                    if (!res.ok) throw new Error(`HTTP ошибка ${res.status}: ${res.statusText}`);
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error(`Неверный Content-Type: ${contentType}`);
                    }
                    return res.text();
                })
                .then(text => {
                    try {
                        const firmwares = JSON.parse(text);
                        const firmware = firmwares.find(f => f.id === firmwareId);
                        if (firmware) {
                            navigator.clipboard.writeText(firmware.firmware)
                                .then(() => alert('Прошивка скопирована в буфер обмена'))
                                .catch(err => console.error('Ошибка копирования прошивки:', err));
                        }
                    } catch (err) {
                        console.log('Содержимое firmware.json (прошивка):', text);
                        throw new Error(`Ошибка парсинга firmware.json: ${err.message}`);
                    }
                })
                .catch(err => {
                    handleJsonError(err, 'firmware.json (прошивка)', err.message, 'unknown');
                    const firmware = fallbackData.firmwares.find(f => f.id === firmwareId);
                    if (firmware) {
                        navigator.clipboard.writeText(firmware.firmware)
                            .then(() => alert('Прошивка скопирована в буфер обмена'))
                            .catch(err => console.error('Ошибка копирования прошивки:', err));
                    }
                });
        } else {
            alert('Выберите прошивку');
        }
    });

    // Добавление свитча
    d3.select('#add-switch').on('click', () => {
        const name = d3.select('#switch-name').property('value').trim();
        const model = d3.select('#switch-model').property('value');
        const vlan = d3.select('#switch-vlan').property('value');
        const master = d3.select('#switch-master').property('value');
        const trunkPorts = d3.select('#switch-trunk-ports').property('value');
        const uplink = d3.select('#switch-uplink').property('value');
        const mac = d3.select('#switch-mac').property('value');
        const ip = d3.select('#switch-ip').property('value');
        const serial = d3.select('#switch-serial').property('value');
        const password = d3.select('#switch-password').property('value');
        const responseTime = d3.select('#switch-response-time').property('value');

        if (!name || !model || !vlan || !master) {
            d3.select('#create-switch-modal .error-message')
                .text('Заполните обязательные поля: Имя, Модель, VLAN, Мастер')
                .style('display', 'block');
            return;
        }

        if (!activeMapId) {
            d3.select('#create-switch-modal .error-message')
                .text('Нет активной карты')
                .style('display', 'block');
            return;
        }

        const newNode = {
            id: `switch_${Date.now()}`,
            name: name,
            model: model,
            vlan: vlan,
            master: master,
            mag_ports: trunkPorts,
            uplink: uplink,
            mac: mac,
            ip: ip,
            serial: serial,
            password: password,
            response_time: responseTime,
            type: 'switch',
            x: 100,
            y: 100
        };

        mapData.nodes.push(newNode);
        renderMap(mapData);
        saveMap();
        modal.style('display', 'none');
        resetSwitchForm();
    });

    // Сброс формы
    d3.select('#reset-switch').on('click', () => resetSwitchForm());

    // Отмена
    d3.select('#create-switch-cancel').on('click', () => {
        modal.style('display', 'none');
        resetSwitchForm();
    });

    // Кнопка "Настроить"
    d3.select('#configure-switch').on('click', () => {
        alert('Функция настройки свитча пока не реализована');
    });
}

// Сброс формы
function resetSwitchForm() {
    d3.select('#switch-name').property('value', '');
    d3.select('#switch-model').property('value', '');
    d3.select('#switch-vlan').property('value', '');
    d3.select('#switch-master').property('value', '');
    d3.select('#switch-trunk-ports').property('value', '');
    d3.select('#switch-uplink').property('value', '');
    d3.select('#switch-mac').property('value', '');
    d3.select('#switch-ip').property('value', '');
    d3.select('#switch-serial').property('value', '');
    d3.select('#switch-password').property('value', '');
    d3.select('#switch-firmware').property('value', '');
    d3.select('#switch-response-time').property('value', '60');
    d3.select('#create-switch-modal .error-message').style('display', 'none');
}

// Отрисовка карты
function renderMap(data) {
    const svg = d3.select('#map');
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Отрисовка узлов
    const node = g.selectAll('.node')
        .data(data.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    node.filter(d => d.type === 'switch')
        .append('image')
        .attr('xlink:href', '/pinger/icons/Router.png')
        .attr('width', 40)
        .attr('height', 40)
        .attr('x', -20)
        .attr('y', -20)
        .on('error', function() {
            console.error('Ошибка загрузки изображения Router.png');
            d3.select(this).remove();
            d3.select(this.parentNode)
                .append('rect')
                .attr('width', 40)
                .attr('height', 40)
                .attr('x', -20)
                .attr('y', -20)
                .attr('fill', '#555');
        });

    node.filter(d => d.type === 'switch')
        .append('text')
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#FFC107')
        .text(d => d.name);

    // Перетаскивание узлов
    node.call(d3.drag()
        .on('drag', (event, d) => {
            d.x = event.x;
            d.y = event.y;
            d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
        }));
}

// Сохранение карты
async function saveMap() {
    if (!activeMapId) {
        alert('Нет активной карты для сохранения');
        return;
    }
    try {
        const response = await fetch(`/pinger/api.php?action=save_map&id=${activeMapId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapData)
        });
        const result = await response.json();
        if (result.error) {
            console.error('Save map failed:', result.error);
            alert('Ошибка сохранения карты');
        } else {
            alert('Карта успешно сохранена');
        }
    } catch (error) {
        console.error('Save map failed:', error);
        alert('Ошибка сохранения карты');
    }
}

// Режим редактирования
function toggleEditMode() {
    const editButton = d3.select('#edit-map');
    const isEditing = editButton.classed('active');
    editButton.classed('active', !isEditing);
}

// Показать контекстное меню
function showContextMenu(event) {
    event.preventDefault();
    if (!d3.select('#edit-map').classed('active')) {
        return; // ПКМ работает только в режиме редактирования
    }
    const menu = d3.select('#context-menu');
    menu.style('display', 'block')
        .style('left', `${event.pageX}px`)
        .style('top', `${event.pageY}px`);
    // Скрыть меню при клике в другом месте
    d3.select(document).on('click.context', () => {
        menu.style('display', 'none');
        d3.select(document).on('click.context', null);
    });
}