// --- CONFIGURATION ---
const SYSTEM_PERSONAS = {
    default: "You are a helpful, expert AI assistant. You are precise and concise.",
    coder: "You are a Senior Software Engineer. Review code for performance, security, and best practices. Provide code blocks and brief explanations. Assume the user is technical.",
    tutor: "You are a friendly teacher. Explain complex topics using simple analogies. Use emojis to make learning fun. Encourage the user.",
    creative: "You are a creative writer. Use evocative language, metaphors, and strong imagery. Avoid cliché phrases.",
    malay: "Anda adalah pembantu AI yang fasih dalam Bahasa Melayu. Jawab semua soalan dalam Bahasa Melayu yang profesional tetapi mesra."
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    adjustTextareaHeight();
});

// --- SETTINGS MANAGEMENT ---
function toggleSettings() {
    const overlay = document.getElementById('settingsOverlay');
    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
}

function applyPersona() {
    const select = document.getElementById('personaSelect');
    const promptBox = document.getElementById('sysPrompt');
    if (SYSTEM_PERSONAS[select.value]) {
        promptBox.value = SYSTEM_PERSONAS[select.value];
    }
}

function saveSettings() {
    const key = document.getElementById('apiKeyInput').value;
    const model = document.getElementById('modelSelect').value;
    const prompt = document.getElementById('sysPrompt').value;

    if (!key) { alert("Please enter an API Key!"); return; }

    localStorage.setItem("googleKey", key);
    localStorage.setItem("selectedModel", model);
    localStorage.setItem("systemPrompt", prompt);
    
    toggleSettings();
    alert("Settings Saved!");
}

function loadSettings() {
    const key = localStorage.getItem("googleKey");
    const model = localStorage.getItem("selectedModel");
    const prompt = localStorage.getItem("systemPrompt");

    if (key) document.getElementById('apiKeyInput').value = key;
    if (model) document.getElementById('modelSelect').value = model;
    if (prompt) document.getElementById('sysPrompt').value = prompt;
}

// --- FILE HANDLING ---
let currentFile = null;

function handleFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file) {
        // Limit check (20MB for Base64 safety)
        if (file.size > 20 * 1024 * 1024) {
            alert("File too large. Please use files under 20MB for this browser app.");
            fileInput.value = "";
            return;
        }
        currentFile = file;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('filePreview').style.display = 'flex';
    }
}

function clearFile() {
    document.getElementById('fileInput').value = "";
    document.getElementById('filePreview').style.display = 'none';
    currentFile = null;
}

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

// --- CHAT LOGIC ---
function checkEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
    adjustTextareaHeight();
}

function adjustTextareaHeight() {
    const el = document.getElementById('userInput');
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
}

function appendMessage(role, text) {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = `message-wrapper ${role}`;
    
    let avatarHTML = role === 'ai' ? `<div class="avatar"><span class="material-icons-round">smart_toy</span></div>` : '';
    
    // Parse Markdown for AI
    let contentHTML = role === 'ai' ? marked.parse(text) : text.replace(/\n/g, '<br>');

    div.innerHTML = `
        ${role === 'ai' ? avatarHTML : ''}
        <div class="message ${role}">${contentHTML}</div>
    `;
    
    container.appendChild(div);
    
    // Highlight code blocks
    if (role === 'ai') {
        div.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function handleSend() {
    const inputField = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const userText = inputField.value.trim();
    
    if (!userText && !currentFile) return;

    // UI Updates
    appendMessage('user', userText || "[Attached File]");
    inputField.value = "";
    adjustTextareaHeight();
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="material-icons-round" style="animation:spin 1s linear infinite">sync</span>';

    // Prepare API Data
    const apiKey = localStorage.getItem("googleKey");
    const model = localStorage.getItem("selectedModel") || "gemini-1.5-pro";
    const systemPrompt = localStorage.getItem("systemPrompt") || SYSTEM_PERSONAS.default;

    if (!apiKey) {
        appendMessage('ai', "⚠️ Please set your Google API Key in Settings.");
        resetButton();
        return;
    }

    try {
        let parts = [];
        if (userText) parts.push({ text: userText });
        
        if (currentFile) {
            const base64Data = await fileToBase64(currentFile);
            parts.push({
                inline_data: {
                    mime_type: currentFile.type,
                    data: base64Data
                }
            });
        }

        // --- GEMINI API CALL ---
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: parts }]
            })
        });

        if (response.status === 429) {
            throw new Error("Too many requests! Gemini Pro only allows 2 messages/minute. Try switching to Flash in settings.");
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            appendMessage('ai', aiText);
        } else {
            appendMessage('ai', "⚠️ Error: The AI returned no content. (It might have blocked the safety filters).");
        }

    } catch (error) {
        console.error(error);
        appendMessage('ai', `⚠️ Connection Error: ${error.message}`);
    }

    clearFile();
    resetButton();
}

function resetButton() {
    const btn = document.getElementById('sendBtn');
    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-round">arrow_upward</span>';
}

// Simple spinner animation style
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);
