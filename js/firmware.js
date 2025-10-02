document.addEventListener('DOMContentLoaded', () => {
    const modelList = document.getElementById('model-list');
    const firmwareText = document.getElementById('firmware-text');
    const saveFirmwareBtn = document.getElementById('save-firmware');
    let selectedModelId = null;
    let selectedModelName = null;

    // Загрузка моделей
    function loadModels() {
        fetch('/pinger/api.php?action=list_firmwares')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(models => {
                modelList.innerHTML = '';
                if (!Array.isArray(models) || models.length === 0) {
                    console.warn('Список моделей пуст или не является массивом');
                    return;
                }
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.model_name;
                    option.dataset.model_name = model.model_name; // Сохраняем model_name
                    modelList.appendChild(option);
                });
                if (selectedModelId) {
                    modelList.value = selectedModelId;
                    loadFirmware(selectedModelId);
                }
            })
            .catch(err => {
                console.error('Ошибка загрузки моделей:', err);
                alert('Ошибка загрузки моделей: ' + err.message);
            });
    }

    // Загрузка прошивки для выбранной модели
    function loadFirmware(modelId) {
        fetch(`/pinger/api.php?action=list_firmwares&firmware_only=1`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(firmwares => {
                const firmware = firmwares.find(f => f.id === modelId);
                firmwareText.value = firmware && firmware.firmware ? firmware.firmware : '';
            })
            .catch(err => {
                console.error('Ошибка загрузки прошивки:', err);
                firmwareText.value = '';
                alert('Ошибка загрузки прошивки: ' + err.message);
            });
    }

    // Обработка выбора модели
    modelList.addEventListener('change', () => {
        selectedModelId = modelList.value;
        selectedModelName = modelList.selectedOptions[0]?.dataset.model_name || '';
        loadFirmware(selectedModelId);
    });

    // Сохранение прошивки
    saveFirmwareBtn.addEventListener('click', () => {
        if (!selectedModelId) {
            alert('Выберите модель!');
            return;
        }
        if (!selectedModelName) {
            alert('Название модели не определено!');
            return;
        }
        const firmwareData = {
            id: selectedModelId,
            model_name: selectedModelName,
            firmware: firmwareText.value
        };
        fetch('/pinger/api.php?action=save_firmware', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(firmwareData)
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(() => {
                alert('Прошивка сохранена!');
            })
            .catch(err => {
                console.error('Ошибка сохранения прошивки:', err);
                alert('Ошибка сохранения прошивки: ' + err.message);
            });
    });

    // Инициализация
    loadModels();
});