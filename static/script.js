let token = localStorage.getItem("token");
let ws;
let currentUser = localStorage.getItem("username");
let emojiPicker = null;
let messageHistory = JSON.parse(localStorage.getItem("messageHistory") || "[]");
const MAX_HISTORY = 100; // Maximum number of messages to store

// WebSocket Connection
function connectWebSocket() {
    if (!token) {
        alert("Please log in first.");
        window.location.href = "/login";
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/ws/${token}`);

    ws.onopen = () => {
        console.log("Connected to chat server");
        loadMessageHistory();
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.error) {
                alert(data.error);
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }
            
            appendMessage(data);
            // Store message in history
            storeMessage(data);
        } catch (e) {
            console.error("Error processing message:", e);
        }
    };

    ws.onclose = (event) => {
        console.log("WebSocket disconnected, attempting to reconnect...");
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
}

function appendMessage(data) {
    try {
        let chatBox = document.getElementById("chat-box");
        if (!chatBox) {
            console.error("Chat box element not found");
            return;
        }
        
        const timestamp = new Date().toLocaleTimeString();
        const color = getUserColor(data.username);
        
        if (data.username === "System") {
            const messageHtml = `
                <div class='system-message'>
                    ${data.message}
                    <span class="timestamp">${timestamp}</span>
                </div>
            `;
            chatBox.innerHTML += messageHtml;
        } else {
            let messageContent = data.message;
            try {
                const parsedMessage = JSON.parse(data.message);
                messageContent = parsedMessage.message || messageContent;
            } catch (e) {
                // If parsing fails, use the message as is
            }

            const safeUsername = data.username ? data.username.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'Unknown';
            const safeMessage = messageContent ? messageContent.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
            
            const isCurrentUser = safeUsername === currentUser;
            const messageHtml = `
                <div class='chat-message ${isCurrentUser ? 'sent' : 'received'}'>
                    <div class='message-header'>
                        <span class='username' style='color: ${color}'>${safeUsername}</span>
                        <span class="timestamp">${timestamp}</span>
                    </div>
                    <div class='message-content'>
                        ${safeMessage}
                    </div>
                </div>
            `;
            chatBox.innerHTML += messageHtml;
        }
        
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        console.error("Error appending message:", e);
    }
}

function sendMessage(event) {
    event.preventDefault();
    const messageInput = document.getElementById("message");
    const message = messageInput?.value?.trim();

    if (message && ws && ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(JSON.stringify({
                type: 'message',
                username: currentUser,
                message: message
            }));
            messageInput.value = "";
        } catch (e) {
            console.error("Error sending message:", e);
            alert("Failed to send message. Please try again.");
        }
    } else if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("Connection lost. Attempting to reconnect...");
        connectWebSocket();
    }
}

function getUserColor(username) {
    const colors = ["#ff5733", "#33ff57", "#3357ff", "#ff33a6", "#a633ff", "#33fff2"];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash % colors.length)];
}

// Add logout function
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/login";
}

// Add emoji picker functionality
function initializeEmojiPicker() {
    const button = document.getElementById('emoji-button');
    const picker = document.getElementById('emoji-picker');
    const messageInput = document.getElementById('message');
    
    // Hide picker initially
    picker.style.display = 'none';
    
    button.addEventListener('click', () => {
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    });

    // Handle emoji selection
    picker.addEventListener('emoji-click', event => {
        messageInput.value += event.detail.unicode;
        picker.style.display = 'none';
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!picker.contains(e.target) && e.target !== button) {
            picker.style.display = 'none';
        }
    });
}

// Message history functions
function storeMessage(message) {
    messageHistory.push(message);
    if (messageHistory.length > MAX_HISTORY) {
        messageHistory.shift(); // Remove oldest message if exceeding max
    }
    localStorage.setItem("messageHistory", JSON.stringify(messageHistory));
}

function loadMessageHistory() {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = ''; // Clear existing messages
    messageHistory.forEach(message => appendMessage(message));
}

function clearMessageHistory() {
    messageHistory = [];
    localStorage.removeItem("messageHistory");
    document.getElementById("chat-box").innerHTML = '';
}

// Initialize when the chat page loads
if (window.location.pathname === '/chat') {
    connectWebSocket();
    initializeEmojiPicker();
    
    // Add logout button listener
    document.getElementById('logout-btn').addEventListener('click', logout);
}

// Add event listeners for sending messages
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage(event);
    }
});

// Add these styles to your CSS file
const styles = `
.app-header {
    display: flex;
    align-items: center;
    gap: 10px;
}

.app-title {
    margin-right: 8px;
}

.typing-status {
    font-size: 0.85em;
    color: #666;
    display: inline-flex;
    align-items: center;
    height: 20px;
}

.typing-text {
    display: flex;
    align-items: center;
    gap: 4px;
    animation: fadeIn 0.3s ease;
}

.typing-user {
    color: #4CAF50;
    font-weight: 500;
}

.typing-dots {
    display: inline-flex;
    align-items: center;
    margin-left: 2px;
}

.typing-dots span {
    opacity: 0;
    animation: typingDot 1.4s infinite;
    margin-left: 1px;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes typingDot {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
}

.typing-bubble {
    display: inline-flex;
    align-items: center;
    background: rgba(76, 175, 80, 0.1);
    padding: 6px 12px;
    border-radius: 15px;
    margin-left: 15px;
    font-size: 0.9em;
    color: #888;
}

.typing-user {
    color: #4CAF50;
    font-weight: 500;
    margin-right: 4px;
}

.bouncing-dots {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
}

.bouncing-dots span {
    width: 4px;
    height: 4px;
    margin: 0 2px;
    background: #4CAF50;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
}

.bouncing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.bouncing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes bounce {
    0%, 80%, 100% { 
        transform: translateY(0);
    }
    40% { 
        transform: translateY(-6px);
    }
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 25px;
}

#typing-status {
    flex: 1;
    margin: 0 20px;
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
