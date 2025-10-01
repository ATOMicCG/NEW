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
    <title>Редактирование VLAN управления</title>
    <link rel="stylesheet" href="/pinger/css/styles.css?v=1">
    <link rel="stylesheet" href="/pinger/css/mngmtvlan.css?v=1">
    <script src="/pinger/lib/d3.v7.min.js"></script>
    <script src="/pinger/js/mngmtvlan.js"></script>
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
        <h2>Редактирование VLAN управления</h2>
        <div class="vlan-columns">
            <div class="column vlan-list">
                <h3>Список упр. VLAN</h3>
                <table id="vlan-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <div class="column vlan-form">
                <h3>Параметры VLAN</h3>
                <form id="vlan-form">
                    <div class="form-group">
                        <label for="vlan-id">ID</label>
                        <input type="text" id="vlan-id" name="id" required>
                    </div>
                    <div class="form-group">
                        <label for="vlan-gateway">Default Gateway</label>
                        <input type="text" id="vlan-gateway" name="gateway" required>
                    </div>
                    <div class="form-group">
                        <label for="vlan-mask">Mask /XX</label>
                        <input type="text" id="vlan-mask" name="mask" required>
                    </div>
                    <div id="vlan-error" class="error-message"></div>
                </form>
            </div>
            <div class="column vlan-actions">
                <h3>Действия</h3>
                <button id="add-vlan">Добавить VLAN</button>
                <button id="delete-vlan">Удалить VLAN</button>
            </div>
        </div>
    </div>
</body>
</html>