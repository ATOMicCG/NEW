document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const login = form.login.value;
        const password = form.password.value;

        console.log('Submitting login:', { login, password: '***' }); // Отладка
        fetch('/pinger/api.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        })
            .then(res => {
                console.log('Fetch response status:', res.status); // Отладка
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || `HTTP Error: ${res.status}`); });
                }
                return res.json();
            })
            .then(data => {
                console.log('API Response:', data); // Отладка
                if (data.success) {
                    console.log('Redirecting to /pinger/index.php'); // Отладка
                    window.location.href = '/pinger/index.php';
                } else {
                    errorMessage.textContent = data.error || 'Ошибка входа';
                    errorMessage.style.display = 'block';
                }
            })
            .catch(err => {
                console.error('Login Error:', err);
                errorMessage.textContent = err.message;
                errorMessage.style.display = 'block';
            });
    });
});