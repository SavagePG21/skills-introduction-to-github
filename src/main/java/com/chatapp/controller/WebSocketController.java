package com.chatapp.controller;

import com.chatapp.entity.Message;
import com.chatapp.entity.User;
import com.chatapp.service.MessageService;
import com.chatapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, Object> chatMessage) {
        try {
            Long senderId = Long.valueOf(chatMessage.get("senderId").toString());
            Long receiverId = Long.valueOf(chatMessage.get("receiverId").toString());
            String content = chatMessage.get("content").toString();

            Optional<User> senderOpt = userService.findById(senderId);
            Optional<User> receiverOpt = userService.findById(receiverId);

            if (senderOpt.isPresent() && receiverOpt.isPresent()) {
                User sender = senderOpt.get();
                User receiver = receiverOpt.get();

                Message message = messageService.sendMessage(sender, receiver, content);

                Map<String, Object> messageResponse = Map.of(
                    "id", message.getId(),
                    "content", message.getContent(),
                    "senderId", message.getSender().getId(),
                    "senderName", message.getSender().getDisplayName(),
                    "receiverId", message.getReceiver().getId(),
                    "sentAt", message.getSentAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                    "isRead", message.isRead()
                );

                // Send to both sender and receiver
                messagingTemplate.convertAndSendToUser(
                    sender.getUsername(),
                    "/queue/messages",
                    messageResponse
                );

                messagingTemplate.convertAndSendToUser(
                    receiver.getUsername(),
                    "/queue/messages",
                    messageResponse
                );
            }
        } catch (Exception e) {
            System.err.println("Error sending message: " + e.getMessage());
        }
    }

    @MessageMapping("/chat.addUser")
    public void addUser(@Payload Map<String, Object> userMessage) {
        try {
            String username = userMessage.get("username").toString();
            userService.setUserOnline(username, true);
            
            messagingTemplate.convertAndSend("/topic/user.addUser", Map.of(
                "username", username,
                "type", "JOIN"
            ));
        } catch (Exception e) {
            System.err.println("Error adding user: " + e.getMessage());
        }
    }

    @MessageMapping("/chat.removeUser")
    public void removeUser(@Payload Map<String, Object> userMessage) {
        try {
            String username = userMessage.get("username").toString();
            userService.setUserOnline(username, false);
            
            messagingTemplate.convertAndSend("/topic/user.removeUser", Map.of(
                "username", username,
                "type", "LEAVE"
            ));
        } catch (Exception e) {
            System.err.println("Error removing user: " + e.getMessage());
        }
    }
}