// ============================================================
//  🔑  НАСТРОЙКИ GITHUB
// ============================================================
const GITHUB_OWNER = 'alyyya5';
const GITHUB_REPO  = 'Personal_account';
const GITHUB_TOKEN = 'GITHUB_TOKEN_PLACEHOLDER';   // ← БУДЕТ ЗАМЕНЁН АВТОМАТИЧЕСКИ!

// ============================================================
//  📤  ФУНКЦИЯ ДЛЯ ОТПРАВКИ ОТЧЁТА
// ============================================================
async function createGitHubIssue(title, body) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${GITHUB_TOKEN}`
            },
            body: JSON.stringify({
                title: title,
                body: body,
                labels: ['отчёт']
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        return data.html_url;
    } catch (error) {
        console.error('Ошибка создания Issue:', error);
        throw error;
    }
}

// ============================================================
//  🧠  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function normalizeAnswer(str) {
    return str.trim().replace(/\s+/g, '').toLowerCase();
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        student: params.get('student') || localStorage.getItem('studentName') || 'Неизвестный ученик',
        date: params.get('date') || 'дата не указана',
        topic: params.get('topic') || 'тема не указана'
    };
}
