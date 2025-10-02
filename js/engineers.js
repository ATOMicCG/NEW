document.addEventListener('DOMContentLoaded', () => {
    const masterList = document.getElementById('master-list');
    const engineerList = document.getElementById('engineer-list');
    const addMasterBtn = document.getElementById('add-master');
    const addEngineerBtn = document.getElementById('add-engineer');
    const editMasterBtn = document.getElementById('edit-master');
    const deleteMasterBtn = document.getElementById('delete-master');
    const editEngineerBtn = document.getElementById('edit-engineer');
    const deleteEngineerBtn = document.getElementById('delete-engineer');
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

    // Открытие модального окна для добавления мастера
    addMasterBtn.addEventListener('click', () => {
        masterForm.reset();
        masterForm.id.value = Date.now();
        masterErrorDiv.style.display = 'none';
        masterModal.querySelector('h3').textContent = 'Добавление мастера';
        masterModal.style.display = 'flex';
    });

    // Открытие модального окна для редактирования мастера
    editMasterBtn.addEventListener('click', () => {
        if (!masterList.value) {
            alert('Выберите мастера для редактирования');
            return;
        }
        masterForm.id.value = masterList.value;
        masterForm.fio.value = masterList.options[masterList.selectedIndex].textContent;
        masterErrorDiv.style.display = 'none';
        masterModal.querySelector('h3').textContent = 'Редактирование мастера';
        masterModal.style.display = 'flex';
    });

    // Удаление мастера
    deleteMasterBtn.addEventListener('click', () => {
        if (!masterList.value) {
            alert('Выберите мастера для удаления');
            return;
        }
        if (!confirm('Вы уверены, что хотите удалить мастера?')) {
            return;
        }
        fetch('/pinger/api.php?action=delete_master', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: masterList.value })
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(() => {
                selectedMasterId = null;
                loadMasters();
                engineerList.innerHTML = '';
            })
            .catch(err => {
                alert('Ошибка удаления: ' + err.message);
                console.error('Ошибка удаления мастера:', err);
            });
    });

    // Открытие модального окна для добавления техника
    addEngineerBtn.addEventListener('click', () => {
        engineerForm.reset();
        engineerForm.id.value = Date.now();
        engineerErrorDiv.style.display = 'none';
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
                if (selectedMasterId) {
                    engineerMasterSelect.value = selectedMasterId;
                }
                engineerModal.querySelector('h3').textContent = 'Добавление техника';
                engineerModal.style.display = 'flex';
            })
            .catch(err => {
                console.error('Ошибка загрузки мастеров:', err);
                engineerErrorDiv.textContent = 'Ошибка загрузки мастеров: ' + err.message;
                engineerErrorDiv.style.display = 'block';
            });
    });

    // Открытие модального окна для редактирования техника
    editEngineerBtn.addEventListener('click', () => {
        if (!engineerList.value) {
            alert('Выберите техника для редактирования');
            return;
        }
        if (!selectedMasterId) {
            alert('Выберите мастера участка');
            return;
        }
        fetch(`/pinger/api.php?action=list_engineers&master_id=${selectedMasterId}`)
            .then(res => res.json())
            .then(engineers => {
                const engineer = engineers.find(e => e.id === engineerList.value);
                if (!engineer) {
                    throw new Error('Техник не найден');
                }
                engineerForm.id.value = engineer.id;
                engineerForm.fio.value = engineer.fio;
                engineerErrorDiv.style.display = 'none';
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
                        engineerMasterSelect.value = engineer.master_id;
                        engineerModal.querySelector('h3').textContent = 'Редактирование техника';
                        engineerModal.style.display = 'flex';
                    })
                    .catch(err => {
                        console.error('Ошибка загрузки мастеров:', err);
                        engineerErrorDiv.textContent = 'Ошибка загрузки мастеров: ' + err.message;
                        engineerErrorDiv.style.display = 'block';
                    });
            })
            .catch(err => {
                console.error('Ошибка загрузки техника:', err);
                engineerErrorDiv.textContent = 'Ошибка загрузки техника: ' + err.message;
                engineerErrorDiv.style.display = 'block';
            });
    });

    // Удаление техника
    deleteEngineerBtn.addEventListener('click', () => {
        if (!engineerList.value) {
            alert('Выберите техника для удаления');
            return;
        }
        if (!confirm('Вы уверены, что хотите удалить техника?')) {
            return;
        }
        fetch('/pinger/api.php?action=delete_engineer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: engineerList.value })
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(() => {
                loadEngineers(selectedMasterId);
            })
            .catch(err => {
                alert('Ошибка удаления: ' + err.message);
                console.error('Ошибка удаления техника:', err);
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