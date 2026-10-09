package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void savesAUserWithTheAttributesOfTheDomainModel() {
        Long userId = userRepository.saveAndFlush(user("ada@example.com")).getUserId();
        entityManager.clear(); // so the read below comes from the database, not from memory

        User found = userRepository.findById(userId).orElseThrow();

        assertEquals("Ada", found.getFirstName());
        assertEquals("Lovelace", found.getLastName());
        assertEquals("ada@example.com", found.getEmail());
        assertEquals("254-555-0100", found.getPhoneNumber());
        assertEquals(AccountStatus.PENDING_VERIFICATION, found.getAccountStatus());
    }

    @Test
    void rejectsASecondUserWithTheSameEmail() {
        userRepository.saveAndFlush(user("ada@example.com"));

        assertThrows(DataIntegrityViolationException.class,
                () -> userRepository.saveAndFlush(user("ada@example.com")));
    }

    private User user(String email) {
        User user = new User();
        user.setFirstName("Ada");
        user.setLastName("Lovelace");
        user.setEmail(email);
        user.setPhoneNumber("254-555-0100");
        user.setAccountStatus(AccountStatus.PENDING_VERIFICATION);
        return user;
    }
}
