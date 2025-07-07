package com.chatapp.service;

import com.chatapp.entity.Friendship;
import com.chatapp.entity.User;
import com.chatapp.repository.FriendshipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FriendshipService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    public Friendship sendFriendRequest(User requester, User target) {
        // Check if friendship already exists
        Optional<Friendship> existingFriendship = friendshipRepository.findFriendshipBetweenUsers(requester, target);
        if (existingFriendship.isPresent()) {
            throw new RuntimeException("Friendship request already exists");
        }

        Friendship friendship = new Friendship(requester, target);
        return friendshipRepository.save(friendship);
    }

    public void acceptFriendRequest(Long friendshipId) {
        Optional<Friendship> friendshipOpt = friendshipRepository.findById(friendshipId);
        if (friendshipOpt.isPresent()) {
            Friendship friendship = friendshipOpt.get();
            friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
            friendshipRepository.save(friendship);
        }
    }

    public void declineFriendRequest(Long friendshipId) {
        friendshipRepository.deleteById(friendshipId);
    }

    public List<User> getFriends(User user) {
        List<Friendship> friendships = friendshipRepository.findAcceptedFriendshipsByUser(user);
        List<User> friends = new ArrayList<>();
        
        for (Friendship friendship : friendships) {
            if (friendship.getUser().equals(user)) {
                friends.add(friendship.getFriend());
            } else {
                friends.add(friendship.getUser());
            }
        }
        
        return friends;
    }

    public List<Friendship> getPendingFriendRequests(User user) {
        return friendshipRepository.findPendingFriendRequestsByUser(user);
    }

    public boolean areFriends(User user1, User user2) {
        Optional<Friendship> friendship = friendshipRepository.findFriendshipBetweenUsers(user1, user2);
        return friendship.isPresent() && 
               friendship.get().getStatus() == Friendship.FriendshipStatus.ACCEPTED;
    }

    public void removeFriend(User user1, User user2) {
        Optional<Friendship> friendship = friendshipRepository.findFriendshipBetweenUsers(user1, user2);
        friendship.ifPresent(f -> friendshipRepository.delete(f));
    }
}