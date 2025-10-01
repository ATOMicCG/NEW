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
    <title>Сетевые карты</title>
    <link rel="stylesheet" href="/pinger/css/styles.css?v=5" type="text/css">
    <script src="/pinger/lib/d3.v7.min.js"></script>
    <script>
        window.currentUser = '<?php echo addslashes($_SESSION['login'] ?? 'unknown'); ?>';
    </script>
    <script src="/pinger/js/main.js"></script>
</head>
<body>
    <nav id="main-menu">
        <ul>
            <li class="menu-item">
                <span>Файл</span>
                <ul class="submenu">
                    <li><a href="#" id="create-map">Создать</a></li>
                    <li><a href="#" id="open-map">Открыть</a></li>
                    <li><a href="#" id="save-map">Сохранить</a></li>
                    <li><a href="/pinger/logout.php">Выйти</a></li>
                </ul>
            </li>
            <li class="menu-item">
                <span>Опции</span>
                <ul class="submenu">
                    <li><a href="/pinger/operators.php">Операторы</a></li>
                    <li><a href="#" id="technicians">Техники</a></li>
                    <li><a href="/pinger/models.php" id="models">Модели</a></li>
                    <li><a href="#" id="vlan-management">Упр. VLAN</a></li>
                    <li><a href="#" id="firmware">Прошивки</a></li>
                </ul>
            </li>
            <li class="menu-item edit-button">
                <button id="edit-map">Редактировать</button>
            </li>
        </ul>
    </nav>
    <div id="workspace">
        <div id="tabs"></div>
        <svg id="map" ></svg>
        <div id="context-menu" style="display: none;">
            <ul>
                <li class="context-menu-item">
                    <span>Создать</span>
                    <ul class="context-submenu">
                        <li><a href="#" id="create-switch">Свитч</a></li>
                        <li><a href="#" id="create-planned-switch">Планируемый свитч</a></li>
                        <li><a href="#" id="create-client">Клиент</a></li>
                        <li><a href="#" id="create-line">Линия</a></li>
                        <li><a href="#" id="create-trunk">Магистраль</a></li>
                        <li><a href="#" id="create-soapbox">Мыльница</a></li>
                        <li><a href="#" id="create-table">Таблица</a></li>
                    </ul>
                </li>
                <li class="context-menu-item">
                    <a href="#" id="map-settings">Параметры карты</a>
                </li>
            </ul>
        </div>
    </div>
    <div id="map-name-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h2>Введите название карты</h2>
            <div class="form-group">
                <input type="text" id="map-name-input" placeholder="Название карты" required>
            </div>
            <div id="map-name-error" class="error-message"></div>
            <div class="modal-actions">
                <button id="map-name-ok">ОК</button>
                <button id="map-name-cancel">Отмена</button>
            </div>
        </div>
    </div>
    <div id="open-map-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h2>Открыть карту</h2>
            <table id="map-list-table">
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Дата и время изменения</th>
                        <th>Последние изменения</th>
                    </tr>
                </thead>
                <tbody id="map-list-body"></tbody>
            </table>
            <div id="open-map-error" class="error-message"></div>
            <div class="modal-actions">
                <button id="open-map-ok">ОК</button>
                <button id="open-map-cancel">Отмена</button>
            </div>
        </div>
    </div>
</body>
</html>