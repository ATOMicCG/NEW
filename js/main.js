document.addEventListener('DOMContentLoaded', () => {
    const svg = d3.select('#map');
    const tabs = d3.select('#tabs');
    let isEditing = false;
    let currentMapId = null;
    let openMaps = [];
    const mapNameModal = document.getElementById('map-name-modal');
    const mapNameInput = document.getElementById('map-name-input');
    const mapNameError = document.getElementById('map-name-error');
    const mapNameOk = document.getElementById('map-name-ok');
    const mapNameCancel = document.getElementById('map-name-cancel');
    const openMapModal = document.getElementById('open-map-modal');
    const mapListBody = d3.select('#map-list-body');
    const openMapError = document.getElementById('open-map-error');
    const openMapOk = document.getElementById('open-map-ok');
    const openMapCancel = document.getElementById('open-map-cancel');
    const contextMenu = document.getElementById('context-menu');

    // Функции для работы с куки
    function setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/pinger`;
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return null;
    }

    // Восстановление открытых карт из куки
    const userId = window.currentUser || 'unknown';
    const savedMaps = getCookie(`openMaps_${userId}`);
    if (savedMaps) {
        openMaps = JSON.parse(savedMaps);
    }
    const savedCurrentMapId = getCookie(`currentMapId_${userId}`);
    if (savedCurrentMapId && openMaps.includes(savedCurrentMapId)) {
        currentMapId = savedCurrentMapId;
        fetch(`/pinger/api.php?action=load_map&id=${currentMapId}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(text => {
                console.log('Load map raw response:', text); // Отладка
                const data = JSON.parse(text);
                if (data.success) {
                    svg.selectAll('*').remove();
                    svg.append('g');
                    // Добавьте код для отображения карты
                    updateTabs();
                } else {
                    console.error('Load map failed:', data.error);
                }
            })
            .catch(err => console.error('Load map error:', err));
    }

    // Настройка D3 zoom для перемещения по карте (зажатие ЛКМ)
    const zoom = d3.zoom()
        .scaleExtent([0.5, 2])
        .filter(event => {
            // Отключаем зум на двойной клик, пропуская только wheel и drag
            return event.type !== 'dblclick';
        })
        .on('zoom', (event) => {
            svg.selectAll('g').attr('transform', event.transform);
        });

    svg.call(zoom);

    // Показать контекстное меню на правую кнопку мыши
    function showContextMenu(event) {
        if (!isEditing) return;
        event.preventDefault(); // Предотвращаем стандартное браузерное меню на ПКМ
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${event.clientX}px`;
        contextMenu.style.top = `${event.clientY}px`;
    }

    // Скрыть контекстное меню
    function hideContextMenu() {
        contextMenu.style.display = 'none';
    }

    // Обработчик правой кнопки мыши для контекстного меню
    svg.on('contextmenu', showContextMenu);
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    // Заглушки для пунктов контекстного меню
    document.getElementById('create-switch').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Context menu: create-switch clicked'); // Отладка
        alert('Создание свитча (заглушка)');
        hideContextMenu();
    });
    document.getElementById('create-planned-switch').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Context menu: create-planned-switch clicked'); // Отладка
        alert('Создание планируемого свитча (заглушка)');
        hideContextMenu();
    });
    document.getElementById('create-client').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Context menu: create-client clicked'); // Отладка
        alert('Создание клиента (заглушка)');
        hideContextMenu();
    });
    document.getElementById('create-line').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Context menu: create-line clicked'); // Отладка
        alert('Создание линии (заглушка)');
        hideContextMenu();
    });
    document.getElementById('create-trunk').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Context menu: create-trunk clicked'); // Отладка
        alert('Создание магистрали (заглушка)');
        hideContextMenu();
    });
    document.getElementById('create-soapbox').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Context menu: create-soapbox clicked'); // Отладка
        alert('Создание мыльницы (заглушка)');
        hideContextMenu();
    });
    document.getElementById('create-table').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Context menu: create-table clicked'); // Отладка
        alert('Создание таблицы (заглушка)');
        hideContextMenu();
    });
    document.getElementById('map-settings').addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Context menu: map-settings clicked'); // Отладка
        alert('Параметры карты (заглушка)');
        hideContextMenu();
    });

    // Обновление вкладок
    function updateTabs() {
        tabs.selectAll('button').remove();
        tabs.selectAll('button')
            .data(openMaps)
            .enter()
            .append('button')
            .text(d => d)
            .classed('active', d => d === currentMapId)
            .on('click', (e, mapId) => {
                if (mapId !== currentMapId) {
                    currentMapId = mapId;
                    setCookie(`currentMapId_${userId}`, currentMapId);
                    isEditing = false;
                    document.getElementById('edit-map').classList.remove('active');
                    fetch(`/pinger/api.php?action=load_map&id=${mapId}`)
                        .then(res => {
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            return res.text();
                        })
                        .then(text => {
                            console.log('Load map raw response:', text); // Отладка
                            const data = JSON.parse(text);
                            if (data.success) {
                                svg.selectAll('*').remove();
                                svg.append('g');
                                // Добавьте код для отображения карты
                                updateTabs();
                            } else {
                                console.error('Load map failed:', data.error);
                            }
                        })
                        .catch(err => console.error('Load map error:', err));
                }
            });
        // Сохраняем openMaps в куки
        setCookie(`openMaps_${userId}`, JSON.stringify(openMaps));
    }

    // Показать модальное окно для создания карты
    function showMapNameModal(callback) {
        console.log('Opening create map modal'); // Отладка
        mapNameInput.value = '';
        mapNameError.style.display = 'none';
        mapNameModal.style.display = 'flex';
        mapNameInput.focus();

        mapNameOk.onclick = () => {
            const mapId = mapNameInput.value.trim();
            if (!mapId) {
                mapNameError.textContent = 'Название карты не может быть пустым';
                mapNameError.style.display = 'block';
                return;
            }
            console.log('Checking map existence:', mapId); // Отладка
            fetch('/pinger/api.php?action=list_maps')
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.text();
                })
                .then(text => {
                    console.log('List maps raw response:', text); // Отладка
                    const maps = JSON.parse(text);
                    if (maps.some(m => m.name === mapId)) {
                        mapNameError.textContent = 'Карта с таким именем уже существует';
                        mapNameError.style.display = 'block';
                    } else {
                        mapNameModal.style.display = 'none';
                        callback(mapId);
                    }
                })
                .catch(err => {
                    console.error('List maps error:', err);
                    mapNameError.textContent = 'Ошибка проверки имени карты';
                    mapNameError.style.display = 'block';
                });
        };

        mapNameCancel.onclick = () => {
            console.log('Create map modal cancelled'); // Отладка
            mapNameModal.style.display = 'none';
        };
    }

    // Показать модальное окно для открытия карты
    function showOpenMapModal() {
        console.log('Opening open map modal'); // Отладка
        openMapError.style.display = 'none';
        mapListBody.selectAll('tr').remove();
        fetch('/pinger/api.php?action=list_maps')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(text => {
                console.log('List maps raw response:', text); // Отладка
                const maps = JSON.parse(text);
                if (maps.length === 0) {
                    openMapError.textContent = 'Нет доступных карт';
                    openMapError.style.display = 'block';
                    return;
                }
                mapListBody.selectAll('tr')
                    .data(maps)
                    .enter()
                    .append('tr')
                    .on('click', (e, d) => {
                        mapListBody.selectAll('tr').classed('selected', false);
                        d3.select(e.currentTarget).classed('selected', true);
                    })
                    .html(d => `
                        <td>${d.name}</td>
                        <td>${new Date(d.mtime * 1000).toLocaleString('ru-RU')}</td>
                        <td>${d.last_modified_by || 'Неизвестно'}</td>
                    `);
                openMapModal.style.display = 'flex';
            })
            .catch(err => {
                console.error('List maps error:', err);
                openMapError.textContent = 'Ошибка загрузки списка карт';
                openMapError.style.display = 'block';
            });

        openMapOk.onclick = () => {
            const selectedRow = mapListBody.select('tr.selected').node();
            if (!selectedRow) {
                openMapError.textContent = 'Выберите карту';
                openMapError.style.display = 'block';
                return;
            }
            const mapId = selectedRow.cells[0].textContent;
            console.log('Opening map:', mapId); // Отладка
            currentMapId = mapId;
            setCookie(`currentMapId_${userId}`, currentMapId);
            if (!openMaps.includes(mapId)) {
                openMaps.push(mapId);
                setCookie(`openMaps_${userId}`, JSON.stringify(openMaps));
            }
            fetch(`/pinger/api.php?action=load_map&id=${mapId}`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.text();
                })
                .then(text => {
                    console.log('Load map raw response:', text); // Отладка
                    const data = JSON.parse(text);
                    if (data.success) {
                        svg.selectAll('*').remove();
                        svg.append('g');
                        // Добавьте код для отображения карты
                        isEditing = false;
                        document.getElementById('edit-map').classList.remove('active');
                        updateTabs();
                        openMapModal.style.display = 'none';
                    } else {
                        console.error('Load map failed:', data.error);
                        openMapError.textContent = 'Ошибка загрузки карты';
                        openMapError.style.display = 'block';
                    }
                })
                .catch(err => {
                    console.error('Load map error:', err);
                    openMapError.textContent = 'Ошибка загрузки карты';
                    openMapError.style.display = 'block';
                });
        };

        openMapCancel.onclick = () => {
            console.log('Open map modal cancelled'); // Отладка
            openMapModal.style.display = 'none';
        };
    }

    // Инициализация кнопки редактирования
    const editButton = document.getElementById('edit-map');
    editButton.addEventListener('click', () => {
        console.log('Edit map clicked, currentMapId:', currentMapId); // Отладка
        if (!currentMapId) {
            showMapNameModal((mapId) => {
                currentMapId = mapId;
                setCookie(`currentMapId_${userId}`, currentMapId);
                if (!openMaps.includes(mapId)) {
                    openMaps.push(mapId);
                    setCookie(`openMaps_${userId}`, JSON.stringify(openMaps));
                }
                isEditing = true;
                editButton.classList.add('active');
                svg.selectAll('*').remove();
                svg.append('g');
                // Добавьте код для инициализации новой карты
                updateTabs();
            });
        } else {
            isEditing = !isEditing;
            editButton.classList.toggle('active', isEditing);
            if (!isEditing) {
                saveMap(currentMapId);
            }
        }
    });

    // Создание новой карты
    document.getElementById('create-map').addEventListener('click', (e) => {
        console.log('Create map clicked'); // Отладка
        e.preventDefault();
        showMapNameModal((mapId) => {
            currentMapId = mapId;
            setCookie(`currentMapId_${userId}`, currentMapId);
            if (!openMaps.includes(mapId)) {
                openMaps.push(mapId);
                setCookie(`openMaps_${userId}`, JSON.stringify(openMaps));
            }
            svg.selectAll('*').remove();
            svg.append('g');
            isEditing = true;
            editButton.classList.add('active');
            // Добавьте код для инициализации новой карты
            updateTabs();
        });
    });

    // Открытие карты
    document.getElementById('open-map').addEventListener('click', (e) => {
        console.log('Open map clicked'); // Отладка
        e.preventDefault();
        showOpenMapModal();
    });

    // Сохранение карты
    document.getElementById('save-map').addEventListener('click', (e) => {
        console.log('Save map clicked, currentMapId:', currentMapId); // Отладка
        e.preventDefault();
        if (currentMapId) {
            saveMap(currentMapId);
        } else {
            alert('Сначала создайте или откройте карту');
        }
    });

    function saveMap(mapId) {
        const mapData = {
            nodes: [],
            links: [],
            last_modified_by: window.currentUser || 'unknown'
        };
        fetch(`/pinger/api.php?action=save_map&id=${mapId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapData)
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(text => {
                console.log('Save map raw response:', text); // Отладка
                const data = JSON.parse(text);
                if (data.success) {
                    alert('Карта сохранена!');
                } else {
                    alert('Ошибка сохранения карты: ' + (data.error || 'Неизвестная ошибка'));
                }
            })
            .catch(err => {
                console.error('Save map error:', err);
                alert('Ошибка сохранения карты: ' + err.message);
            });
    }

    // Инициализация вкладок при загрузке
    updateTabs();
});