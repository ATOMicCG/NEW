// main.js
const openMaps = []; // Массив открытых карт
let activeMapId = null; // ID активной карты
let selectedMapId = null; // Выбранная карта в модальном окне

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
            const mapData = await response.json();

            if (mapData.error) {
                console.error('Load map failed:', mapData.error);
                d3.select('#open-map-error').text(mapData.error).style('display', 'block');
                return;
            }

            console.log('Load map raw response:', mapData);

            // Проверка наличия данных
            if (!mapData.nodes || !mapData.links) {
                console.error('Load map failed: Invalid map data');
                d3.select('#open-map-error').text('Неверные данные карты').style('display', 'block');
                return;
            }

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
        const mapData = await response.json();

        if (mapData.error) {
            console.error('Load map failed:', mapData.error);
            d3.select('#open-map-error').text(mapData.error).style('display', 'block');
            return;
        }

        console.log('Load map raw response:', mapData);

        if (!mapData.nodes || !mapData.links) {
            console.error('Load map failed: Invalid map data');
            d3.select('#open-map-error').text('Неверные данные карты').style('display', 'block');
            return;
        }

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
        }
    }
    updateTabs();
}

// Отрисовка карты
function renderMap(mapData) {
    const svg = d3.select('#map');
    svg.selectAll('*').remove();

    // Отрисовка узлов
    const nodes = svg.selectAll('.node')
        .data(mapData.nodes || [])
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
        .data(mapData.links || [])
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
        renderMap({ nodes: [], links: [] });
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

// Сохранение карты
async function saveMap() {
    if (!activeMapId) {
        alert('Нет активной карты для сохранения');
        return;
    }
    const mapData = {
        nodes: [], // Здесь должна быть логика для получения текущих узлов
        links: [], // Здесь должна быть логика для получения текущих связей
        last_modified_by: window.currentUser
    };
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
    // Добавить логику для включения/выключения редактирования
}

// Показать контекстное меню
function showContextMenu(event) {
    event.preventDefault();
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