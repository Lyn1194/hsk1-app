class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadUsers();
        this.checkLoggedIn();
    }

    loadUsers() {
        const saved = localStorage.getItem('hsk1_users');
        this.users = saved ? JSON.parse(saved) : {};
    }

    saveUsers() {
        localStorage.setItem('hsk1_users', JSON.stringify(this.users));
    }

    createUser(username) {
        if (!username || username.trim() === '') {
            return { success: false, message: 'Username is required' };
        }

        if (username.length < 2) {
            return { success: false, message: 'Username must be at least 2 characters' };
        }

        if (username.length > 20) {
            return { success: false, message: 'Username must be 20 characters or less' };
        }

        if (this.users[username]) {
            return { success: false, message: 'Username already exists' };
        }

        this.users[username] = {
            username: username,
            createdAt: new Date().toISOString(),
            settings: {
                darkMode: false,
                fontSize: 16,
                audioSpeed: 1
            }
        };

        this.saveUsers();
        return { success: true, message: 'User created!' };
    }

    login(username) {
        if (!username || username.trim() === '') {
            return { success: false, message: 'Username is required' };
        }

        if (!this.users[username]) {
            return { success: false, message: 'Username not found' };
        }

        this.currentUser = {
            username: username,
            settings: this.users[username].settings
        };

        sessionStorage.setItem('hsk1_current_user', JSON.stringify(this.currentUser));
        return { success: true, message: 'Logged in!' };
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('hsk1_current_user');
    }

    checkLoggedIn() {
        const saved = sessionStorage.getItem('hsk1_current_user');
        if (saved) {
            this.currentUser = JSON.parse(saved);
            return true;
        }
        return false;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateUserSettings(settings) {
        if (!this.currentUser) return;
        
        this.currentUser.settings = { ...this.currentUser.settings, ...settings };
        sessionStorage.setItem('hsk1_current_user', JSON.stringify(this.currentUser));

        if (this.users[this.currentUser.username]) {
            this.users[this.currentUser.username].settings = this.currentUser.settings;
            this.saveUsers();
        }
    }

    deleteAccount(username) {
        if (this.users[username]) {
            delete this.users[username];
            this.saveUsers();
            this.clearUserData(username);
            return { success: true, message: 'Account deleted' };
        }
        return { success: false, message: 'Account not found' };
    }

    clearUserData(username) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.includes(username)) {
                localStorage.removeItem(key);
            }
        });
    }
}

const authManager = new AuthManager();

document.addEventListener('DOMContentLoaded', () => {
    setupAuthUI();
});

function setupAuthUI() {
    if (authManager.checkLoggedIn()) {
        showAppContainer();
    } else {
        showAuthScreen();
    }

    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('loginUsername').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    document.getElementById('createBtn').addEventListener('click', handleCreate);
    document.getElementById('createUsername').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCreate();
    });

    document.getElementById('toggleCreateBtn').addEventListener('click', () => {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('createForm').classList.add('active');
        clearErrors();
    });

    document.getElementById('toggleLoginBtn').addEventListener('click', () => {
        document.getElementById('createForm').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
        clearErrors();
    });

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('deleteAccountBtn').addEventListener('click', handleDeleteAccount);
}

function handleCreate() {
    const username = document.getElementById('createUsername').value.trim();
    const result = authManager.createUser(username);

    if (result.success) {
        const loginResult = authManager.login(username);
        if (loginResult.success) {
            clearCreateForm();
            showAppContainer();
            initializeApp();
        }
    } else {
        showCreateError(result.message);
    }
}

function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const result = authManager.login(username);

    if (result.success) {
        clearLoginForm();
        showAppContainer();
        initializeApp();
    } else {
        showLoginError(result.message);
    }
}

function handleLogout() {
    if (confirm('Logout?')) {
        authManager.logout();
        clearAppState();
        showAuthScreen();
        clearLoginForm();
    }
}

function handleDeleteAccount() {
    if (!confirm('Delete account and all data?')) return;
    if (!confirm('This cannot be undone. Are you sure?')) return;

    const user = authManager.getCurrentUser();
    const result = authManager.deleteAccount(user.username);

    if (result.success) {
        alert('Account deleted');
        authManager.logout();
        clearAppState();
        showAuthScreen();
        clearLoginForm();
    }
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.add('active');
    document.getElementById('appContainer').style.display = 'none';
}

function showAppContainer() {
    document.getElementById('authScreen').classList.remove('active');
    document.getElementById('appContainer').style.display = 'block';
    updateUserHeader();
}

function updateUserHeader() {
    const user = authManager.getCurrentUser();
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
}

function showLoginError(message) {
    document.getElementById('loginError').textContent = '❌ ' + message;
    document.getElementById('loginError').style.display = 'block';
}

function showCreateError(message) {
    document.getElementById('createError').textContent = '❌ ' + message;
    document.getElementById('createError').style.display = 'block';
}

function clearErrors() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('createError').style.display = 'none';
}

function clearLoginForm() {
    document.getElementById('loginUsername').value = '';
    clearErrors();
}

function clearCreateForm() {
    document.getElementById('createUsername').value = '';
    clearErrors();
}

function clearAppState() {
    sessionStorage.removeItem('hsk1_current_user');
}

function getUserDataKey(key) {
    const user = authManager.getCurrentUser();
    return `hsk1_${user.username}_${key}`;
}

function getUserData(key) {
    return localStorage.getItem(getUserDataKey(key));
}

function setUserData(key, value) {
    localStorage.setItem(getUserDataKey(key), value);
}

function removeUserData(key) {
    localStorage.removeItem(getUserDataKey(key));
}
