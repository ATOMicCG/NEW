document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('operator-modal');
    const form = document.getElementById('operator-form');
    const tableBody = document.querySelector('#operators-table tbody');
    let selectedOperatorId = null;

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
                console.error('Error loading operators:', err);
                alert('Ошибка загрузки операторов: ' + err.message);
            });
    }

    // Открытие модального окна для создания
    document.getElementById('create-operator').addEventListener('click', () => {
        form.reset();
        form.id.value = Date.now();
        document.getElementById('modal-title').textContent = 'Создать оператора';
        modal.style.display = 'flex';
    });

    // Открытие модального окна для редактирования
    document.getElementById('edit-operator').addEventListener('click', () => {
        if (!selectedOperatorId) {
            alert('Выберите оператора для редактирования!');
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
                form.id.value = op.id;
                form.surname.value = op.surname;
                form.name.value = op.name;
                form.department.value = op.department;
                form.login.value = op.login;
                form.group.value = op.group;
                form.password.value = '';
                document.getElementById('modal-title').textContent = 'Редактировать оператора';
                modal.style.display = 'flex';
            })
            .catch(err => {
                console.error('Error fetching operator:', err);
                alert('Ошибка загрузки оператора: ' + err.message);
            });
    });

    // Удаление оператора
    document.getElementById('delete-operator').addEventListener('click', () => {
        if (!selectedOperatorId) {
            alert('Выберите оператора для удаления!');
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
                    console.error('Error deleting operator:', err);
                    alert('Ошибка удаления оператора: ' + err.message);
                });
        }
    });

    // Отмена/закрытие модального окна
    document.getElementById('cancel-operator').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Сохранение оператора
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const operator = {
            id: form.id.value,
            surname: form.surname.value,
            name: form.name.value,
            department: form.department.value,
            login: form.login.value,
            group: form.group.value,
            password: form.password.value || null
        };
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
                modal.style.display = 'none';
                loadOperators();
            })
            .catch(err => {
                console.error('Error saving operator:', err);
                alert('Ошибка сохранения оператора: ' + err.message);
            });
    });

    // Загрузка операторов при открытии страницы
    loadOperators();
});