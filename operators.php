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
    <title>Управление операторами</title>
    <link rel="stylesheet" href="/pinger/css/styles.css?v=1">
    <link rel="stylesheet" href="/pinger/css/operators.css?v=3">
    <script src="/pinger/js/operators.js"></script>
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
        <h2>Управление операторами</h2>
        <div class="operator-buttons">
            <button id="configure-groups">Настройка групп</button>
            <button id="create-operator">Создать оператора</button>
            <button id="edit-operator">Редактировать оператора</button>
            <button id="delete-operator">Удалить оператора</button>
        </div>
        <table id="operators-table">
            <thead>
                <tr>
                    <th>Фамилия</th>
                    <th>Имя</th>
                    <th>Логин</th>
                    <th>Отдел/Должность</th>
                    <th>Последняя активность</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <div id="operator-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3 id="modal-title">Создать оператора</h3>
                <div id="operator-error" class="error-message" style="display: none;"></div>
                <form id="operator-form">
                    <div class="form-columns">
                        <div class="form-column operator-column">
                            <h4>Оператор</h4>
                            <label>Фамилия: <input type="text" name="surname" required></label>
                            <label>Имя: <input type="text" name="name" required></label>
                            <label>Отдел: <input type="text" name="department" required></label>
                            <label>Логин: <input type="text" name="login" required></label>
                            <label>Пароль: <input type="password" name="password"></label>
                            <label>Группа:
                                <select name="group" required id="operator-group"></select>
                            </label>
                            <input type="hidden" name="id">
                        </div>
                        <div class="form-column permissions-column">
                            <h4>Права:</h4>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[edit_maps]"> Изменение карт</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[edit_syntax]"> Изменение синтаксиса</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[view_global_problems]"> Просмотр глоб. проблем</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[add_global_problems]"> Добавлять глоб. проблемы</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[view_operators]"> Просмотр операторов</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[edit_operators]"> Изменение операторов</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[telnet]"> Telnet</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[flood]"> Flood</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[configure_switch]"> Настройка свитча</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[reset_firewall]"> Сброс Firewall</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[edit_dhcp_mode]"> Изменение DHCP режима</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[inventory]"> Инвентаризация</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[add_discrepancies]"> Добавлять несоответствия</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[global_report_filter]"> Фильтр в глоб. репорте</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[add_global_no_call]"> Добавлять глоб. без звонка</label>
                        </div>
                    </div>
                    <div class="modal-form-buttons">
                        <button type="submit">Сохранить</button>
                        <button type="button" id="cancel-operator">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
        <div id="group-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>Настройка групп</h3>
                <div id="group-error" class="error-message" style="display: none;"></div>
                <form id="group-form">
                    <div class="form-columns">
                        <div class="form-column">
                            <h4>Список групп</h4>
                            <select id="group-list" size="10"></select>
                        </div>
                        <div class="form-column permissions-column">
                            <h4>Настройки группы</h4>
                            <label>Название группы: <input type="text" name="group-name" required></label>
                            <h4>Права:</h4>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[edit_maps]"> Изменение карт</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[edit_syntax]"> Изменение синтаксиса</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[view_global_problems]"> Просмотр глоб. проблем</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[add_global_problems]"> Добавлять глоб. проблемы</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[view_operators]"> Просмотр операторов</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[edit_operators]"> Изменение операторов</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[telnet]"> Telnet</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[flood]"> Flood</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[configure_switch]"> Настройка свитча</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[reset_firewall]"> Сброс Firewall</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[edit_dhcp_mode]"> Изменение DHCP режима</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[inventory]"> Инвентаризация</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[add_discrepancies]"> Добавлять несоответствия</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[global_report_filter]"> Фильтр в глоб. репорте</label>
                            <label class="checkbox-label"><input type="checkbox" name="permissions[add_global_no_call]"> Добавлять глоб. без звонка</label>
                            <input type="hidden" name="id">
                        </div>
                    </div>
                    <div class="modal-form-buttons">
                        <button type="button" id="add-group">Добавить группу</button>
                        <button type="button" id="delete-group">Удалить группу</button>
                        <button type="button" id="cancel-group">Выйти</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>