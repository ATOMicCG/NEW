// mngmtvlan.js
let vlans = []; // Список VLAN
let selectedVlanId = null; // ID выбранного VLAN

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadVlanList();
    initializeEventListeners();
});

// Установка обработчиков событий
function initializeEventListeners() {
    // Выбор VLAN из списка
    d3.select('#vlan-table tbody').on('click', (event) => {
        const target = d3.select(event.target.closest('tr'));
        if (!target.empty()) {
            const vlanId = target.datum().id;
            selectedVlanId = vlanId;
            updateVlanForm(vlanId);
            d3.select('#vlan-table tbody').selectAll('tr').classed('selected', false);
            target.classed('selected', true);
        }
    });

    // Добавление/обновление VLAN
    d3.select('#add-vlan').on('click', () => addVlan());

    // Удаление VLAN
    d3.select('#delete-vlan').on('click', () => deleteVlan());
}

// Загрузка списка VLAN
async function loadVlanList() {
    try {
        const response = await fetch('/pinger/api.php?action=get_file&dir=lists&file=mngmtvlan.json');
        const data = await response.json();
        if (data.error) {
            console.error('Failed to load VLAN list:', data.error);
            d3.select('#vlan-error').text(data.error).style('display', 'block');
            return;
        }
        vlans = data || [];
        console.log('VLAN list:', vlans);
        updateVlanTable();
    } catch (error) {
        console.error('Failed to load VLAN list:', error);
        d3.select('#vlan-error').text('Ошибка загрузки списка VLAN').style('display', 'block');
    }
}

// Обновление таблицы VLAN
function updateVlanTable() {
    const tableBody = d3.select('#vlan-table tbody');
    tableBody.selectAll('tr').remove();
    tableBody.selectAll('tr')
        .data(vlans)
        .enter()
        .append('tr')
        .classed('selected', d => d.id === selectedVlanId)
        .html(d => `<td>${d.id}</td>`);
}

// Обновление формы для редактирования VLAN
function updateVlanForm(vlanId) {
    const vlan = vlans.find(v => v.id === vlanId);
    if (vlan) {
        d3.select('#vlan-id').property('value', vlan.id);
        d3.select('#vlan-gateway').property('value', vlan.gateway);
        d3.select('#vlan-mask').property('value', vlan.mask);
    } else {
        d3.select('#vlan-form').node().reset();
    }
    d3.select('#vlan-error').style('display', 'none');
}

// Добавление или обновление VLAN
async function addVlan() {
    const id = d3.select('#vlan-id').property('value').trim();
    const gateway = d3.select('#vlan-gateway').property('value').trim();
    const mask = d3.select('#vlan-mask').property('value').trim();

    if (!id || !gateway || !mask) {
        d3.select('#vlan-error').text('Заполните все поля').style('display', 'block');
        return;
    }

    // Валидация формата gateway (например, 192.168.1.1)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(gateway)) {
        d3.select('#vlan-error').text('Неверный формат Default Gateway').style('display', 'block');
        return;
    }

    // Валидация формата mask (например, /24)
    const maskRegex = /^\/([1-2]?[0-9]|3[0-2])$/;
    if (!maskRegex.test(mask)) {
        d3.select('#vlan-error').text('Маска должна быть в формате /XX (1-32)').style('display', 'block');
        return;
    }

    const vlanIndex = vlans.findIndex(v => v.id === id);
    if (vlanIndex !== -1) {
        // Обновляем существующий VLAN
        vlans[vlanIndex] = { id, gateway, mask };
    } else {
        // Добавляем новый VLAN
        vlans.push({ id, gateway, mask });
    }
    selectedVlanId = id;
    await saveVlanList();
    updateVlanTable();
    updateVlanForm(id);
}

// Удаление VLAN
async function deleteVlan() {
    if (!selectedVlanId) {
        d3.select('#vlan-error').text('Выберите VLAN для удаления').style('display', 'block');
        return;
    }
    vlans = vlans.filter(v => v.id !== selectedVlanId);
    selectedVlanId = null;
    await saveVlanList();
    updateVlanTable();
    d3.select('#vlan-form').node().reset();
    d3.select('#vlan-error').style('display', 'none');
}

// Сохранение списка VLAN
async function saveVlanList() {
    try {
        const response = await fetch('/pinger/api.php?action=save_file&dir=lists&file=mngmtvlan.json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vlans)
        });
        const result = await response.json();
        if (result.error) {
            console.error('Save VLAN list failed:', result.error);
            d3.select('#vlan-error').text(result.error).style('display', 'block');
        } else {
            d3.select('#vlan-error').style('display', 'none');
        }
    } catch (error) {
        console.error('Save VLAN list failed:', error);
        d3.select('#vlan-error').text('Ошибка сохранения списка VLAN').style('display', 'block');
    }
}