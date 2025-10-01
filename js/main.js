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
        try {
            const response = await fetch(`/pinger/api.php?action=load_map&id=${d.id}`);
            const mapDataResponse = await response.json();

            if (mapDataResponse.error) {
                console.error('Load map failed:', mapDataResponse.error);
                d3.select('#open-map-error').text(mapDataResponse.error).style('display', 'block');
                return;
            }

            console.log('Load map raw response:', mapDataResponse);

            // Проверка наличия данных
            if (!mapDataResponse.nodes || !mapDataResponse.links) {
                console.error('Load map failed: Invalid map data');
                d3.select('#open-map-error').text('Неверные данные карты').style('display', 'block');
                return;
            }

            // Обновляем глобальные данные карты
            mapData = mapDataResponse;
            mapData.last_modified_by = window.currentUser;

            // Обновляем активную вкладку
            activeMapId = d.id;
            tabs.selectAll('button').classed('active', false);
            d3.select(event.currentTarget).classed('active', true);

            // Отрисовываем карту
            renderMap(mapData);
        } catch (error) {
            console.error('Load map failed:', error);
            d3.select('#open-map-error').text('Ошибка загрузки карты').style('display', 'block');
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
    let modal = d3.select('#create-switch-modal');
    if (modal.empty()) {
        // Создаём модальное окно, если его нет
        modal = d3.select('body').append('div')
            .attr('id', 'create-switch-modal')
            .attr('class', 'modal')
            .style('display', 'flex');
        modal.append('div')
            .attr('class', 'modal-content')
            .html(`
                <h2>Создать свитч</h2>
                <div class="form-group">
                    <label for="switch-name">Название</label>
                    <input type="text" id="switch-name" placeholder="Название свитча">
                </div>
                <div class="form-group">
                    <label for="switch-model">Модель</label>
                    <select id="switch-model">
                        <option value="">Выберите модель</option>
                        <option value="model_68dce9a2da5fe">DES 3200-10</option>
                    </select>
                </div>
                <div id="create-switch-error" class="error-message"></div>
                <div class="modal-actions">
                    <button id="create-switch-ok">ОК</button>
                    <button id="create-switch-cancel">Отмена</button>
                </div>
            `);
    } else {
        modal.style('display', 'flex');
    }
    d3.select('#create-switch-error').style('display', 'none');
    d3.select('#switch-name').node().focus();

    // Обработчики кнопок
    d3.select('#create-switch-ok').on('click', () => {
        const name = d3.select('#switch-name').property('value').trim();
        const model = d3.select('#switch-model').property('value');
        if (!name || !model) {
            d3.select('#create-switch-error').text('Заполните все поля').style('display', 'block');
            return;
        }
        if (!activeMapId) {
            d3.select('#create-switch-error').text('Нет активной карты').style('display', 'block');
            return;
        }
        // Добавляем свитч как узел
        const newNode = {
            id: `switch_${Date.now()}`,
            name: name,
            model: model,
            type: 'switch',
            x: 100, // Позиция по умолчанию
            y: 100
        };
        mapData.nodes.push(newNode);
        renderMap(mapData);
        saveMap(); // Сохраняем карту
        d3.select('#create-switch-modal').style('display', 'none');
        d3.select('#switch-name').property('value', '');
        d3.select('#switch-model').property('value', '');
    });
    d3.select('#create-switch-cancel').on('click', () => {
        d3.select('#create-switch-modal').style('display', 'none');
        d3.select('#switch-name').property('value', '');
        d3.select('#switch-model').property('value', '');
        d3.select('#create-switch-error').style('display', 'none');
    });
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