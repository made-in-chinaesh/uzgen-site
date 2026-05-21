const dateElements = document.querySelectorAll('.date');
const today = new Date();
const options = { day: 'numeric', month: 'long', year: 'numeric' };
let formattedDate = today.toLocaleDateString('ru-RU', options);
formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

dateElements.forEach(el => {
    el.textContent = formattedDate;
});

// ==================
// АВТОРИЗАЦИЯ И ПОЛЬЗОВАТЕЛИ
// ==================
const users = [
    { login: "sec", password: "1234" },
    { login: "akim", password: "1234" },
    { login: "buh", password: "1234" },
];

// Функция для открытия модального окна (вызывается по кнопке "Войти" в шапке)
function openLogin() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
}

// Функция для закрытия модального окна
function closeLogin() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
    
    // Очищаем поля и ошибку при закрытии
    document.getElementById('loginInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('error').textContent = '';
}

function handleAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) { logout(); } else { openLogin(); }
}

function login() {
    const login = document.getElementById('loginInput').value;
    const password = document.getElementById('passwordInput').value;
    const error = document.getElementById('error');
    const user = users.find(u => u.login === login && u.password === password);

    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        closeLogin();
        updateUI();
    } else {
        error.textContent = "Неверный логин или пароль";
    }
}

function logout() {
    localStorage.removeItem('user');
    updateUI();
}

// ==========================================
// ЛОГИКА ДЛЯ РАБОТЫ С ФАЙЛАМИ И ДОКУМЕНТАМИ
// ==========================================

function updateUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const btn = document.querySelector('.login-btn');
    
    // Блоки интерфейса документов
    const uploadFormBlock = document.getElementById('uploadFormBlock');
    const incomingDocsBlock = document.getElementById('incomingDocsBlock');
    const docsGuestMessage = document.getElementById('docsGuestMessage');

    if (user) {
        btn.textContent = "Выйти (" + user.login + ")";
        
        // Показываем интерфейс документов
        if(uploadFormBlock) uploadFormBlock.style.display = "block";
        if(incomingDocsBlock) incomingDocsBlock.style.display = "block";
        if(docsGuestMessage) docsGuestMessage.style.display = "none";
        
        // Заполняем поле "От кого"
        document.getElementById('docFromUser').value = user.login;
        
        // Заполняем выпадающий список пользователей (исключая себя)
        const selectTo = document.getElementById('docToUser');
        selectTo.innerHTML = '';
        users.forEach(u => {
            if (u.login !== user.login) {
                const opt = document.createElement('option');
                opt.value = u.login;
                opt.textContent = u.login;
                selectTo.appendChild(opt);
            }
        });

        // Обновляем список входящих документов для текущего юзера
        renderDocuments(user.login);
    } else {
        btn.textContent = "Войти";
        
        // Скрываем интерфейс документов для гостей
        if(uploadFormBlock) uploadFormBlock.style.display = "none";
        if(incomingDocsBlock) incomingDocsBlock.style.display = "none";
        if(docsGuestMessage) docsGuestMessage.style.display = "block";
    }
}

// Функция отправки документа
function sendDocument(e) {
    e.preventDefault();
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const toUser = document.getElementById('docToUser').value;
    const deadline = document.getElementById('docDeadline').value;
    const fileInput = document.getElementById('docFile');
    
    if (!fileInput.files.length) return;
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    // Переводим файл в Base64 строку для сохранения в localStorage
    reader.onload = function(event) {
        const fileData = event.target.result; // Строка Base64
        
        const newDoc = {
            id: Date.now(),
            from: currentUser.login,
            to: toUser,
            created: new Date().toLocaleDateString('ru-RU'),
            deadline: new Date(deadline).toLocaleDateString('ru-RU'),
            fileName: file.name,
            fileContent: fileData // Хранит файл
        };
        
        // Получаем старые документы из базы или создаем пустой массив
        const allDocs = JSON.parse(localStorage.getItem('documents')) || [];
        allDocs.push(newDoc);
        localStorage.setItem('documents', JSON.stringify(allDocs));
        
        alert('Документ успешно отправлен пользователю ' + toUser);
        document.getElementById('docForm').reset();
        
        // Сбрасываем значение "От кого", так как форма очистилась
        document.getElementById('docFromUser').value = currentUser.login;
    };
    
    reader.readAsDataURL(file);
}

// Функция отображения документов в таблице
// Функция отображения документов в таблице с проверкой дедлайна
function renderDocuments(username) {
    const tableBody = document.getElementById('docsTableBody');
    tableBody.innerHTML = '';
    
    const allDocs = JSON.parse(localStorage.getItem('documents')) || [];
    // Фильтруем только те, которые отправлены текущему пользователю
    const myDocs = allDocs.filter(doc => doc.to === username);
    
    if (myDocs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:12px; color:#999;">У вас нет входящих документов</td></tr>`;
        return;
    }
    
    // Получаем текущую дату (без учета часов, минут и секунд для точного сравнения дней)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    myDocs.forEach(doc => {
        // Превращаем сохраненную строку дедлайна обратно в формат даты для сравнения
        // Так как мы сохраняли дату через input[type="date"], в базе лежит формат YYYY-MM-DD или DD.MM.YYYY.
        // Для надежности распарсим её.
        
        let deadlineParts = doc.deadline.split('.'); // Если дата в формате DD.MM.YYYY
        let deadlineDate;
        
        if (deadlineParts.length === 3) {
            // Конвертируем DD.MM.YYYY в объект Date (в JS месяцы начинаются с 0)
            deadlineDate = new Date(deadlineParts[2], deadlineParts[1] - 1, deadlineParts[0]);
        } else {
            // Если сохранился дефолтный формат ISO (YYYY-MM-DD)
            deadlineDate = new Date(doc.deadline);
        }
        
        deadlineDate.setHours(0, 0, 0, 0);

        // Переменные для кастомизации просроченного статуса
        let deadlineStyle = 'color: #000; font-weight: bold;';
        let statusText = doc.deadline; // По умолчанию пишем просто дату

        // Проверяем: если дедлайн меньше сегодняшнего дня, то задача просрочена
        if (deadlineDate < today) {
            deadlineStyle = 'color: #e53935; font-weight: bold; background-color: #ffebee; padding: 4px 8px; border-radius: 4px; display: inline-block;';
            statusText = `${doc.deadline} (Просрочено!)`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${doc.from}</td>
            <td>${doc.created}</td>
            <td>
                <span style="${deadlineStyle}">${statusText}</span>
            </td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${doc.fileName}</td>
            <td>
                <a href="${doc.fileContent}" download="${doc.fileName}" class="download-btn">Скачать / Посмотреть</a>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function checkAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const input = document.getElementById('questionInput');
    const btn = document.querySelector('.question-form .btn');

    // Проверка, существуют ли элементы формы вопросов (чтобы не было ошибок на главной)
    if (input && btn) {
        if (!user) {
            input.disabled = true;
            input.placeholder = "Войдите, чтобы задать вопрос";
            btn.disabled = true;
            btn.style.opacity = "0.6";
        } else {
            input.disabled = false;
            input.placeholder = "Введите ваш вопрос";
            btn.disabled = false;
            btn.style.opacity = "1";
        }
    }
}

// Запуск при загрузке страницы
updateUI();
checkAuthUI();