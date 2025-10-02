<?php
session_start();

function log_error($message) {
    error_log(date('[Y-m-d H:i:s] ') . $message . "\n", 3, __DIR__ . '/api_error.log');
}

function safe_path($dir, $file) {
    $base = __DIR__ . '/' . $dir . '/';
    $path = realpath($base . $file);
    return $path && strpos($path, realpath($base)) === 0 ? $path : false;
}

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$modelsDir = __DIR__ . '/models';
$modelsFile = $modelsDir . '/models.json';

// Инициализация папки и models.json
if (!is_dir($modelsDir)) {
    mkdir($modelsDir, 0755, true);
}
if (!file_exists($modelsFile)) {
    file_put_contents($modelsFile, json_encode([]));
}

function generateUniqueId() {
    return uniqid('model_');
}

switch ($action) {
    case 'login':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['login']) || !isset($data['password'])) {
            log_error("Логин или пароль отсутствуют для входа");
            http_response_code(400);
            echo json_encode(['error' => 'Требуются логин и пароль']);
            exit;
        }
        $path = __DIR__ . '/operators/users.json';
        if (!file_exists($path)) {
            log_error("users.json не найден: $path");
            http_response_code(404);
            echo json_encode(['error' => 'users.json не найден']);
            exit;
        }
        $operators = json_decode(file_get_contents($path), true);
        if ($operators === null) {
            log_error("Неверный JSON в users.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный JSON в users.json']);
            exit;
        }
        $user = array_filter($operators, fn($op) => $op['login'] === $data['login']);
        if (empty($user)) {
            log_error("Пользователь не найден: {$data['login']}");
            http_response_code(401);
            echo json_encode(['error' => 'Неверный логин или пароль']);
            exit;
        }
        $user = array_values($user)[0];
        if (!password_verify($data['password'], $user['password_hash'])) {
            log_error("Неверный пароль для пользователя: {$data['login']}");
            http_response_code(401);
            echo json_encode(['error' => 'Неверный логин или пароль']);
            exit;
        }
        // --- Обновляем last_activity ---
        $index = array_search($user['id'], array_column($operators, 'id'));
        if ($index !== false) {
            // Создаём объект DateTime с временной зоной UTC+3
            $dt = new DateTime('now', new DateTimeZone('Etc/GMT-3')); // GMT-3 = UTC+3
            $operators[$index]['last_activity'] = $dt->format('Y-m-d H:i:s'); // Формат даты/времени

            if (!file_put_contents($path, json_encode($operators, JSON_PRETTY_PRINT))) {
                log_error("Не удалось обновить last_activity в users.json: $path");
                http_response_code(500);
                echo json_encode(['error' => 'Не удалось обновить активность пользователя']);
                exit;
            }
        } else {
            log_error("Не удалось найти индекс пользователя для обновления last_activity: ID {$user['id']}");
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['login'] = $user['login'];
        echo json_encode(['success' => true]);
        break;

    case 'get_file':
        $dir = $_GET['dir'] ?? '';
        $file = $_GET['file'] ?? '';
        log_error("get_file вызван с dir: '$dir', file: '$file'");
        if (!$dir || !$file) {
            log_error("Требуются директория и файл для get_file - dir: '$dir', file: '$file'");
            http_response_code(400);
            echo json_encode(['error' => 'Требуются директория и файл']);
            exit;
        }
        $path = safe_path($dir, $file);
        log_error("Безопасный путь: $path");
        if (!file_exists($path)) {
            log_error("Файл не существует: $path");
            http_response_code(404);
            echo json_encode(['error' => 'Файл не найден']);
            exit;
        }
        $mime = mime_content_type($path);
        log_error("Тип MIME: $mime");
        header("Content-Type: $mime");
        readfile($path);
        exit;

    case 'list_maps':
        $files = glob(__DIR__ . '/maps/*.json');
        $maps = array_map(function($file) {
            $data = json_decode(file_get_contents($file), true);
            return [
                'name' => basename($file, '.json'),
                'mtime' => filemtime($file),
                'last_modified_by' => $data['last_modified_by'] ?? 'Неизвестно'
            ];
        }, $files);
        echo json_encode($maps);
        break;

    case 'load_map':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            log_error("Требуется ID карты для load_map");
            http_response_code(400);
            echo json_encode(['error' => 'Требуется ID карты']);
            exit;
        }
        $path = safe_path('maps', $id . '.json');
        if (!$path || !file_exists($path)) {
            log_error("Карта не найдена: $path");
            http_response_code(404);
            echo json_encode(['error' => 'Карта не найдена']);
            exit;
        }
        echo file_get_contents($path);
        break;

    case 'save_map':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            log_error("Требуется ID карты для save_map");
            http_response_code(400);
            echo json_encode(['error' => 'Требуется ID карты']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            log_error("Неверные или отсутствующие данные карты для save_map");
            http_response_code(400);
            echo json_encode(['error' => 'Неверные или отсутствующие данные карты']);
            exit;
        }
        $data['last_modified_by'] = $_SESSION['login'] ?? 'unknown';
        $path = __DIR__ . '/maps/' . basename($id) . '.json';
        if (!is_writable(__DIR__ . '/maps')) {
            log_error("Директория карт недоступна для записи: " . __DIR__ . '/maps');
            http_response_code(500);
            echo json_encode(['error' => 'Невозможно записать в директорию карт']);
            exit;
        }
        if (file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT)) === false) {
            log_error("Не удалось сохранить карту: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Не удалось сохранить карту']);
            exit;
        }
        log_error("Карта успешно сохранена: $path");
        echo json_encode(['success' => true]);
        break;

    case 'list_operators':
        $path = __DIR__ . '/operators/users.json';
        if (!file_exists($path)) {
            if (!is_writable(dirname($path))) {
                log_error("Невозможно записать в директорию: " . dirname($path));
                http_response_code(500);
                echo json_encode(['error' => 'Невозможно записать в директорию операторов']);
                exit;
            }
            file_put_contents($path, json_encode([]));
        }
        $content = file_get_contents($path);
        if ($content === false || $content === '') {
            log_error("Не удалось прочитать users.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Не удалось прочитать users.json']);
            exit;
        }
        $operators = json_decode($content, true);
        if ($operators === null) {
            log_error("Неверный JSON в users.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный JSON в users.json']);
            exit;
        }
        echo json_encode($operators);
        break;

    case 'get_operator':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            log_error("Требуется ID оператора для get_operator");
            http_response_code(400);
            echo json_encode(['error' => 'Требуется ID оператора']);
            exit;
        }
        $path = __DIR__ . '/operators/users.json';
        if (!file_exists($path)) {
            log_error("users.json не найден: $path");
            http_response_code(404);
            echo json_encode(['error' => 'users.json не найден']);
            exit;
        }
        $operators = json_decode(file_get_contents($path), true);
        if ($operators === null) {
            log_error("Неверный JSON в users.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный JSON в users.json']);
            exit;
        }
        $operator = array_filter($operators, fn($op) => $op['id'] == $id);
        if (empty($operator)) {
            log_error("Оператор не найден: ID $id");
            http_response_code(404);
            echo json_encode(['error' => 'Оператор не найден']);
            exit;
        }
        echo json_encode(array_values($operator)[0]);
        break;

    case 'save_operator':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            log_error("Неверный JSON или отсутствует ID для save_operator");
            http_response_code(400);
            echo json_encode(['error' => 'Неверный JSON или отсутствует ID']);
            exit;
        }
        $path = __DIR__ . '/operators/users.json';
        if (!file_exists($path)) {
            if (!is_writable(dirname($path))) {
                log_error("Невозможно записать в директорию: " . dirname($path));
                http_response_code(500);
                echo json_encode(['error' => 'Невозможно записать в директорию операторов']);
                exit;
            }
            file_put_contents($path, json_encode([]));
        }
        $operators = json_decode(file_get_contents($path), true);
        if ($operators === null) {
            log_error("Неверный JSON в users.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный JSON в users.json']);
            exit;
        }
        $index = array_search($data['id'], array_column($operators, 'id'));
        if ($data['password']) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
            unset($data['password']);
        } elseif ($index !== false) {
            $data['password_hash'] = $operators[$index]['password_hash'];
        }
        if ($index !== false) {
            $operators[$index] = $data;
        } else {
            $operators[] = $data;
        }
        if (!file_put_contents($path, json_encode($operators, JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать в users.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Не удалось записать в users.json']);
            exit;
        }
        echo json_encode(['success' => true]);
        break;

    case 'delete_operator':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            log_error("Требуется ID оператора для delete_operator");
            http_response_code(400);
            echo json_encode(['error' => 'Требуется ID оператора']);
            exit;
        }
        $id = $data['id'];
        $path = __DIR__ . '/operators/users.json';
        if (!file_exists($path)) {
            log_error("users.json не найден: $path");
            http_response_code(404);
            echo json_encode(['error' => 'users.json не найден']);
            exit;
        }
        $operators = json_decode(file_get_contents($path), true);
        if ($operators === null) {
            log_error("Неверный JSON в users.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный JSON в users.json']);
            exit;
        }
        $operators = array_filter($operators, fn($op) => $op['id'] != $id);
        if (!file_put_contents($path, json_encode(array_values($operators), JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать в users.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Не удалось записать в users.json']);
            exit;
        }
        echo json_encode(['success' => true]);
        break;

    case 'list_models':
        $models = json_decode(file_get_contents($modelsFile), true);
        if ($models === null) {
            log_error("Неверный JSON в models.json: $modelsFile");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный JSON в models.json']);
            exit;
        }
        $detailedModels = array_map(function($model) use ($modelsDir) {
            $modelFile = $modelsDir . '/' . $model['id'] . '.json';
            if (file_exists($modelFile)) {
                $data = json_decode(file_get_contents($modelFile), true);
                // Исправляем syntax, если он массив, на объект
                if (is_array($data['syntax']) && array_is_list($data['syntax'])) {
                    $data['syntax'] = [];
                }
                return $data ?: $model;
            }
            return $model;
        }, $models ?: []);
        echo json_encode($detailedModels);
        break;

    case 'add_model':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для add_model");
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Не авторизован']);
            exit;
        }
        $syntaxData = json_decode($_POST['syntax'] ?? '{}', true);
        if (!is_array($syntaxData)) {
            log_error("Неверный формат syntax для add_model: " . ($_POST['syntax'] ?? 'пусто'));
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Неверный формат syntax']);
            exit;
        }
        log_error("Получен syntax для add_model: " . json_encode($syntaxData));
        $model = [
            'id' => generateUniqueId(),
            'model_name' => $_POST['model_name'] ?? '',
            'olt' => isset($_POST['olt']),
            'neobills' => $_POST['neobills'] ?? '',
            'uplink' => $_POST['uplink'] ?? '',
            'ports_count' => $_POST['ports_count'] ?? '',
            'mag_ports' => $_POST['mag_ports'] ?? '',
            'firmware' => $_POST['firmware'] ?? '',
            'image' => '',
            'syntax' => $syntaxData
        ];
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $image = $_FILES['image'];
            $ext = pathinfo($image['name'], PATHINFO_EXTENSION);
            $filename = $model['id'] . '.' . $ext;
            $target = __DIR__ . '/images/' . $filename;
            if (!is_writable(__DIR__ . '/images')) {
                log_error("Директория изображений недоступна для записи: " . __DIR__ . '/images');
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Невозможно записать в директорию изображений']);
                exit;
            }
            if (move_uploaded_file($image['tmp_name'], $target)) {
                $model['image'] = $filename;
            } else {
                log_error("Не удалось загрузить изображение: $target");
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Не удалось загрузить изображение']);
                exit;
            }
        }
        $models = json_decode(file_get_contents($modelsFile), true);
        if ($models === null) {
            log_error("Неверный JSON в models.json: $modelsFile");
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Неверный JSON в models.json']);
            exit;
        }
        $models[] = ['id' => $model['id'], 'model_name' => $model['model_name']];
        if (!file_put_contents($modelsFile, json_encode($models, JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать в models.json: $modelsFile");
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Не удалось записать в models.json']);
            exit;
        }
        $modelFile = $modelsDir . '/' . $model['id'] . '.json';
        if (!file_put_contents($modelFile, json_encode($model, JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать модель в $modelFile");
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Не удалось записать модель']);
            exit;
        }
        log_error("Модель успешно добавлена: $modelFile");
        echo json_encode(['success' => true]);
        break;

    case 'edit_model':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для edit_model");
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Не авторизован']);
            exit;
        }
        $id = $_POST['id'] ?? '';
        if (!$id) {
            log_error("Требуется ID модели для edit_model");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Требуется ID модели']);
            exit;
        }
        $syntaxData = json_decode($_POST['syntax'] ?? '{}', true);
        if (!is_array($syntaxData)) {
            log_error("Неверный формат syntax для edit_model: " . ($_POST['syntax'] ?? 'пусто'));
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Неверный формат syntax']);
            exit;
        }
        log_error("Получен syntax для edit_model: " . json_encode($syntaxData));
        $models = json_decode(file_get_contents($modelsFile), true);
        if ($models === null) {
            log_error("Неверный JSON в models.json: $modelsFile");
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Неверный JSON в models.json']);
            exit;
        }
        $index = array_search($id, array_column($models, 'id'));
        if ($index === false) {
            log_error("Модель не найдена: ID $id");
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Модель не найдена']);
            exit;
        }
        $modelFile = $modelsDir . '/' . $id . '.json';
        $existingModel = file_exists($modelFile) ? json_decode(file_get_contents($modelFile), true) : [];
        $model = [
            'id' => $id,
            'model_name' => $_POST['model_name'] ?? $existingModel['model_name'],
            'olt' => isset($_POST['olt']),
            'neobills' => $_POST['neobills'] ?? $existingModel['neobills'],
            'uplink' => $_POST['uplink'] ?? $existingModel['uplink'],
            'ports_count' => $_POST['ports_count'] ?? $existingModel['ports_count'],
            'mag_ports' => $_POST['mag_ports'] ?? $existingModel['mag_ports'],
            'firmware' => $_POST['firmware'] ?? $existingModel['firmware'],
            'image' => $existingModel['image'] ?? '',
            'syntax' => $syntaxData
        ];
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $image = $_FILES['image'];
            $ext = pathinfo($image['name'], PATHINFO_EXTENSION);
            $filename = $id . '.' . $ext;
            $target = __DIR__ . '/images/' . $filename;
            if (!is_writable(__DIR__ . '/images')) {
                log_error("Директория изображений недоступна для записи: " . __DIR__ . '/images');
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Невозможно записать в директорию изображений']);
                exit;
            }
            if (move_uploaded_file($image['tmp_name'], $target)) {
                $model['image'] = $filename;
            } else {
                log_error("Не удалось загрузить изображение: $target");
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Не удалось загрузить изображение']);
                exit;
            }
        }
        $models[$index] = ['id' => $id, 'model_name' => $model['model_name']];
        if (!file_put_contents($modelsFile, json_encode($models, JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать в models.json: $modelsFile");
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Не удалось записать в models.json']);
            exit;
        }
        if (!file_put_contents($modelFile, json_encode($model, JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать модель в $modelFile");
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Не удалось записать модель']);
            exit;
        }
        log_error("Модель успешно обновлена: $modelFile");
        echo json_encode(['success' => true]);
        break;
        case 'save_file':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для save_file");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $dir = $_GET['dir'] ?? '';
        $file = $_GET['file'] ?? '';
        log_error("save_file вызван с dir: '$dir', file: '$file'");
        if (!$dir || !$file) {
            log_error("Требуются директория и файл для save_file - dir: '$dir', file: '$file'");
            http_response_code(400);
            echo json_encode(['error' => 'Требуются директория и файл']);
            exit;
        }
        $path = safe_path($dir, $file);
        log_error("Безопасный путь: $path");
        if ($path === false) {
            log_error("Недопустимый путь: $dir/$file");
            http_response_code(400);
            echo json_encode(['error' => 'Недопустимый путь']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if ($data === null) {
            log_error("Неверный формат данных для save_file: " . file_get_contents('php://input'));
            http_response_code(400);
            echo json_encode(['error' => 'Неверный формат данных']);
            exit;
        }
        if (!is_writable(dirname($path))) {
            log_error("Директория недоступна для записи: " . dirname($path));
            http_response_code(500);
            echo json_encode(['error' => 'Нет прав для записи в директорию']);
            exit;
        }
        if (!file_exists($path)) {
            log_error("Файл не существует, создаём: $path");
            if (!file_put_contents($path, '[]')) {
                log_error("Не удалось создать файл: $path");
                http_response_code(500);
                echo json_encode(['error' => 'Не удалось создать файл']);
                exit;
            }
        }
        if (!file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать данные в файл: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка записи файла']);
            exit;
        }
        log_error("Файл успешно сохранён: $path");
        echo json_encode(['success' => true]);
        break;
        
        case 'list_groups':
        $path = __DIR__ . '/operators/groups.json';
        if (!file_exists($path)) {
            log_error("groups.json не найден: $path");
            http_response_code(404);
            echo json_encode(['error' => 'groups.json не найден']);
            exit;
        }
        $data = json_decode(file_get_contents($path), true);
        if ($data === null) {
            log_error("Неверный JSON в groups.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных']);
            exit;
        }
        echo json_encode($data);
        break;

    case 'get_group':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            log_error("Требуется ID для get_group");
            http_response_code(400);
            echo json_encode(['error' => 'Требуется ID группы']);
            exit;
        }
        $path = __DIR__ . '/operators/groups.json';
        if (!file_exists($path)) {
            log_error("groups.json не найден: $path");
            http_response_code(404);
            echo json_encode(['error' => 'groups.json не найден']);
            exit;
        }
        $groups = json_decode(file_get_contents($path), true);
        if ($groups === null) {
            log_error("Неверный JSON в groups.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных']);
            exit;
        }
        $group = array_filter($groups, fn($g) => $g['id'] == $id);
        if (empty($group)) {
            log_error("Группа не найдена: $id");
            http_response_code(404);
            echo json_encode(['error' => 'Группа не найдена']);
            exit;
        }
        echo json_encode(array_values($group)[0]);
        break;

    case 'save_group':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для save_group");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $path = __DIR__ . '/operators/groups.json';
        if (!file_exists($path)) {
            log_error("groups.json не найден, создаём: $path");
            file_put_contents($path, '[]');
        }
        $groups = json_decode(file_get_contents($path), true);
        if ($groups === null) {
            log_error("Неверный JSON в groups.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'], $data['name'], $data['permissions'])) {
            log_error("Недостаточно данных для save_group: " . json_encode($data));
            http_response_code(400);
            echo json_encode(['error' => 'Требуются все обязательные поля']);
            exit;
        }
        $index = array_search($data['id'], array_column($groups, 'id'));
        if ($index !== false) {
            $groups[$index]['name'] = $data['name'];
            $groups[$index]['permissions'] = $data['permissions'];
        } else {
            $groups[] = [
                'id' => $data['id'],
                'name' => $data['name'],
                'permissions' => $data['permissions']
            ];
        }
        if (!file_put_contents($path, json_encode($groups, JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать groups.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка записи файла']);
            exit;
        }
        log_error("Группа сохранена: " . $data['id']);
        echo json_encode(['success' => true]);
        break;

    case 'delete_group':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для delete_group");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            log_error("Требуется ID для delete_group");
            http_response_code(400);
            echo json_encode(['error' => 'Требуется ID группы']);
            exit;
        }
        $path = __DIR__ . '/operators/groups.json';
        if (!file_exists($path)) {
            log_error("groups.json не найден: $path");
            http_response_code(404);
            echo json_encode(['error' => 'groups.json не найден']);
            exit;
        }
        $groups = json_decode(file_get_contents($path), true);
        if ($groups === null) {
            log_error("Неверный JSON в groups.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных']);
            exit;
        }
        $index = array_search($data['id'], array_column($groups, 'id'));
        if ($index === false) {
            log_error("Группа не найдена для удаления: " . $data['id']);
            http_response_code(404);
            echo json_encode(['error' => 'Группа не найдена']);
            exit;
        }
        array_splice($groups, $index, 1);
        if (!file_put_contents($path, json_encode($groups, JSON_PRETTY_PRINT))) {
            log_error("Не удалось записать groups.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка записи файла']);
            exit;
        }
        log_error("Группа удалена: " . $data['id']);
        echo json_encode(['success' => true]);
        break;
        
        case 'list_masters':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для list_masters");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $path = __DIR__ . '/lists/masters.json';
        if (!file_exists($path)) {
            log_error("masters.json не найден, создаём: $path");
            file_put_contents($path, json_encode([]));
        }
        $file_content = file_get_contents($path);
        if ($file_content === '') {
            log_error("masters.json пуст, инициализируем: $path");
            file_put_contents($path, json_encode([]));
            $file_content = '[]';
        }
        $masters = json_decode($file_content, true);
        if ($masters === null) {
            log_error("Неверный JSON в masters.json: $path, содержимое: " . substr($file_content, 0, 100));
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в masters.json']);
            exit;
        }
        echo json_encode($masters);
        break;

    case 'save_master':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для save_master");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $path = __DIR__ . '/lists/masters.json';
        if (!file_exists($path)) {
            log_error("masters.json не найден, создаём: $path");
            file_put_contents($path, json_encode([]));
        }
        $file_content = file_get_contents($path);
        if ($file_content === '') {
            log_error("masters.json пуст, инициализируем: $path");
            file_put_contents($path, json_encode([]));
            $file_content = '[]';
        }
        $masters = json_decode($file_content, true);
        if ($masters === null) {
            log_error("Неверный JSON в masters.json: $path, содержимое: " . substr($file_content, 0, 100));
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в masters.json']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'], $data['fio'])) {
            log_error("Недостаточно данных для save_master: " . json_encode($data));
            http_response_code(400);
            echo json_encode(['error' => 'Требуются все обязательные поля']);
            exit;
        }
        if (array_filter($masters, fn($m) => $m['fio'] === $data['fio'] && $m['id'] !== $data['id'])) {
            log_error("Мастер с Ф.И.О. уже существует: " . $data['fio']);
            http_response_code(400);
            echo json_encode(['error' => 'Мастер с таким Ф.И.О. уже существует']);
            exit;
        }
        $index = array_search($data['id'], array_column($masters, 'id'));
        if ($index !== false) {
            $masters[$index]['fio'] = $data['fio'];
        } else {
            $masters[] = [
                'id' => $data['id'],
                'fio' => $data['fio']
            ];
        }
        if (!file_put_contents($path, json_encode($masters, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            log_error("Не удалось записать masters.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка записи файла']);
            exit;
        }
        log_error("Мастер сохранён: " . $data['id']);
        echo json_encode(['success' => true]);
        break;

    case 'list_engineers':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для list_engineers");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $path = __DIR__ . '/lists/engineers.json';
        if (!file_exists($path)) {
            log_error("engineers.json не найден, создаём: $path");
            file_put_contents($path, json_encode([]));
        }
        $file_content = file_get_contents($path);
        if ($file_content === '') {
            log_error("engineers.json пуст, инициализируем: $path");
            file_put_contents($path, json_encode([]));
            $file_content = '[]';
        }
        $engineers = json_decode($file_content, true);
        if ($engineers === null) {
            log_error("Неверный JSON в engineers.json: $path, содержимое: " . substr($file_content, 0, 100));
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в engineers.json']);
            exit;
        }
        $master_id = $_GET['master_id'] ?? null;
        if ($master_id) {
            $engineers = array_filter($engineers, fn($e) => $e['master_id'] === $master_id);
        }
        echo json_encode(array_values($engineers));
        break;

    case 'save_engineer':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для save_engineer");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $path = __DIR__ . '/lists/engineers.json';
        if (!file_exists($path)) {
            log_error("engineers.json не найден, создаём: $path");
            file_put_contents($path, json_encode([]));
        }
        $file_content = file_get_contents($path);
        if ($file_content === '') {
            log_error("engineers.json пуст, инициализируем: $path");
            file_put_contents($path, json_encode([]));
            $file_content = '[]';
        }
        $engineers = json_decode($file_content, true);
        if ($engineers === null) {
            log_error("Неверный JSON в engineers.json: $path, содержимое: " . substr($file_content, 0, 100));
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в engineers.json']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'], $data['fio'], $data['master_id'])) {
            log_error("Недостаточно данных для save_engineer: " . json_encode($data));
            http_response_code(400);
            echo json_encode(['error' => 'Требуются все обязательные поля']);
            exit;
        }
        if (array_filter($engineers, fn($e) => $e['fio'] === $data['fio'] && $e['id'] !== $data['id'])) {
            log_error("Техник с Ф.И.О. уже существует: " . $data['fio']);
            http_response_code(400);
            echo json_encode(['error' => 'Техник с таким Ф.И.О. уже существует']);
            exit;
        }
        $index = array_search($data['id'], array_column($engineers, 'id'));
        if ($index !== false) {
            $engineers[$index]['fio'] = $data['fio'];
            $engineers[$index]['master_id'] = $data['master_id'];
        } else {
            $engineers[] = [
                'id' => $data['id'],
                'fio' => $data['fio'],
                'master_id' => $data['master_id']
            ];
        }
        if (!file_put_contents($path, json_encode($engineers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            log_error("Не удалось записать engineers.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка записи файла']);
            exit;
        }
        log_error("Техник сохранён: " . $data['id']);
        echo json_encode(['success' => true]);
        break;

        case 'list_firmwares':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для list_firmwares");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $path = __DIR__ . '/models/models.json';
        if (!file_exists($path)) {
            log_error("models.json не найден, создаём: $path");
            file_put_contents($path, json_encode([]));
        }
        $file_content = file_get_contents($path);
        if ($file_content === '') {
            log_error("models.json пуст, инициализируем: $path");
            file_put_contents($path, json_encode([]));
            $file_content = '[]';
        }
        $models = json_decode($file_content, true);
        if ($models === null) {
            log_error("Неверный JSON в models.json: $path, содержимое: " . substr($file_content, 0, 100));
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в models.json']);
            exit;
        }
        echo json_encode($models);
        break;

    case 'save_firmware':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для save_firmware");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $path = __DIR__ . '/lists/firmware.json';
        if (!file_exists($path)) {
            log_error("firmware.json не найден, создаём: $path");
            file_put_contents($path, json_encode([]));
        }
        $file_content = file_get_contents($path);
        if ($file_content === '') {
            log_error("firmware.json пуст, инициализируем: $path");
            file_put_contents($path, json_encode([]));
            $file_content = '[]';
        }
        $firmwares = json_decode($file_content, true);
        if ($firmwares === null) {
            log_error("Неверный JSON в firmware.json: $path, содержимое: " . substr($file_content, 0, 100));
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в firmware.json']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'], $data['model_name'], $data['firmware'])) {
            log_error("Недостаточно данных для save_firmware: " . json_encode($data));
            http_response_code(400);
            echo json_encode(['error' => 'Требуются все обязательные поля']);
            exit;
        }
        // Проверка соответствия model_name в models.json
        $models_path = __DIR__ . '/models/models.json';
        if (!file_exists($models_path)) {
            log_error("models.json не найден: $models_path");
            http_response_code(404);
            echo json_encode(['error' => 'models.json не найден']);
            exit;
        }
        $models = json_decode(file_get_contents($models_path), true);
        if ($models === null) {
            log_error("Неверный JSON в models.json: $models_path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в models.json']);
            exit;
        }
        $model = array_filter($models, fn($m) => $m['id'] === $data['id'] && $m['model_name'] === $data['model_name']);
        if (empty($model)) {
            log_error("Модель не найдена или название не совпадает: id={$data['id']}, model_name={$data['model_name']}");
            http_response_code(400);
            echo json_encode(['error' => 'Модель не найдена или название не совпадает']);
            exit;
        }
        $index = array_search($data['id'], array_column($firmwares, 'id'));
        if ($index !== false) {
            $firmwares[$index]['model_name'] = $data['model_name'];
            $firmwares[$index]['firmware'] = $data['firmware'];
        } else {
            $firmwares[] = [
                'id' => $data['id'],
                'model_name' => $data['model_name'],
                'firmware' => $data['firmware']
            ];
        }
        if (!file_put_contents($path, json_encode($firmwares, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            log_error("Не удалось записать firmware.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка записи файла']);
            exit;
        }
        log_error("Прошивка сохранена для модели: " . $data['id']);
        echo json_encode(['success' => true]);
        break;

        case 'delete_master':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для delete_master");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            log_error("Требуется ID для delete_master");
            http_response_code(400);
            echo json_encode(['error' => 'Требуется ID мастера']);
            exit;
        }
        // Проверка наличия техников
        $engineers_path = __DIR__ . '/lists/engineers.json';
        if (!file_exists($engineers_path)) {
            log_error("engineers.json не найден, создаём: $engineers_path");
            file_put_contents($engineers_path, json_encode([]));
        }
        $engineers = json_decode(file_get_contents($engineers_path), true);
        if ($engineers === null) {
            log_error("Неверный JSON в engineers.json: $engineers_path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в engineers.json']);
            exit;
        }
        if (array_filter($engineers, fn($e) => $e['master_id'] === $data['id'])) {
            log_error("Нельзя удалить мастера, у которого есть техники: " . $data['id']);
            http_response_code(400);
            echo json_encode(['error' => 'Нельзя удалить мастера, у которого есть техники']);
            exit;
        }
        // Удаление мастера
        $path = __DIR__ . '/lists/masters.json';
        if (!file_exists($path)) {
            log_error("masters.json не найден: $path");
            http_response_code(404);
            echo json_encode(['error' => 'masters.json не найден']);
            exit;
        }
        $masters = json_decode(file_get_contents($path), true);
        if ($masters === null) {
            log_error("Неверный JSON в masters.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в masters.json']);
            exit;
        }
        $index = array_search($data['id'], array_column($masters, 'id'));
        if ($index === false) {
            log_error("Мастер не найден для удаления: " . $data['id']);
            http_response_code(404);
            echo json_encode(['error' => 'Мастер не найден']);
            exit;
        }
        array_splice($masters, $index, 1);
        if (!file_put_contents($path, json_encode($masters, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            log_error("Не удалось записать masters.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка записи файла']);
            exit;
        }
        log_error("Мастер удалён: " . $data['id']);
        echo json_encode(['success' => true]);
        break;

    case 'delete_engineer':
        if (!isset($_SESSION['user_id'])) {
            log_error("Не авторизован для delete_engineer");
            http_response_code(401);
            echo json_encode(['error' => 'Не авторизован']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            log_error("Требуется ID для delete_engineer");
            http_response_code(400);
            echo json_encode(['error' => 'Требуется ID техника']);
            exit;
        }
        $path = __DIR__ . '/lists/engineers.json';
        if (!file_exists($path)) {
            log_error("engineers.json не найден: $path");
            http_response_code(404);
            echo json_encode(['error' => 'engineers.json не найден']);
            exit;
        }
        $engineers = json_decode(file_get_contents($path), true);
        if ($engineers === null) {
            log_error("Неверный JSON в engineers.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Неверный формат данных в engineers.json']);
            exit;
        }
        $index = array_search($data['id'], array_column($engineers, 'id'));
        if ($index === false) {
            log_error("Техник не найден для удаления: " . $data['id']);
            http_response_code(404);
            echo json_encode(['error' => 'Техник не найден']);
            exit;
        }
        array_splice($engineers, $index, 1);
        if (!file_put_contents($path, json_encode($engineers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            log_error("Не удалось записать engineers.json: $path");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка записи файла']);
            exit;
        }
        log_error("Техник удалён: " . $data['id']);
        echo json_encode(['success' => true]);
        break;

    default:
        log_error("Неизвестное действие: $action");
        http_response_code(400);
        echo json_encode(['error' => 'Неизвестное действие']);
        break;
}
?>