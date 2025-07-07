package com.chatapp.controller;

import com.chatapp.entity.Friendship;
import com.chatapp.entity.Message;
import com.chatapp.entity.User;
import com.chatapp.service.FriendshipService;
import com.chatapp.service.MessageService;
import com.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private UserService userService;

    @Autowired
    private MessageService messageService;

    @Autowired
    private FriendshipService friendshipService;

    @GetMapping("/users/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.unauthorized().body(Map.of("success", false, "message", "Not authenticated"));
        }

        List<User> users = userService.searchUsers(query);
        List<Map<String, Object>> userList = users.stream()
            .filter(u -> !u.getId().equals(currentUser.getId()))
            .map(u -> Map.of(
                "id", u.getId(),
                "username", u.getUsername(),
                "displayName", u.getDisplayName(),
                "online", u.isOnline(),
                "isFriend", friendshipService.areFriends(currentUser, u)
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "users", userList));
    }

    @PostMapping("/friends/add")
    public ResponseEntity<?> addFriend(@RequestBody Map<String, Long> request, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.unauthorized().body(Map.of("success", false, "message", "Not authenticated"));
        }

        try {
            Long friendId = request.get("friendId");
            Optional<User> friendOpt = userService.findById(friendId);
            
            if (friendOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
            }

            User friend = friendOpt.get();
            Friendship friendship = friendshipService.sendFriendRequest(currentUser, friend);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Friend request sent"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/friends")
    public ResponseEntity<?> getFriends(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.unauthorized().body(Map.of("success", false, "message", "Not authenticated"));
        }

        List<User> friends = friendshipService.getFriends(currentUser);
        List<Map<String, Object>> friendList = friends.stream()
            .map(f -> Map.of(
                "id", f.getId(),
                "username", f.getUsername(),
                "displayName", f.getDisplayName(),
                "online", f.isOnline()
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "friends", friendList));
    }

    @GetMapping("/friends/requests")
    public ResponseEntity<?> getFriendRequests(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.unauthorized().body(Map.of("success", false, "message", "Not authenticated"));
        }

        List<Friendship> requests = friendshipService.getPendingFriendRequests(currentUser);
        List<Map<String, Object>> requestList = requests.stream()
            .map(r -> Map.of(
                "id", r.getId(),
                "user", Map.of(
                    "id", r.getUser().getId(),
                    "username", r.getUser().getUsername(),
                    "displayName", r.getUser().getDisplayName()
                ),
                "createdAt", r.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "requests", requestList));
    }

    @PostMapping("/friends/accept")
    public ResponseEntity<?> acceptFriendRequest(@RequestBody Map<String, Long> request, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.unauthorized().body(Map.of("success", false, "message", "Not authenticated"));
        }

        try {
            Long requestId = request.get("requestId");
            friendshipService.acceptFriendRequest(requestId);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Friend request accepted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/friends/decline")
    public ResponseEntity<?> declineFriendRequest(@RequestBody Map<String, Long> request, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.unauthorized().body(Map.of("success", false, "message", "Not authenticated"));
        }

        try {
            Long requestId = request.get("requestId");
            friendshipService.declineFriendRequest(requestId);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Friend request declined"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/messages/{userId}")
    public ResponseEntity<?> getConversation(@PathVariable Long userId, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.unauthorized().body(Map.of("success", false, "message", "Not authenticated"));
        }

        Optional<User> otherUserOpt = userService.findById(userId);
        if (otherUserOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User not found"));
        }

        User otherUser = otherUserOpt.get();
        List<Message> messages = messageService.getConversation(currentUser, otherUser);
        
        // Mark messages as read
        messageService.markMessagesAsRead(otherUser, currentUser);

        List<Map<String, Object>> messageList = messages.stream()
            .map(m -> Map.of(
                "id", m.getId(),
                "content", m.getContent(),
                "senderId", m.getSender().getId(),
                "senderName", m.getSender().getDisplayName(),
                "sentAt", m.getSentAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "isRead", m.isRead()
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "messages", messageList));
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return ResponseEntity.unauthorized().body(Map.of("success", false, "message", "Not authenticated"));
        }

        List<User> conversationPartners = messageService.getConversationPartners(currentUser);
        List<Map<String, Object>> conversations = conversationPartners.stream()
            .map(partner -> {
                List<Message> messages = messageService.getConversation(currentUser, partner);
                Message lastMessage = messages.isEmpty() ? null : messages.get(messages.size() - 1);
                
                Map<String, Object> conversation = new HashMap<>();
                conversation.put("user", Map.of(
                    "id", partner.getId(),
                    "username", partner.getUsername(),
                    "displayName", partner.getDisplayName(),
                    "online", partner.isOnline()
                ));
                
                if (lastMessage != null) {
                    conversation.put("lastMessage", Map.of(
                        "content", lastMessage.getContent(),
                        "sentAt", lastMessage.getSentAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                        "senderName", lastMessage.getSender().getDisplayName()
                    ));
                }
                
                return conversation;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("success", true, "conversations", conversations));
    }
}