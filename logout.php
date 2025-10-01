<?php
session_start();
session_destroy(); // Завершаем сессию
header('Location: /pinger/login.php'); // Редирект на страницу входа
exit;
?>