package com.chatapp.repository;

import com.chatapp.entity.Friendship;
import com.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    
    @Query("SELECT f FROM Friendship f WHERE (f.user = :user OR f.friend = :user) AND f.status = 'ACCEPTED'")
    List<Friendship> findAcceptedFriendshipsByUser(@Param("user") User user);
    
    @Query("SELECT f FROM Friendship f WHERE f.friend = :user AND f.status = 'PENDING'")
    List<Friendship> findPendingFriendRequestsByUser(@Param("user") User user);
    
    @Query("SELECT f FROM Friendship f WHERE ((f.user = :user1 AND f.friend = :user2) OR (f.user = :user2 AND f.friend = :user1))")
    Optional<Friendship> findFriendshipBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    boolean existsByUserAndFriend(User user, User friend);
}