// Chat Application JavaScript

let stompClient = null;
let currentUser = null;
let currentChatUser = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and load user data
    checkAuthAndInit();
    
    // Event listeners
    document.getElementById('searchBtn').addEventListener('click', searchUsers);
    document.getElementById('userSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
    
    document.getElementById('messageForm').addEventListener('submit', sendMessage);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Tab change handlers
    document.getElementById('friends-tab').addEventListener('click', loadFriends);
    document.getElementById('requests-tab').addEventListener('click', loadFriendRequests);
    document.getElementById('conversations-tab').addEventListener('click', loadConversations);
    
    // Friend request modal
    document.getElementById('sendFriendRequestBtn').addEventListener('click', sendFriendRequest);
});

async function checkAuthAndInit() {
    try {
        const response = await fetch('/api/auth/current');
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            document.getElementById('currentUserName').textContent = currentUser.displayName;
            
            // Connect to WebSocket
            connect();
            
            // Load initial data
            loadConversations();
            loadFriends();
            loadFriendRequests();
        } else {
            // Not authenticated, redirect to login
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

function connect() {
    const socket = new SockJS('/ws');
    stompClient = new StompJs.Client({
        webSocketFactory: () => socket,
        connectHeaders: {},
        debug: function (str) {
            console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = function (frame) {
        console.log('Connected: ' + frame);
        
        // Subscribe to personal message queue
        stompClient.subscribe('/user/' + currentUser.username + '/queue/messages', function (messageOutput) {
            displayMessage(JSON.parse(messageOutput.body));
        });
        
        // Subscribe to user status updates
        stompClient.subscribe('/topic/user.addUser', function (userOutput) {
            handleUserStatusChange(JSON.parse(userOutput.body));
        });
        
        stompClient.subscribe('/topic/user.removeUser', function (userOutput) {
            handleUserStatusChange(JSON.parse(userOutput.body));
        });
        
        // Notify that user is online
        stompClient.publish({
            destination: '/app/chat.addUser',
            body: JSON.stringify({username: currentUser.username})
        });
    };

    stompClient.onWebSocketError = function (error) {
        console.error('Error with websocket', error);
    };

    stompClient.onStompError = function (frame) {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();
}

function disconnect() {
    if (stompClient !== null) {
        // Notify that user is going offline
        stompClient.publish({
            destination: '/app/chat.removeUser',
            body: JSON.stringify({username: currentUser.username})
        });
        stompClient.deactivate();
    }
    console.log("Disconnected");
}

async function searchUsers() {
    const query = document.getElementById('userSearch').value.trim();
    if (!query) return;
    
    try {
        const response = await fetch(`/api/chat/users/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            displaySearchResults(data.users);
        }
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function displaySearchResults(users) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (users.length === 0) {
        searchResults.innerHTML = '<div class="text-center p-3">No users found</div>';
        return;
    }
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'search-result-item d-flex justify-content-between align-items-center';
        userDiv.innerHTML = `
            <div>
                <div class="fw-bold">${user.displayName}</div>
                <small>@${user.username}</small>
                ${user.online ? '<span class="online-indicator"></span>' : ''}
            </div>
            <div>
                ${user.isFriend ? 
                    `<button class="btn btn-sm btn-success" onclick="startChat(${user.id}, '${user.displayName}', '${user.username}')">
                        <i class="fas fa-comment"></i> Chat
                    </button>` :
                    `<button class="btn btn-sm btn-primary" onclick="showFriendRequestModal(${user.id}, '${user.displayName}')">
                        <i class="fas fa-user-plus"></i> Add
                    </button>`
                }
            </div>
        `;
        searchResults.appendChild(userDiv);
    });
}

function showFriendRequestModal(userId, displayName) {
    document.getElementById('friendRequestUserName').textContent = displayName;
    document.getElementById('sendFriendRequestBtn').setAttribute('data-user-id', userId);
    
    const modal = new bootstrap.Modal(document.getElementById('friendRequestModal'));
    modal.show();
}

async function sendFriendRequest() {
    const userId = document.getElementById('sendFriendRequestBtn').getAttribute('data-user-id');
    
    try {
        const response = await fetch('/api/chat/friends/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({friendId: parseInt(userId)})
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Close modal and refresh search
            bootstrap.Modal.getInstance(document.getElementById('friendRequestModal')).hide();
            searchUsers();
            showNotification('Friend request sent!', 'success');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Friend request failed:', error);
        showNotification('Failed to send friend request', 'error');
    }
}

async function loadConversations() {
    try {
        const response = await fetch('/api/chat/conversations');
        const data = await response.json();
        
        if (data.success) {
            displayConversations(data.conversations);
        }
    } catch (error) {
        console.error('Failed to load conversations:', error);
    }
}

function displayConversations(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    conversationsList.innerHTML = '';
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<div class="text-center p-3">No conversations yet</div>';
        return;
    }
    
    conversations.forEach(conversation => {
        const convDiv = document.createElement('div');
        convDiv.className = 'conversation-item';
        convDiv.onclick = () => startChat(conversation.user.id, conversation.user.displayName, conversation.user.username);
        
        convDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="fw-bold">${conversation.user.displayName}</div>
                    ${conversation.lastMessage ? 
                        `<small class="text-muted">${conversation.lastMessage.senderName}: ${conversation.lastMessage.content.substring(0, 30)}${conversation.lastMessage.content.length > 30 ? '...' : ''}</small>` :
                        '<small class="text-muted">No messages yet</small>'
                    }
                </div>
                <div class="text-end">
                    ${conversation.user.online ? '<span class="online-indicator"></span>' : ''}
                    ${conversation.lastMessage ? 
                        `<small class="text-muted d-block">${formatTime(conversation.lastMessage.sentAt)}</small>` : ''
                    }
                </div>
            </div>
        `;
        
        conversationsList.appendChild(convDiv);
    });
}

async function loadFriends() {
    try {
        const response = await fetch('/api/chat/friends');
        const data = await response.json();
        
        if (data.success) {
            displayFriends(data.friends);
        }
    } catch (error) {
        console.error('Failed to load friends:', error);
    }
}

function displayFriends(friends) {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '';
    
    if (friends.length === 0) {
        friendsList.innerHTML = '<div class="text-center p-3">No friends yet</div>';
        return;
    }
    
    friends.forEach(friend => {
        const friendDiv = document.createElement('div');
        friendDiv.className = 'friend-item d-flex justify-content-between align-items-center';
        
        friendDiv.innerHTML = `
            <div>
                <div class="fw-bold">${friend.displayName}</div>
                <small class="text-muted">@${friend.username}</small>
                ${friend.online ? '<span class="online-indicator"></span>' : ''}
            </div>
            <button class="btn btn-sm btn-primary" onclick="startChat(${friend.id}, '${friend.displayName}', '${friend.username}')">
                <i class="fas fa-comment"></i> Chat
            </button>
        `;
        
        friendsList.appendChild(friendDiv);
    });
}

async function loadFriendRequests() {
    try {
        const response = await fetch('/api/chat/friends/requests');
        const data = await response.json();
        
        if (data.success) {
            displayFriendRequests(data.requests);
            updateRequestsBadge(data.requests.length);
        }
    } catch (error) {
        console.error('Failed to load friend requests:', error);
    }
}

function displayFriendRequests(requests) {
    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = '';
    
    if (requests.length === 0) {
        requestsList.innerHTML = '<div class="text-center p-3">No pending requests</div>';
        return;
    }
    
    requests.forEach(request => {
        const requestDiv = document.createElement('div');
        requestDiv.className = 'request-item';
        
        requestDiv.innerHTML = `
            <div class="fw-bold">${request.user.displayName}</div>
            <small class="text-muted">@${request.user.username}</small>
            <div class="request-actions">
                <button class="btn btn-sm btn-success" onclick="acceptFriendRequest(${request.id})">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn btn-sm btn-danger" onclick="declineFriendRequest(${request.id})">
                    <i class="fas fa-times"></i> Decline
                </button>
            </div>
        `;
        
        requestsList.appendChild(requestDiv);
    });
}

function updateRequestsBadge(count) {
    const badge = document.getElementById('requestsBadge');
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

async function acceptFriendRequest(requestId) {
    try {
        const response = await fetch('/api/chat/friends/accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({requestId: requestId})
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadFriendRequests();
            loadFriends();
            showNotification('Friend request accepted!', 'success');
        }
    } catch (error) {
        console.error('Failed to accept friend request:', error);
    }
}

async function declineFriendRequest(requestId) {
    try {
        const response = await fetch('/api/chat/friends/decline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({requestId: requestId})
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadFriendRequests();
            showNotification('Friend request declined', 'info');
        }
    } catch (error) {
        console.error('Failed to decline friend request:', error);
    }
}

async function startChat(userId, displayName, username) {
    currentChatUser = {id: userId, displayName: displayName, username: username};
    
    // Update UI
    document.getElementById('welcomeScreen').classList.add('d-none');
    document.getElementById('chatHeader').classList.remove('d-none');
    document.getElementById('messagesArea').classList.remove('d-none');
    document.getElementById('messageInput').classList.remove('d-none');
    
    document.getElementById('chatUserName').textContent = displayName;
    
    // Mark conversation as active
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Load conversation history
    await loadConversation(userId);
}

async function loadConversation(userId) {
    try {
        const response = await fetch(`/api/chat/messages/${userId}`);
        const data = await response.json();
        
        if (data.success) {
            displayMessages(data.messages);
        }
    } catch (error) {
        console.error('Failed to load conversation:', error);
    }
}

function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';
    
    messages.forEach(message => {
        displayMessage(message, false);
    });
    
    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
}

function displayMessage(message, isNew = true) {
    const messagesList = document.getElementById('messagesList');
    const messageDiv = document.createElement('div');
    
    const isOwnMessage = message.senderId === currentUser.id;
    messageDiv.className = `message ${isOwnMessage ? 'sent' : 'received'}${isNew ? ' new' : ''}`;
    
    messageDiv.innerHTML = `
        ${!isOwnMessage ? `<div class="message-sender">${message.senderName}</div>` : ''}
        <div class="message-content">${escapeHtml(message.content)}</div>
        <div class="message-time">${formatTime(message.sentAt)}</div>
    `;
    
    messagesList.appendChild(messageDiv);
    
    // Only scroll if showing current chat and message is relevant
    if (currentChatUser && (message.senderId === currentChatUser.id || message.senderId === currentUser.id)) {
        messagesList.scrollTop = messagesList.scrollHeight;
    }
    
    // Update conversations list if message is new
    if (isNew) {
        loadConversations();
    }
}

function sendMessage(event) {
    event.preventDefault();
    
    if (!currentChatUser || !stompClient) return;
    
    const messageContent = document.getElementById('messageContent').value.trim();
    if (!messageContent) return;
    
    // Send message via WebSocket
    stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: currentChatUser.id,
            content: messageContent
        })
    });
    
    // Clear input
    document.getElementById('messageContent').value = '';
}

function handleUserStatusChange(userStatus) {
    // Update online status indicators
    console.log('User status change:', userStatus);
    // This could update friend list, conversation list, etc.
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {method: 'POST'});
        disconnect();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = '/';
    }
}

// Utility functions
function formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
        return date.toLocaleDateString();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a proper notification library
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 'alert-info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle page unload
window.addEventListener('beforeunload', function(event) {
    disconnect();
});