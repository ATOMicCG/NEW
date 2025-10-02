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
    <link rel="stylesheet" href="/pinger/css/operators.css?v=1">
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
            <div class="modal-content-users">
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
                                <select name="group" required>
                                    <option value="Администратор">Администратор</option>
                                    <option value="Техник">Техник</option>
                                    <option value="Гость">Гость</option>
                                </select>
                            </label>
                            <input type="hidden" name="id">
                        </div>
                        <div class="form-column permissions-column">
                            <h4>Права</h4>
                            <checkbox-label><input type="checkbox" name="permissions[edit_maps]"> Изменение карт</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[edit_syntax]"> Изменение синтаксиса</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[view_global_problems]"> Просмотр глоб. проблем</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[add_global_problems]"> Добавлять глоб. проблемы</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[view_operators]"> Просмотр операторов</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[edit_operators]"> Изменение операторов</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[telnet]"> Telnet</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[flood]"> Flood</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[configure_switch]"> Настройка свитча</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[reset_firewall]"> Сброс Firewall</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[edit_dhcp_mode]"> Изменение DHCP режима</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[inventory]"> Инвентаризация</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[add_discrepancies]"> Добавлять несоответствия</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[global_report_filter]"> Фильтр в глоб. репорте</label><br>
                            <checkbox-label><input type="checkbox" name="permissions[add_global_no_call]"> Добавлять глоб. без звонка</label><br>
                        </div>
                    </div>
                    <div class="modal-form-buttons">
                        <button type="submit">Сохранить</button>
                        <button type="button" id="cancel-operator">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>