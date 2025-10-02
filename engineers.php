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
    <title>Управление сотрудниками СКС</title>
    <link rel="stylesheet" href="/pinger/css/styles.css?v=1">
    <link rel="stylesheet" href="/pinger/css/engineers.css?v=1">
    <script src="/pinger/js/engineers.js"></script>
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
        <h2>Управление сотрудниками СКС</h2>
        <div class="form-columns">
            <div class="form-column master-column">
                <h4>Мастер участка</h4>
                <select id="master-list" size="10"></select>
            </div>
            <div class="form-column engineer-column">
                <h4>Техники</h4>
                <select id="engineer-list" size="10"></select>
            </div>
        </div>
        <div class="engineer-buttons">
            <button id="add-master">Добавить мастера</button>
            <button id="add-engineer">Добавить техника</button>
        </div>
        <div id="master-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>Добавление мастера</h3>
                <div id="master-error" class="error-message" style="display: none;"></div>
                <form id="master-form">
                    <label>Ф.И.О.: <input type="text" name="fio" required></label>
                    <input type="hidden" name="id">
                    <div class="modal-form-buttons">
                        <button type="button" id="save-master">ОК</button>
                        <button type="button" id="cancel-master">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
        <div id="engineer-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>Добавление техника</h3>
                <div id="engineer-error" class="error-message" style="display: none;"></div>
                <form id="engineer-form">
                    <label>Ф.И.О.: <input type="text" name="fio" required></label>
                    <label>Мастер участка: <select id="engineer-master" name="master_id" required></select></label>
                    <input type="hidden" name="id">
                    <div class="modal-form-buttons">
                        <button type="button" id="save-engineer">ОК</button>
                        <button type="button" id="cancel-engineer">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>