<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /pinger/login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Управление моделями</title>
    <link rel="stylesheet" href="/pinger/css/styles.css?v=1">
    <link rel="stylesheet" href="/pinger/css/models.css?v=1">
    <script src="/pinger/js/models.js"></script>
</head>
<body>
    <nav id="main-menu">
        <ul>
            <li class="menu-item">
                <a href="/pinger/" class="back-button">Вернуться назад</a>
            </li>
        </ul>
    </nav>
    <div id="workspace">
        <h2>Управление моделями</h2>
        <div class="columns-container">
            <div class="column models-list">
                <h3>Список моделей</h3>
                <div class="models-list-content" id="models-list-content">
                    <!-- Список моделей будет заполняться через JS -->
                </div>
                <div class="column-buttons">
                    <button id="delete-model">Удалить модель</button>
                </div>
            </div>
            <div class="column model-details">
                <h3>Модель</h3>
                <div class="model-form-content">
                    <form id="model-details-form">
                        <div class="form-row">
                            <label>Имя: <input type="text" name="model_name" required></label>
                            <label class="checkbox-label">OLT: <input type="checkbox" name="olt"></label>
                        </div>
                        <label>Neobills:
                            <select name="neobills" required>
                                <option value="">Выберите Neobills</option>
                                <option value="neobills1">Neobills 1</option>
                                <option value="neobills2">Neobills 2</option>
                                <option value="neobills3">Neobills 3</option>
                            </select>
                        </label>
                        <div class="form-row">
                            <label>Uplink: <input type="text" name="uplink" required></label>
                            <label>Кол-во портов: <input type="text" name="ports_count" required></label>
                            <label>Маг. порты: <input type="text" name="mag_ports" required></label>
                        </div>
                        <label>Прошивка:
                            <select name="firmware" required>
                                <option value="">Выберите прошивку</option>
                                <option value="v1.0">v1.0</option>
                                <option value="v1.1">v1.1</option>
                                <option value="v2.0">v2.0</option>
                            </select>
                        </label>
                        <div class="preview-section">
                            <h4>Предпросмотр картинки</h4>
                            <div class="preview-image" id="preview-image"></div>
                            <input type="file" id="upload-image" accept="image/*">
                        </div>
                        <input type="hidden" name="id">
                    </form>
                </div>
                <div class="column-buttons">
                    <button id="add-model">Добавить модель</button>
                    <button id="edit-model">Изменить модель</button>
                </div>
            </div>
            <div class="column syntax">
                <h3>Синтаксис</h3>
                <div class="syntax-columns">
                    <div class="syntax-type">
                        <h4>Тип</h4>
                        <div class="syntax-type-item" data-type="Общие">Общие</div>
                        <div class="syntax-type-item" data-type="Hostname">Hostname</div>
                        <div class="syntax-type-item" data-type="Упр. VLAN">Упр. VLAN</div>
                        <div class="syntax-type-item" data-type="Аккаунты">Аккаунты</div>
                        <div class="syntax-type-item" data-type="IP">IP</div>
                        <div class="syntax-type-item" data-type="Default Route">Default Route</div>
                        <div class="syntax-type-item" data-type="Создание VLAN">Создание VLAN</div>
                        <div class="syntax-type-item" data-type="Доб. портов Untag">Доб. портов Untag</div>
                        <div class="syntax-type-item" data-type="Доб. портов Tag">Доб. портов Tag</div>
                        <div class="syntax-type-item" data-type="Description">Description</div>
                        <div class="syntax-type-item" data-type="DHCP Enable">DHCP Enable</div>
                        <div class="syntax-type-item" data-type="DHCP Vlans">DHCP Vlans</div>
                        <div class="syntax-type-item" data-type="DHCP Ports">DHCP Ports</div>
                        <div class="syntax-type-item" data-type="Address Binding">Address Binding</div>
                        <div class="syntax-type-item" data-type="RSTP">RSTP</div>
                        <div class="syntax-type-item" data-type="RSTP Priority">RSTP Priority</div>
                        <div class="syntax-type-item" data-type="Save">Save</div>
                        <div class="syntax-type-divider">---</div>
                        <div class="syntax-type-item" data-type="SNMP">SNMP</div>
                    </div>
                    <div class="syntax-info">
                        <h4>Инфо</h4>
                        <textarea id="syntax-info-text" placeholder="Введите информацию для выбранного типа"></textarea>
                    </div>
                </div>
                <div class="column-buttons">
                    <button id="save-syntax">Сохранить изменения</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>