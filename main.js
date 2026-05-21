let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
const select = document.getElementById("taskToUser");
const users = [
    { login: "sec", password: "1234" },
    { login: "akim", password: "1234" },
    { login: "buh", password: "1234" },
];

document.addEventListener("DOMContentLoaded", () => {
    const users = [
        { login: "sec", password: "1234" },
        { login: "akim", password: "1234" },
        { login: "buh", password: "1234" },
    ];

    const select = document.getElementById("taskToUser");

    if (!select) return;

    // select.innerHTML = `<option value="">Выберите пользователя</option>`;

    users.forEach(u => {
        const option = document.createElement("option");
        option.value = u.login;
        option.textContent = u.login;
        select.append(option);
    });

});

function createTask() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        openLogin();
        return;
    }

    const title = document.getElementById('taskTitle').value.trim();
    const desc = document.getElementById('taskDesc').value.trim();
    const deadline = document.getElementById('taskDeadline').value;
    const toUser = document.getElementById('taskToUser').value;
    const fileInput = document.getElementById('taskFile');

    // обязательные поля
    if (!title || !desc || !deadline) return;

    // ❗ проверка выбора пользователя
    if (!toUser) {
        alert("Выберите пользователя");
        return;
    }

    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveTask(title, desc, deadline, toUser, file.name, e.target.result, user.login);
        };
        reader.readAsDataURL(file);
    } else {
        saveTask(title, desc, deadline, toUser, null, null, user.login);
    }
}

function saveTask(title, desc, deadline, toUser, fileName, fileData, fromUser) {

    const task = {
        id: Date.now(),
        title,
        desc,
        deadline,
        toUser,
        fromUser,
        fileName,
        fileData
    };

    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    renderTasks();
}

function renderTasks() {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.getElementById('tasksList');

    if (!container || !user) return;

    container.innerHTML = "";

    tasks.forEach(task => {

        // показываем только если ты участник
        if (task.toUser !== user.login && task.fromUser !== user.login) return;

        const div = document.createElement('div');
        div.className = 'task';

        div.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.desc}</p>

            <p><strong>Срок:</strong> ${task.deadline}</p>

            <p><strong>От:</strong> ${task.fromUser}</p>
            <p><strong>Кому:</strong> ${task.toUser}</p>

            ${task.fileName ? `
                <a href="${task.fileData}" download="${task.fileName}">
                    📎 Скачать файл
                </a>
            ` : ''}

            <hr>
        `;

        container.appendChild(div);
    });
}

renderTasks();