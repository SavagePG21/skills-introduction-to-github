package com.chatapp.service;

import com.chatapp.entity.Message;
import com.chatapp.entity.User;
import com.chatapp.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    public Message sendMessage(User sender, User receiver, String content) {
        Message message = new Message(sender, receiver, content);
        return messageRepository.save(message);
    }

    public List<Message> getConversation(User user1, User user2) {
        return messageRepository.findConversationBetweenUsers(user1, user2);
    }

    public List<Message> getUnreadMessages(User user) {
        return messageRepository.findUnreadMessagesByReceiver(user);
    }

    public List<User> getConversationPartners(User user) {
        return messageRepository.findConversationPartners(user);
    }

    public void markMessagesAsRead(User sender, User receiver) {
        List<Message> messages = messageRepository.findConversationBetweenUsers(sender, receiver);
        for (Message message : messages) {
            if (message.getReceiver().equals(receiver) && !message.isRead()) {
                message.setRead(true);
                messageRepository.save(message);
            }
        }
    }

    public long getUnreadMessageCount(User user) {
        return getUnreadMessages(user).size();
    }
}