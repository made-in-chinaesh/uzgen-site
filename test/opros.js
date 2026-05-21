// ==========================================
// 🛡️ БЛОК ЦЕНЗУРЫ И ВАЛИДАЦИИ
// ==========================================
const BAD_WORDS_REGEX = [
    /([уу]?[бб][лл][яя][дд]乂?|[^а-яё]ху[йяеиоёу]|[^а-яё]пизд|[^а-яё]еб[ауоеиё]|еблан|е@лан|сук[аиое]|гандон|гондон|шлюх|проститут)/i,
    /\b(fuck|shit|asshole|bitch|dick|pussy|cunt)\b/i,
    /(porn|порно|ххх|xxx|18\+|adult|сиськи|член|пенис|вагина|минет|куни|sex|секс)|бля|дурак|жанбаш|гялдир|тупой|лох|карангы/i
];

function containsBadWords(text) {
    const cleanText = text.replace(/[\s\.\,\-\_\*\=\+\?]/g, '');
    return BAD_WORDS_REGEX.some(regex => regex.test(cleanText) || regex.test(text));
}

// ==========================================
// 💾 РАБОТА С ДАННЫМИ (LOCALSTORAGE) И ОТРИСОВКА
// ==========================================

let questions = JSON.parse(localStorage.getItem('forumQuestions')) || [];

// Получаем или инициализируем историю реакций текущего браузера
// Структура: { "id_комментария": "like" | "dislike" }
let userReactions = JSON.parse(localStorage.getItem('userReactions')) || {};

function saveToLocalStorage() {
    localStorage.setItem('forumQuestions', JSON.stringify(questions));
    localStorage.setItem('userReactions', JSON.stringify(userReactions));
}

function renderQuestions() {
    const container = document.querySelector('.questions-list');
    if (!container) return;
    
    container.innerHTML = ''; 

    questions.forEach((q) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';

        let commentsHtml = '';
        q.comments.forEach((c) => {
            // Проверяем, голосовал ли уже пользователь за этот комментарий
            const currentReaction = userReactions[c.id] || null;
            
            // Добавляем активный класс кнопкам, если за них уже проголосовали
            const likeActive = currentReaction === 'like' ? 'active' : '';
            const dislikeActive = currentReaction === 'dislike' ? 'active' : '';

            commentsHtml += `
                <div class="comment">
                    <div class="comment-content">
                        <strong>${c.name}:</strong> ${c.text}
                    </div>
                    <div class="comment-reactions">
                        <button class="reaction-btn like-btn ${likeActive}" onclick="handleReaction(${q.id}, '${c.id}', 'like')">
                            👍 <span class="reaction-count">${c.likes || 0}</span>
                        </button>
                        <button class="reaction-btn dislike-btn ${dislikeActive}" onclick="handleReaction(${q.id}, '${c.id}', 'dislike')">
                            👎 <span class="reaction-count">${c.dislikes || 0}</span>
                        </button>
                    </div>
                </div>`;
        });

        questionDiv.innerHTML = `
            <div class="question-header">
                <h3 class="question-title">${q.text}</h3>
                <div class="question-actions">
                    <button class="btn small edit-btn" onclick="editQuestion(${q.id})">Редактировать</button>
                    <button class="btn small delete-btn" onclick="deleteQuestion(${q.id})">Удалить</button>
                </div>
            </div>
            
            <button class="btn small" onclick="showCommentForm(this)">Добавить комментарий</button>

            <div class="comments">${commentsHtml}</div>

            <div class="comment-form" style="display:none;" data-id="${q.id}">
                <input type="text" placeholder="Ваше имя" class="input nameInput">
                <input type="text" placeholder="Комментарий" class="input commentInput">
                <button class="btn small" onclick="addComment(this)">Отправить</button>
            </div>
        `;

        container.appendChild(questionDiv);
    });
}

// ==========================================
// 📝 ФУНКЦИОНАЛ ПРИЛОЖЕНИЯ
// ==========================================

function addQuestion() {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        alert("Сначала войдите в аккаунт");
        return;
    }

    const input = document.getElementById('questionInput');
    const text = input.value.trim();

    if (!text) return;

    if (containsBadWords(text)) {
        alert("Пожалуйста, соблюдайте цензуру. Использование матов и контента 18+ запрещено!");
        return;
    }

    const newQuestion = {
        id: Date.now(),
        text: text,
        comments: []
    };

    questions.push(newQuestion);
    saveToLocalStorage();
    renderQuestions();

    input.value = '';
}

function deleteQuestion(id) {
    if (confirm("Вы уверены, что хотите удалить этот вопрос?")) {
        questions = questions.filter(q => q.id !== id);
        saveToLocalStorage();
        renderQuestions();
    }
}

function editQuestion(id) {
    const targetQuestion = questions.find(q => q.id === id);
    if (!targetQuestion) return;

    const newText = prompt("Отредактируйте ваш вопрос:", targetQuestion.text);
    if (newText === null) return;
    
    const trimmedText = newText.trim();
    if (!trimmedText) {
        alert("Вопрос не может быть пустым!");
        return;
    }

    if (containsBadWords(trimmedText)) {
        alert("Изменения не сохранены! Обнаружены нецензурные выражения или контент 18+.");
        return;
    }

    targetQuestion.text = trimmedText;
    saveToLocalStorage();
    renderQuestions();
}

function showCommentForm(button) {
    const form = button.parentElement.querySelector('.comment-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function addComment(button) {
    const form = button.parentElement;
    const questionId = parseInt(form.getAttribute('data-id')); 
    
    const name = form.querySelector('.nameInput').value.trim();
    const comment = form.querySelector('.commentInput').value.trim();

    if (!name || !comment) return;

    if (containsBadWords(comment) || containsBadWords(name)) {
        alert("Пожалуйста, соблюдайте цензуру в комментариях и именах!");
        return;
    }

    const targetQuestion = questions.find(q => q.id === questionId);
    
    if (targetQuestion) {
        targetQuestion.comments.push({
            id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), // Уникальный ID для каждого комментария
            name: name,
            text: comment,
            likes: 0,
            dislikes: 0
        });

        saveToLocalStorage();
        renderQuestions();
        
        form.querySelector('.nameInput').value = '';
        form.querySelector('.commentInput').value = '';
    }
}

// 👑 ЕДИНАЯ УМНАЯ СИСТЕМА РЕАКЦИЙ (ЛАЙК / ДИЗЛАЙК)
function handleReaction(questionId, commentId, type) {
    const targetQuestion = questions.find(q => q.id === questionId);
    if (!targetQuestion) return;
    
    const comment = targetQuestion.comments.find(c => c.id === commentId);
    if (!comment) return;

    // Гарантируем наличие полей в старых данных
    comment.likes = comment.likes || 0;
    comment.dislikes = comment.dislikes || 0;

    const previousReaction = userReactions[commentId] || null;

    if (previousReaction === type) {
        // Ситуация 1: Пользователь повторно нажал на ту же кнопку -> Отменяем голос
        if (type === 'like') comment.likes--;
        if (type === 'dislike') comment.dislikes--;
        delete userReactions[commentId];
    } else {
        // Ситуация 2: Пользователь меняет свое решение (например, с лайка на дизлайк)
        if (previousReaction === 'like') comment.likes--;
        if (previousReaction === 'dislike') comment.dislikes--;

        // Применяем новый голос
        if (type === 'like') comment.likes++;
        if (type === 'dislike') comment.dislikes++;
        userReactions[commentId] = type;
    }

    saveToLocalStorage();
    renderQuestions();
}

// ==========================================
// 🚀 ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ==========================================
renderQuestions();