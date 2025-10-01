document.addEventListener('DOMContentLoaded', () => {
    const uploadImageInput = document.getElementById('upload-image');
    const previewImageDiv = document.getElementById('preview-image');
    const modelForm = document.getElementById('model-details-form');
    const modelsListContent = document.getElementById('models-list-content');
    const addModelButton = document.getElementById('add-model');
    const editModelButton = document.getElementById('edit-model');
    const saveSyntaxButton = document.getElementById('save-syntax');
    const syntaxTypeItems = document.querySelectorAll('.syntax-type-item');
    const syntaxInfoText = document.getElementById('syntax-info-text');
    let selectedModelId = null;
    let selectedSyntaxType = null;
    let currentSyntaxData = {};

    // Загрузка списка моделей
    function loadModels() {
        fetch('/pinger/api.php?action=list_models')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(text => {
                console.log('Ответ list_models:', text);
                const models = JSON.parse(text);
                modelsListContent.innerHTML = '';
                models.forEach(model => {
                    const div = document.createElement('div');
                    div.textContent = model.model_name;
                    div.className = 'model-item';
                    div.dataset.id = model.id;
                    div.addEventListener('click', () => {
                        document.querySelectorAll('.model-item').forEach(item => item.classList.remove('selected'));
                        div.classList.add('selected');
                        selectedModelId = model.id;
                        // Заполнение формы
                        modelForm.model_name.value = model.model_name;
                        modelForm.olt.checked = model.olt;
                        modelForm.neobills.value = model.neobills;
                        modelForm.uplink.value = model.uplink;
                        modelForm.ports_count.value = model.ports_count;
                        modelForm.mag_ports.value = model.mag_ports;
                        modelForm.firmware.value = model.firmware;
                        modelForm.id.value = model.id;
                        // Отображение картинки
                        previewImageDiv.innerHTML = model.image ? `<img src="/pinger/images/${model.image}" alt="Model Image">` : '';
                        // Загрузка данных синтаксиса
                        currentSyntaxData = model.syntax && typeof model.syntax === 'object' ? model.syntax : {};
                        if (Array.isArray(currentSyntaxData)) {
                            currentSyntaxData = {}; // Преобразование массива в объект
                        }
                        console.log('Загружен syntax:', currentSyntaxData);
                        // Сброс выбранного типа синтаксиса
                        selectedSyntaxType = null;
                        document.querySelectorAll('.syntax-type-item').forEach(item => item.classList.remove('selected'));
                        syntaxInfoText.value = '';
                    });
                    modelsListContent.appendChild(div);
                });
            })
            .catch(err => console.error('Ошибка загрузки моделей:', err));
    }

    // Предпросмотр картинки
    uploadImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                if (img.width > 500 || img.height > 500) {
                    console.log('Размер изображения превышает 500x500, масштабируется в предпросмотре');
                }
                previewImageDiv.innerHTML = '';
                const previewImg = document.createElement('img');
                previewImg.src = img.src;
                previewImageDiv.appendChild(previewImg);
                URL.revokeObjectURL(img.src);
            };
        } else {
            alert('Пожалуйста, выберите изображение');
            uploadImageInput.value = '';
        }
    });

    // Обработка выбора типа синтаксиса
    syntaxTypeItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('syntax-type-divider')) return;
            document.querySelectorAll('.syntax-type-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedSyntaxType = item.dataset.type;
            syntaxInfoText.value = currentSyntaxData[selectedSyntaxType] || '';
            console.log('Выбран тип синтаксиса:', selectedSyntaxType, 'Значение:', syntaxInfoText.value);
        });
    });

    // Обновление данных синтаксиса при редактировании
    syntaxInfoText.addEventListener('input', () => {
        if (selectedSyntaxType) {
            currentSyntaxData[selectedSyntaxType] = syntaxInfoText.value;
            console.log('Обновлён syntax:', currentSyntaxData);
        }
    });

    // Добавление модели
    addModelButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (!modelForm.checkValidity()) {
            alert('Заполните все обязательные поля');
            return;
        }
        const formData = new FormData(modelForm);
        const imageFile = uploadImageInput.files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        formData.append('syntax', JSON.stringify(currentSyntaxData));
        console.log('Отправка add_model, syntax:', currentSyntaxData);
        fetch('/pinger/api.php?action=add_model', {
            method: 'POST',
            body: formData
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(text => {
                console.log('Ответ add_model:', text);
                const data = JSON.parse(text);
                if (data.success) {
                    alert('Модель добавлена');
                    loadModels();
                    modelForm.reset();
                    previewImageDiv.innerHTML = '';
                    uploadImageInput.value = '';
                    currentSyntaxData = {};
                    selectedSyntaxType = null;
                    syntaxInfoText.value = '';
                    document.querySelectorAll('.syntax-type-item').forEach(item => item.classList.remove('selected'));
                } else {
                    alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                }
            })
            .catch(err => {
                console.error('Ошибка добавления модели:', err);
                alert('Ошибка добавления модели');
            });
    });

    // Изменение модели
    function saveModelChanges() {
        if (!selectedModelId) {
            alert('Выберите модель для редактирования');
            return;
        }
        if (!modelForm.checkValidity()) {
            alert('Заполните все обязательные поля');
            return;
        }
        const formData = new FormData(modelForm);
        const imageFile = uploadImageInput.files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        formData.append('id', selectedModelId);
        formData.append('syntax', JSON.stringify(currentSyntaxData));
        console.log('Отправка edit_model, id:', selectedModelId, 'syntax:', currentSyntaxData);
        fetch('/pinger/api.php?action=edit_model', {
            method: 'POST',
            body: formData
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(text => {
                console.log('Ответ edit_model:', text);
                const data = JSON.parse(text);
                if (data.success) {
                    alert('Модель обновлена');
                    loadModels();
                    modelForm.reset();
                    previewImageDiv.innerHTML = '';
                    uploadImageInput.value = '';
                    currentSyntaxData = {};
                    selectedSyntaxType = null;
                    syntaxInfoText.value = '';
                    selectedModelId = null;
                    document.querySelectorAll('.syntax-type-item').forEach(item => item.classList.remove('selected'));
                } else {
                    alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                }
            })
            .catch(err => {
                console.error('Ошибка обновления модели:', err);
                alert('Ошибка обновления модели');
            });
    }

    editModelButton.addEventListener('click', (e) => {
        e.preventDefault();
        saveModelChanges();
    });

    saveSyntaxButton.addEventListener('click', (e) => {
        e.preventDefault();
        saveModelChanges();
    });

    // Инициализация
    loadModels();
});