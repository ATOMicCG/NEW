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
    <title>Управление прошивками</title>
    <link rel="stylesheet" href="/pinger/css/styles.css?v=1">
    <link rel="stylesheet" href="/pinger/css/firmware.css?v=1">
    <script src="/pinger/js/firmware.js"></script>
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
        <h2>Управление прошивками</h2>
        <div class="form-columns">
            <div class="form-column model-column">
                <h4>Модель</h4>
                <select id="model-list" size="10"></select>
            </div>
            <div class="form-column firmware-column">
                <h4>Прошивки</h4>
                <textarea id="firmware-text" rows="20" style="width: 100%;"></textarea>
            </div>
        </div>
        <div class="firmware-buttons">
            <button id="save-firmware">Сохранить</button>
        </div>
    </div>
</body>
</html>