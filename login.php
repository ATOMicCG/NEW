<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header('Location: /pinger/index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход - Pinger</title>
    <link rel="stylesheet" href="/pinger/css/styles.css?v=1">
    <link rel="stylesheet" href="/pinger/css/login.css?v=1">
</head>
<body>
    <div class="container">
        <img src="/pinger/api.php?action=get_file&dir=icons&file=mainlogo.png" alt="Pinger Logo" class="logo">
        <h2>Вход в систему</h2>
        <form id="login-form" class="operator-form">
            <div class="form-group">
                <label for="login">Логин:</label>
                <input type="text" id="login" name="login" required>
            </div>
            <div class="form-group">
                <label for="password">Пароль:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="form-actions">
                <button type="submit">Войти</button>
            </div>
        </form>
        <div id="error-message" style="color: red; display: none;"></div>
    </div>
    <script src="/pinger/js/login.js"></script>
</body>
</html>