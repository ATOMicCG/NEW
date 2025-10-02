<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    header('Location: /pinger/login.php');
    exit;
}
?>
<div id="create-switch-modal" class="switch-modal" style="display: none;">
    <div class="switch-modal-content">
        <h2>Создать свитч</h2>
        <div class="switch-columns-container" style="display: flex; justify-content: space-between;">
            <div class="switch-column">
                <h3>Общее</h3>
                <div class="switch-form-group">
                    <label for="switch-name">Имя свитча</label>
                    <textarea id="switch-name" rows="3" placeholder="Введите имя свитча"></textarea>
                </div>
                <div class="switch-form-group">
                    <label for="switch-model">Модель</label>
                    <select id="switch-model">
                        <option value="">Выберите модель</option>
                    </select>
                </div>
                <div class="switch-form-row">
                    <div class="switch-form-group">
                        <label for="switch-vlan">Упр. VLAN</label>
                        <select id="switch-vlan">
                            <option value="">Выберите VLAN</option>
                        </select>
                    </div>
                    <div class="switch-form-group">
                        <label for="switch-master">Мастер</label>
                        <select id="switch-master">
                            <option value="">Выберите мастера</option>
                        </select>
                    </div>
                </div>
                <div class="switch-form-row">
                    <div class="switch-form-group">
                        <label for="switch-trunk-ports">Магистральные порты</label>
                        <input type="text" id="switch-trunk-ports" placeholder="Магистральные порты">
                    </div>
                    <div class="switch-form-group">
                        <label for="switch-uplink">Uplink</label>
                        <input type="text" id="switch-uplink" placeholder="Uplink">
                    </div>
                </div>
                <div class="switch-form-row">
                    <div class="switch-form-group">
                        <label for="switch-mac">MAC</label>
                        <input type="text" id="switch-mac" placeholder="MAC-адрес">
                    </div>
                    <div class="switch-form-group">
                        <label for="switch-ip">IP</label>
                        <input type="text" id="switch-ip" placeholder="IP-адрес">
                    </div>
                </div>
                <div class="switch-form-row">
                    <div class="switch-form-group">
                        <label for="switch-serial">Серийный номер</label>
                        <input type="text" id="switch-serial" placeholder="Серийный номер">
                    </div>
                    <div class="switch-form-group">
                        <label for="switch-password">Пароль</label>
                        <input type="text" id="switch-password" placeholder="Пароль">
                    </div>
                </div>
                <div class="switch-form-row">
                    <div class="switch-form-group">
                        <button id="google-copy">В Google</button>
                    </div>
                    <div class="switch-form-group">
                        <button id="configure-switch">Настроить</button>
                    </div>
                </div>
                <div class="switch-form-row">
                    <div class="switch-form-group">
                        <label for="switch-firmware">Прошивка</label>
                        <select id="switch-firmware">
                            <option value="">Выберите прошивку</option>
                        </select>
                    </div>
                    <div class="switch-form-group">
                        <label for="flash-button">&#8203;</label>
                        <button id="flash-button">Прошить</button>
                    </div>
                </div>
                <div class="switch-form-row">
                    <div class="switch-form-group">
                        <label for="add-switch">&#8203;</label>
                        <button id="add-switch">Добавить</button>
                    </div>
                    <div class="switch-form-group">
                        <label for="switch-response-time">Время реакции</label>
                        <input type="text" id="switch-response-time" value="60">
                    </div>
                    <div class="switch-form-group">
                        <label for="reset-switch">&#8203;</label>
                        <button id="reset-switch">Сброс</button>
                    </div>
                </div>
            </div>
            <div class="switch-column">
                <h3>Neobils</h3>
                <!-- Контент для Neobils будет добавлен позже -->
            </div>
            <div class="switch-column">
                <h3>DHCP</h3>
                <!-- Контент для DHCP будет добавлен позже -->
            </div>
            <div class="switch-column">
                <h3>Порты</h3>
                <!-- Контент для Порты будет добавлен позже -->
            </div>
        </div>
        <div class="switch-cancel-container">
            <button id="create-switch-cancel">Отмена</button>
        </div>
    </div>
</div>