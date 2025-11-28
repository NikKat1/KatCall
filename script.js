// Инициализация
let currentUser = localStorage.getItem('currentUser');
let users = JSON.parse(localStorage.getItem('users')) || {};
let chats = JSON.parse(localStorage.getItem('chats')) || {};
let currentChat = null;

if (currentUser && users[currentUser]) {
    showChatScreen();
} else {
    showAuthScreen();
}

// Экраны
function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('messages-screen').classList.add('hidden');
}

function showChatScreen() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('messages-screen').classList.add('hidden');
    loadChats();
}

function showMessagesScreen(chatId) {
    currentChat = chatId;
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('messages-screen').classList.remove('hidden');
    document.getElementById('chat-title').textContent = chats[chatId].title;
    loadMessages();
}

// Регистрация/вход
function register() {
    const username = document.getElementById('username').value.trim();
    if (!username) return alert('Введите имя!');
    if (users[username]) return alert('Пользователь уже существует!');
    
    users[username] = { name: username, joined: Date.now() };
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    showChatScreen();
}

function login() {
    const username = document.getElementById('login-name').value.trim();
    if (!username || !users[username]) return alert('Пользователь не найден!');
    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    showChatScreen();
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    showAuthScreen();
}

// Чаты
function loadChats() {
    const list = document.getElementById('chats-list');
    list.innerHTML = '';
    Object.keys(chats).forEach(chatId => {
        if (chats[chatId].participants.includes(currentUser)) {
            const div = document.createElement('div');
            div.className = 'chat-item';
            div.textContent = chats[chatId].title;
            div.onclick = () => showMessagesScreen(chatId);
            list.appendChild(div);
        }
    });
}

function createChat() {
    const otherUser = document.getElementById('new-chat').value.trim();
    if (!otherUser) return alert('Введите имя собеседника!');
    if (otherUser === currentUser) return alert('Нельзя чат с самим собой!');
    if (!users[otherUser]) return alert('Собеседник не зарегистрирован!');

    const chatId = [currentUser, otherUser].sort().join('_');
    if (!chats[chatId]) {
        chats[chatId] = {
            title: otherUser,
            participants: [currentUser, otherUser],
            messages: [],
            created: Date.now()
        };
        localStorage.setItem('chats', JSON.stringify(chats));
    }
    document.getElementById('new-chat').value = '';
    loadChats();
}

// Сообщения
function loadMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = '';
    chats[currentChat].messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.sender === currentUser ? 'sent' : 'received'}`;
        div.innerHTML = `<strong>\( {msg.sender}:</strong> \){msg.text} <small>${new Date(msg.time).toLocaleTimeString()}</small>`;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const text = document.getElementById('message-input').value.trim();
    if (!text) return;
    
    chats[currentChat].messages.push({
        sender: currentUser,
        text: text,
        time: Date.now()
    });
    localStorage.setItem('chats', JSON.stringify(chats));
    document.getElementById('message-input').value = '';
    loadMessages();
    
    // Автообновление для других пользователей (каждые 5 сек)
    setInterval(() => {
        if (currentChat) loadMessages();
    }, 5000);
}

function backToChats() {
    currentChat = null;
    showChatScreen();
}

// Enter для отправки
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.getElementById('message-input') === document.activeElement) {
        sendMessage();
    }
});
