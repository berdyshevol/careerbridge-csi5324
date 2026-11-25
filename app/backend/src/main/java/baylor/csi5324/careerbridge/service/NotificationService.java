package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.Notification;
import baylor.csi5324.careerbridge.model.NotificationType;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.AdministratorRepository;
import baylor.csi5324.careerbridge.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// The hand-over to the Notification Service. There is no mail service yet (Iteration 1 feedback asks
// for no external services), so each Notification stays Pending, as UC-08/09/10 extension 7a
// describe, and the log shows what would be sent.
@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final AdministratorRepository administratorRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               AdministratorRepository administratorRepository) {
        this.notificationRepository = notificationRepository;
        this.administratorRepository = administratorRepository;
    }

    public Notification notify(User recipient, NotificationType type, String message) {
        Notification notification = notificationRepository.save(new Notification(recipient, type, message));
        log.info("Notification {} to {}: {}", type, recipient.getEmail(), message);
        return notification;
    }

    // The contracts address "the Administrator": every account in that role gets the alert
    public void notifyAdministrators(NotificationType type, String message) {
        administratorRepository.findAll().forEach(administrator -> notify(administrator, type, message));
    }
}
