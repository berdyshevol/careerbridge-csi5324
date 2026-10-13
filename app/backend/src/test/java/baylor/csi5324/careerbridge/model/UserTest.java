package baylor.csi5324.careerbridge.model;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DataJpaTest
class UserTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void savesAndReloadsAllAttributes() {
        User user = new User();
        user.setFirstName("Ada");
        user.setLastName("Lovelace");
        user.setEmail("ada@example.com");
        user.setPhone("254-555-0100");
        user.setAccountStatus(AccountStatus.PENDING_VERIFICATION);

        Long id = entityManager.persistAndGetId(user, Long.class);
        entityManager.flush();
        entityManager.clear();

        User reloaded = entityManager.find(User.class, id);
        assertNotNull(reloaded);
        assertEquals(id, reloaded.getUserId());
        assertEquals("Ada", reloaded.getFirstName());
        assertEquals("Lovelace", reloaded.getLastName());
        assertEquals("ada@example.com", reloaded.getEmail());
        assertEquals("254-555-0100", reloaded.getPhone());
        assertEquals(AccountStatus.PENDING_VERIFICATION, reloaded.getAccountStatus());
    }
}
