# Java Chat Application

A modern, real-time chat application built with Java Spring Boot where users can add anyone they want to chat with.

## Features

- **User Registration & Authentication**: Secure user registration and login system
- **User Search**: Search for any user by username or display name
- **Friend Requests**: Send and manage friend requests
- **Real-time Messaging**: Instant messaging using WebSocket technology
- **User Status**: See who's online/offline
- **Responsive Design**: Modern, mobile-friendly interface
- **Conversation History**: Persistent message storage and history
- **Friend Management**: Accept/decline friend requests and manage friendships

## Technology Stack

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** for authentication
- **Spring WebSocket** for real-time messaging
- **Spring Data JPA** for data persistence
- **H2 Database** (in-memory for development)
- **Maven** for dependency management

### Frontend
- **HTML5 & CSS3**
- **Bootstrap 5** for responsive design
- **JavaScript (ES6+)**
- **WebSocket with STOMP protocol**
- **Font Awesome** for icons

## Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6 or higher

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd java-chat-app
   ```

2. **Build the application**
   ```bash
   mvn clean install
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

4. **Access the application**
   - Open your browser and go to: `http://localhost:8080`
   - The application will be running on port 8080

### Database Console (Development)
- Access H2 Console: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:chatdb`
- Username: `sa`
- Password: `password`

## How to Use

### 1. **Register a New Account**
- Click "Register" on the home page
- Fill in your details (username, email, display name, password)
- Submit the form to create your account

### 2. **Login**
- Use your username and password to login
- You'll be redirected to the chat interface

### 3. **Find and Add Users**
- Use the search bar in the sidebar to find users
- Click "Add" to send a friend request to any user
- Wait for them to accept your request

### 4. **Manage Friend Requests**
- Check the "Requests" tab to see pending friend requests
- Accept or decline requests as needed
- Accepted friends will appear in your "Friends" tab

### 5. **Start Chatting**
- Click on any friend or search result to start a conversation
- Type your message and press Enter or click the send button
- Messages are delivered in real-time to both users

### 6. **View Conversations**
- The "Chats" tab shows all your active conversations
- See the latest message and timestamp for each conversation
- Online indicators show who's currently active

## Application Architecture

### Backend Structure
```
src/main/java/com/chatapp/
├── ChatApplication.java           # Main application class
├── config/
│   ├── SecurityConfig.java        # Security configuration
│   └── WebSocketConfig.java       # WebSocket configuration
├── controller/
│   ├── AuthController.java        # Authentication endpoints
│   ├── ChatController.java        # Chat REST endpoints
│   ├── WebController.java         # Page routing
│   └── WebSocketController.java   # WebSocket message handling
├── entity/
│   ├── User.java                  # User entity
│   ├── Message.java               # Message entity
│   └── Friendship.java            # Friendship entity
├── repository/
│   ├── UserRepository.java        # User data access
│   ├── MessageRepository.java     # Message data access
│   └── FriendshipRepository.java  # Friendship data access
└── service/
    ├── UserService.java           # User business logic
    ├── MessageService.java        # Message business logic
    └── FriendshipService.java     # Friendship business logic
```

### Frontend Structure
```
src/main/resources/
├── static/
│   ├── css/
│   │   ├── style.css              # General styling
│   │   └── chat.css               # Chat interface styling
│   └── js/
│       ├── auth.js                # Authentication functionality
│       └── chat.js                # Chat functionality with WebSocket
└── templates/
    ├── index.html                 # Home page
    ├── login.html                 # Login page
    ├── register.html              # Registration page
    └── chat.html                  # Main chat interface
```

## Key Features Explained

### Real-time Messaging
- Uses WebSocket with STOMP protocol for instant message delivery
- Messages are persisted in the database and delivered to both sender and receiver
- Automatic reconnection on connection loss

### User Management
- Secure password hashing with BCrypt
- Session-based authentication
- User online/offline status tracking

### Friendship System
- Send friend requests to any user
- Accept/decline incoming requests
- Only friends can see detailed profile information
- Anyone can chat with anyone (the core requirement)

### Database Schema
- **Users**: Stores user account information
- **Messages**: Stores all chat messages with sender/receiver references
- **Friendships**: Manages friend relationships and request status

## Configuration

### Application Properties
Key configuration options in `src/main/resources/application.properties`:

- **Server Port**: `server.port=8080`
- **Database**: H2 in-memory database (configurable for production)
- **Session Timeout**: 30 minutes
- **Security**: CSRF disabled for API endpoints

### Production Deployment
For production deployment, consider:

1. **Database**: Replace H2 with PostgreSQL or MySQL
2. **Security**: Enable HTTPS and proper CSRF protection
3. **Logging**: Configure appropriate log levels
4. **Performance**: Add caching and connection pooling
5. **Scaling**: Consider clustering for WebSocket sessions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/current` - Get current user info

### Chat
- `GET /api/chat/users/search` - Search users
- `POST /api/chat/friends/add` - Send friend request
- `GET /api/chat/friends` - Get friends list
- `GET /api/chat/friends/requests` - Get pending requests
- `POST /api/chat/friends/accept` - Accept friend request
- `POST /api/chat/friends/decline` - Decline friend request
- `GET /api/chat/messages/{userId}` - Get conversation
- `GET /api/chat/conversations` - Get all conversations

### WebSocket Endpoints
- `/ws` - WebSocket connection endpoint
- `/app/chat.sendMessage` - Send message
- `/app/chat.addUser` - User goes online
- `/app/chat.removeUser` - User goes offline

## Security Features

- Password encryption using BCrypt
- Session-based authentication
- CSRF protection for forms
- Input validation and sanitization
- SQL injection prevention through JPA
- XSS prevention in message display

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please create an issue in the repository.

---

**Enjoy chatting with the Java Chat Application!** 🚀💬