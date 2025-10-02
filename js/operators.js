document.addEventListener('DOMContentLoaded', () => {
    const operatorModal = document.getElementById('operator-modal');
    const groupModal = document.getElementById('group-modal');
    const operatorForm = document.getElementById('operator-form');
    const groupForm = document.getElementById('group-form');
    const operatorErrorDiv = document.getElementById('operator-error');
    const groupErrorDiv = document.getElementById('group-error');
    const tableBody = document.querySelector('#operators-table tbody');
    const groupList = document.getElementById('group-list');
    const operatorGroupSelect = document.getElementById('operator-group');
    let selectedOperatorId = null;
    let selectedGroupId = null;

    // Загрузка списка групп
    function loadGroups() {
        fetch('/pinger/api.php?action=list_groups')
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(groups => {
                groupList.innerHTML = '';
                operatorGroupSelect.innerHTML = '';
                groups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id;
                    option.textContent = group.name;
                    groupList.appendChild(option);
                    operatorGroupSelect.appendChild(option.cloneNode(true));
                });
            })
            .catch(err => {
                console.error('Ошибка загрузки групп:', err);
                groupErrorDiv.textContent = 'Ошибка загрузки групп: ' + err.message;
                groupErrorDiv.style.display = 'block';
            });
    }

    // Загрузка списка операторов
    function loadOperators() {
        fetch('/pinger/api.php?action=list_operators')
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(operators => {
                tableBody.innerHTML = '';
                operators.forEach(op => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${op.surname}</td>
                        <td>${op.name}</td>
                        <td>${op.login}</td>
                        <td>${op.department}</td>
                        <td>${op.last_activity || '-'}</td>
                    `;
                    row.dataset.id = op.id;
                    row.addEventListener('click', () => {
                        selectedOperatorId = op.id;
                        tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
                        row.classList.add('selected');
                    });
                    tableBody.appendChild(row);
                });
            })
            .catch(err => {
                console.error('Ошибка загрузки операторов:', err);
                operatorErrorDiv.textContent = 'Ошибка загрузки операторов: ' + err.message;
                operatorErrorDiv.style.display = 'block';
            });
    }

    // Открытие модального окна для создания оператора
    document.getElementById('create-operator').addEventListener('click', () => {
        operatorForm.reset();
        operatorForm.id.value = Date.now();
        document.getElementById('modal-title').textContent = 'Создать оператора';
        operatorErrorDiv.style.display = 'none';
        operatorModal.style.display = 'flex';
    });

    // Открытие модального окна для редактирования оператора
    document.getElementById('edit-operator').addEventListener('click', () => {
        if (!selectedOperatorId) {
            operatorErrorDiv.textContent = 'Выберите оператора для редактирования!';
            operatorErrorDiv.style.display = 'block';
            return;
        }
        fetch(`/pinger/api.php?action=get_operator&id=${selectedOperatorId}`)
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(op => {
                operatorForm.id.value = op.id;
                operatorForm.surname.value = op.surname;
                operatorForm.name.value = op.name;
                operatorForm.department.value = op.department;
                operatorForm.login.value = op.login;
                operatorForm.group.value = op.group;
                operatorForm.password.value = '';
                // Заполняем чекбоксы прав
                const permissions = op.permissions || {};
                operatorForm.querySelectorAll('input[name^="permissions"]').forEach(input => {
                    const key = input.name.match(/permissions\[(.+)\]/)[1];
                    input.checked = !!permissions[key];
                });
                document.getElementById('modal-title').textContent = 'Редактировать оператора';
                operatorErrorDiv.style.display = 'none';
                operatorModal.style.display = 'flex';
            })
            .catch(err => {
                console.error('Ошибка загрузки оператора:', err);
                operatorErrorDiv.textContent = 'Ошибка загрузки оператора: ' + err.message;
                operatorErrorDiv.style.display = 'block';
            });
    });

    // Удаление оператора
    document.getElementById('delete-operator').addEventListener('click', () => {
        if (!selectedOperatorId) {
            operatorErrorDiv.textContent = 'Выберите оператора для удаления!';
            operatorErrorDiv.style.display = 'block';
            return;
        }
        if (confirm('Удалить оператора?')) {
            fetch(`/pinger/api.php?action=delete_operator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedOperatorId })
            })
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                    }
                    return res.json();
                })
                .then(() => {
                    selectedOperatorId = null;
                    loadOperators();
                })
                .catch(err => {
                    console.error('Ошибка удаления оператора:', err);
                    operatorErrorDiv.textContent = 'Ошибка удаления оператора: ' + err.message;
                    operatorErrorDiv.style.display = 'block';
                });
        }
    });

    // Открытие модального окна для настройки групп
    document.getElementById('configure-groups').addEventListener('click', () => {
        groupForm.reset();
        groupForm.id.value = Date.now();
        groupList.selectedIndex = -1;
        selectedGroupId = null;
        groupErrorDiv.style.display = 'none';
        groupModal.style.display = 'flex';
    });

    // Выбор группы в списке
    groupList.addEventListener('change', () => {
        selectedGroupId = groupList.value;
        if (selectedGroupId) {
            fetch(`/pinger/api.php?action=get_group&id=${selectedGroupId}`)
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                    }
                    return res.json();
                })
                .then(group => {
                    groupForm['group-name'].value = group.name;
                    const permissions = group.permissions || {};
                    groupForm.querySelectorAll('input[name^="permissions"]').forEach(input => {
                        const key = input.name.match(/permissions\[(.+)\]/)[1];
                        input.checked = !!permissions[key];
                    });
                })
                .catch(err => {
                    console.error('Ошибка загрузки группы:', err);
                    groupErrorDiv.textContent = 'Ошибка загрузки группы: ' + err.message;
                    groupErrorDiv.style.display = 'block';
                });
        }
    });

    // Добавление/сохранение группы
    document.getElementById('add-group').addEventListener('click', () => {
        if (!groupForm['group-name'].value) {
            groupErrorDiv.textContent = 'Введите название группы!';
            groupErrorDiv.style.display = 'block';
            return;
        }
        const group = {
            id: groupForm.id.value,
            name: groupForm['group-name'].value,
            permissions: {}
        };
        groupForm.querySelectorAll('input[name^="permissions"]').forEach(input => {
            const key = input.name.match(/permissions\[(.+)\]/)[1];
            group.permissions[key] = input.checked;
        });
        fetch('/pinger/api.php?action=save_group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(group)
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(() => {
                loadGroups();
                groupForm.reset();
                groupForm.id.value = Date.now();
                groupList.selectedIndex = -1;
                selectedGroupId = null;
                groupErrorDiv.style.display = 'none';
            })
            .catch(err => {
                console.error('Ошибка сохранения группы:', err);
                groupErrorDiv.textContent = 'Ошибка сохранения группы: ' + err.message;
                groupErrorDiv.style.display = 'block';
            });
    });

    // Удаление группы
    document.getElementById('delete-group').addEventListener('click', () => {
        if (!selectedGroupId) {
            groupErrorDiv.textContent = 'Выберите группу для удаления!';
            groupErrorDiv.style.display = 'block';
            return;
        }
        if (confirm('Удалить группу?')) {
            fetch(`/pinger/api.php?action=delete_group`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedGroupId })
            })
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                    }
                    return res.json();
                })
                .then(() => {
                    selectedGroupId = null;
                    loadGroups();
                    groupForm.reset();
                    groupForm.id.value = Date.now();
                    groupList.selectedIndex = -1;
                })
                .catch(err => {
                    console.error('Ошибка удаления группы:', err);
                    groupErrorDiv.textContent = 'Ошибка удаления группы: ' + err.message;
                    groupErrorDiv.style.display = 'block';
                });
        }
    });

    // Закрытие модального окна групп
    document.getElementById('cancel-group').addEventListener('click', () => {
        groupModal.style.display = 'none';
        groupErrorDiv.style.display = 'none';
    });

    // Автоматическое обновление прав при выборе группы в форме оператора
    operatorGroupSelect.addEventListener('change', () => {
        const groupId = operatorGroupSelect.value;
        if (groupId) {
            fetch(`/pinger/api.php?action=get_group&id=${groupId}`)
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                    }
                    return res.json();
                })
                .then(group => {
                    const permissions = group.permissions || {};
                    operatorForm.querySelectorAll('input[name^="permissions"]').forEach(input => {
                        const key = input.name.match(/permissions\[(.+)\]/)[1];
                        input.checked = !!permissions[key];
                    });
                })
                .catch(err => {
                    console.error('Ошибка загрузки прав группы:', err);
                    operatorErrorDiv.textContent = 'Ошибка загрузки прав группы: ' + err.message;
                    operatorErrorDiv.style.display = 'block';
                });
        }
    });

    // Сохранение оператора
    operatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Валидация полей
        const isCreate = document.getElementById('modal-title').textContent === 'Создать оператора';
        if (!operatorForm.surname.value || !operatorForm.name.value || !operatorForm.department.value || !operatorForm.login.value || !operatorForm.group.value) {
            operatorErrorDiv.textContent = 'Заполните все обязательные поля!';
            operatorErrorDiv.style.display = 'block';
            return;
        }
        if (isCreate && !operatorForm.password.value) {
            operatorErrorDiv.textContent = 'Пароль обязателен при создании оператора!';
            operatorErrorDiv.style.display = 'block';
            return;
        }
        const operator = {
            id: operatorForm.id.value,
            surname: operatorForm.surname.value,
            name: operatorForm.name.value,
            department: operatorForm.department.value,
            login: operatorForm.login.value,
            group: operatorGroupSelect.options[operatorGroupSelect.selectedIndex].text,
            password: operatorForm.password.value || null,
            permissions: {}
        };
        operatorForm.querySelectorAll('input[name^="permissions"]').forEach(input => {
            const key = input.name.match(/permissions\[(.+)\]/)[1];
            operator.permissions[key] = input.checked;
        });
        fetch('/pinger/api.php?action=save_operator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operator)
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(() => {
                operatorModal.style.display = 'none';
                operatorErrorDiv.style.display = 'none';
                loadOperators();
            })
            .catch(err => {
                console.error('Ошибка сохранения оператора:', err);
                operatorErrorDiv.textContent = 'Ошибка сохранения оператора: ' + err.message;
                operatorErrorDiv.style.display = 'block';
            });
    });

    // Отмена/закрытие модального окна оператора
    document.getElementById('cancel-operator').addEventListener('click', () => {
        operatorModal.style.display = 'none';
        operatorErrorDiv.style.display = 'none';
    });

    // Загрузка операторов и групп при открытии страницы
    loadOperators();
    loadGroups();
});