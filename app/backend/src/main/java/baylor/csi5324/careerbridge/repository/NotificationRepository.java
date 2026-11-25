package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.Notification;
import baylor.csi5324.careerbridge.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByNotificationIdAsc(User recipient);
}
