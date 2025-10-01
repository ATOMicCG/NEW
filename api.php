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

    default:
        log_error("Неизвестное действие: $action");
        http_response_code(400);
        echo json_encode(['error' => 'Неизвестное действие']);
        break;
}
?>