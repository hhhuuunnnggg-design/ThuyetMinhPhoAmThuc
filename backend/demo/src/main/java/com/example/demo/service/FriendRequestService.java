// package com.example.demo.service;

// import java.time.LocalDateTime;
// import java.util.List;
// import java.util.Optional;

// import javax.management.Notification;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;

// import com.example.demo.controller.WebSocketController;
// import com.example.demo.domain.FriendRequest;
// import com.example.demo.domain.User;
// import com.example.demo.domain.Enum.FriendRequestStatus;
// import com.example.demo.domain.Enum.NotificationType;
// import com.example.demo.repository.FriendRequestRepository;
// import com.example.demo.repository.UserServiceRepository;

// import jakarta.transaction.Transactional;

// @Service
// public class FriendRequestService {

// @Autowired
// private FriendRequestRepository friendRequestRepository;

// @Autowired
// private UserServiceRepository userRepository;

// @Autowired
// private NotificationService notificationService;

// @Autowired
// private WebSocketController webSocketController;

// /**
// * Gửi yêu cầu kết bạn
// */
// // @Transactional
// // public FriendRequest sendFriendRequest(Long senderId, Long receiverId) {
// // // Kiểm tra người gửi và người nhận có tồn tại
// // User sender = userRepository.findById(senderId)
// // .orElseThrow(() -> new IllegalArgumentException("Người gửi không tồn
// tại."));
// // User receiver = userRepository.findById(receiverId)
// // .orElseThrow(() -> new IllegalArgumentException("Người nhận không tồn
// // tại."));

// // // Kiểm tra nếu đã gửi lời mời kết bạn
// // if (existsFriendRequest(senderId, receiverId)) {
// // throw new IllegalStateException("Đã gửi lời mời kết bạn trước đó.");
// // }

// // // Tạo lời mời kết bạn mới
// // FriendRequest request = new FriendRequest();
// // request.setSender(sender);
// // request.setReceiver(receiver);
// // request.setStatus(FriendRequestStatus.PENDING);
// // request.setCreatedAt(LocalDateTime.now());

// // FriendRequest savedRequest = friendRequestRepository.save(request);

// // // Tạo thông báo cho người nhận
// // String notificationContent = sender.getFirstName() + " " +
// // sender.getLastName()
// // + " đã gửi lời mời kết bạn cho bạn";
// // Notification notification = notificationService.createNotification(
// // senderId,
// // receiverId,
// // notificationContent,
// // null,
// // null,
// // NotificationType.FRIEND_REQUEST);

// // // Gửi thông báo realtime
// // webSocketController.notifyNewPost(receiverId, notification);

// // return savedRequest;
// // }

// /**
// * Kiểm tra lời mời kết bạn đã tồn tại giữa hai người dùng
// */
// public boolean existsFriendRequest(Long senderId, Long receiverId) {
// User sender = new User();
// sender.setId(senderId);

// User receiver = new User();
// receiver.setId(receiverId);

// List<FriendRequest> sentRequests =
// friendRequestRepository.findBySender(sender);

// return sentRequests.stream()
// .anyMatch(req -> req.getReceiver().getId().equals(receiverId) &&
// req.getStatus() == FriendRequestStatus.PENDING);
// }

// /**
// * Lấy danh sách yêu cầu kết bạn gửi đi của một user
// */
// public List<FriendRequest> getRequestsBySender(Long senderId) {
// User sender = new User();
// sender.setId(senderId);
// return friendRequestRepository.findBySender(sender);
// }

// /**
// * Lấy danh sách yêu cầu kết bạn nhận được của một user
// */
// public List<FriendRequest> getRequestsByReceiver(Long receiverId) {
// User receiver = new User();
// receiver.setId(receiverId);
// return friendRequestRepository.findByReceiver(receiver);
// }

// /**
// * Cập nhật trạng thái yêu cầu kết bạn
// */
// @Transactional
// public FriendRequest updateFriendRequest(Long id, FriendRequestStatus status)
// {
// return friendRequestRepository.findById(id)
// .map(existingRequest -> {
// existingRequest.setStatus(status);
// return friendRequestRepository.save(existingRequest);
// })
// .orElseThrow(() -> new IllegalArgumentException("Lời mời kết bạn không tồn
// tại."));
// }

// /**
// * Xoá yêu cầu kết bạn
// */
// @Transactional
// public boolean deleteFriendRequest(Long id) {
// Optional<FriendRequest> requestOpt = friendRequestRepository.findById(id);
// if (requestOpt.isEmpty()) {
// return false;
// }

// FriendRequest request = requestOpt.get();
// if (request.getStatus() != FriendRequestStatus.PENDING) {
// throw new IllegalStateException("Không thể xóa lời mời đã được chấp nhận hoặc
// từ chối.");
// }

// friendRequestRepository.deleteById(id);
// return true;
// }

// /**
// * Từ chối lời mời kết bạn
// */
// @Transactional
// public FriendRequest rejectFriendRequest(Long requestId) {
// FriendRequest request = friendRequestRepository.findById(requestId)
// .orElseThrow(() -> new IllegalArgumentException("Lời mời kết bạn không tồn
// tại."));

// if (request.getStatus() != FriendRequestStatus.PENDING) {
// throw new IllegalStateException("Lời mời kết bạn đã được xử lý trước đó.");
// }

// request.setStatus(FriendRequestStatus.REJECTED);
// return friendRequestRepository.save(request);
// }

// /**
// * Tìm lời mời kết bạn theo ID
// */
// public Optional<FriendRequest> findById(Long requestId) {
// return friendRequestRepository.findById(requestId);
// }

// /**
// * Lấy tất cả lời mời kết bạn đang pending mà người dùng NHẬN được
// */
// public List<FriendRequest> getPendingRequestsReceivedByUser(Long userId) {
// return friendRequestRepository.findPendingRequestsReceivedByUserId(userId);
// }

// /**
// * Tìm lời mời kết bạn đang pending giữa hai người dùng
// */
// public Optional<FriendRequest> findPendingRequest(Long senderId, Long
// receiverId) {
// return friendRequestRepository.findPendingRequest(senderId, receiverId);
// }
// }
