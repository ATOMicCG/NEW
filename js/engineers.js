document.addEventListener('DOMContentLoaded', () => {
    const masterList = document.getElementById('master-list');
    const engineerList = document.getElementById('engineer-list');
    const addMasterBtn = document.getElementById('add-master');
    const addEngineerBtn = document.getElementById('add-engineer');
    const masterModal = document.getElementById('master-modal');
    const engineerModal = document.getElementById('engineer-modal');
    const masterForm = document.getElementById('master-form');
    const engineerForm = document.getElementById('engineer-form');
    const masterErrorDiv = document.getElementById('master-error');
    const engineerErrorDiv = document.getElementById('engineer-error');
    const saveMasterBtn = document.getElementById('save-master');
    const cancelMasterBtn = document.getElementById('cancel-master');
    const saveEngineerBtn = document.getElementById('save-engineer');
    const cancelEngineerBtn = document.getElementById('cancel-engineer');
    const engineerMasterSelect = document.getElementById('engineer-master');
    let selectedMasterId = null;

    // Загрузка мастеров
    function loadMasters() {
        fetch('/pinger/api.php?action=list_masters')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP Error: ${res.status}`);
                }
                return res.json();
            })
            .then(masters => {
                masterList.innerHTML = '';
                masters.forEach(master => {
                    const option = document.createElement('option');
                    option.value = master.id;
                    option.textContent = master.fio;
                    masterList.appendChild(option);
                });
                if (selectedMasterId) {
                    masterList.value = selectedMasterId;
                    loadEngineers(selectedMasterId);
                }
            })
            .catch(err => {
                console.error('Ошибка загрузки мастеров:', err);
            });
    }

    // Загрузка техников (фильтрация по мастеру)
    function loadEngineers(masterId) {
        fetch(`/pinger/api.php?action=list_engineers${masterId ? `&master_id=${masterId}` : ''}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP Error: ${res.status}`);
                }
                return res.json();
            })
            .then(engineers => {
                engineerList.innerHTML = '';
                engineers.forEach(engineer => {
                    const option = document.createElement('option');
                    option.value = engineer.id;
                    option.textContent = engineer.fio;
                    engineerList.appendChild(option);
                });
            })
            .catch(err => {
                console.error('Ошибка загрузки техников:', err);
            });
    }

    // Обработка выбора мастера
    masterList.addEventListener('change', () => {
        selectedMasterId = masterList.value;
        loadEngineers(selectedMasterId);
    });

    // Открытие модального окна мастера
    addMasterBtn.addEventListener('click', () => {
        masterForm.reset();
        masterForm.id.value = Date.now();
        masterErrorDiv.style.display = 'none';
        masterModal.style.display = 'flex';
    });

    // Открытие модального окна техника
    addEngineerBtn.addEventListener('click', () => {
        engineerForm.reset();
        engineerForm.id.value = Date.now();
        engineerErrorDiv.style.display = 'none';
        // Загрузка мастеров в select
        fetch('/pinger/api.php?action=list_masters')
            .then(res => res.json())
            .then(masters => {
                engineerMasterSelect.innerHTML = '';
                masters.forEach(master => {
                    const option = document.createElement('option');
                    option.value = master.id;
                    option.textContent = master.fio;
                    engineerMasterSelect.appendChild(option);
                });
                engineerModal.style.display = 'flex';
            })
            .catch(err => {
                console.error('Ошибка загрузки мастеров:', err);
                engineerErrorDiv.textContent = 'Ошибка загрузки мастеров: ' + err.message;
                engineerErrorDiv.style.display = 'block';
            });
    });

    // Сохранение мастера
    saveMasterBtn.addEventListener('click', () => {
        if (!masterForm.fio.value) {
            masterErrorDiv.textContent = 'Введите Ф.И.О.!';
            masterErrorDiv.style.display = 'block';
            return;
        }
        const master = {
            id: masterForm.id.value,
            fio: masterForm.fio.value
        };
        fetch('/pinger/api.php?action=save_master', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(master)
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(() => {
                loadMasters();
                masterModal.style.display = 'none';
                masterForm.reset();
            })
            .catch(err => {
                console.error('Ошибка сохранения мастера:', err);
                masterErrorDiv.textContent = 'Ошибка сохранения мастера: ' + err.message;
                masterErrorDiv.style.display = 'block';
            });
    });

    // Сохранение техника
    saveEngineerBtn.addEventListener('click', () => {
        if (!engineerForm.fio.value) {
            engineerErrorDiv.textContent = 'Введите Ф.И.О.!';
            engineerErrorDiv.style.display = 'block';
            return;
        }
        if (!engineerForm.master_id.value) {
            engineerErrorDiv.textContent = 'Выберите мастера участка!';
            engineerErrorDiv.style.display = 'block';
            return;
        }
        const engineer = {
            id: engineerForm.id.value,
            fio: engineerForm.fio.value,
            master_id: engineerForm.master_id.value
        };
        fetch('/pinger/api.php?action=save_engineer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(engineer)
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(() => {
                loadEngineers(selectedMasterId);
                engineerModal.style.display = 'none';
                engineerForm.reset();
            })
            .catch(err => {
                console.error('Ошибка сохранения техника:', err);
                engineerErrorDiv.textContent = 'Ошибка сохранения техника: ' + err.message;
                engineerErrorDiv.style.display = 'block';
            });
    });

    // Закрытие модальных окон
    cancelMasterBtn.addEventListener('click', () => {
        masterModal.style.display = 'none';
        masterForm.reset();
        masterErrorDiv.style.display = 'none';
    });

    cancelEngineerBtn.addEventListener('click', () => {
        engineerModal.style.display = 'none';
        engineerForm.reset();
        engineerErrorDiv.style.display = 'none';
    });

    // Инициализация
    loadMasters();
});