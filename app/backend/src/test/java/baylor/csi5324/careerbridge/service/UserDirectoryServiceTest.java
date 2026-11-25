package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.model.User;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class UserDirectoryServiceTest {

    @Autowired
    private UserDirectoryService userDirectoryService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void listsEveryUserWithTheirRole() {
        userRepository.save(applicant("Zoe", "Adams", "zoe.adams@example.com"));

        UserDirectory directory = userDirectoryService.viewUsers();

        assertEquals(userRepository.count(), directory.users().size());
        User zoe = directory.users().stream()
                .filter(user -> user.getEmail().equals("zoe.adams@example.com")).findFirst().orElseThrow();
        assertEquals(Role.APPLICANT, Role.of(zoe));
        assertTrue(directory.users().stream().anyMatch(user -> user.getEmail().equals("riley.chen@example.com")
                && Role.of(user) == Role.RECRUITER));
        assertTrue(directory.users().stream().anyMatch(user -> user.getEmail().equals("admin@careerbridge.example")
                && Role.of(user) == Role.ADMINISTRATOR));
    }

    @Test
    void listsAdministratorsThenRecruitersThenApplicantsEachByName() {
        userRepository.save(applicant("Bea", "Zimmer", "bea.zimmer@example.com"));
        userRepository.save(applicant("Al", "Aaron", "al.aaron@example.com"));
        userRepository.save(applicant("Cy", "Aaron", "cy.aaron@example.com"));

        List<User> users = userDirectoryService.viewUsers().users();

        List<Role> roles = users.stream().map(Role::of).distinct().toList();
        assertEquals(List.of(Role.ADMINISTRATOR, Role.RECRUITER, Role.APPLICANT), roles);
        List<String> applicants = users.stream().filter(user -> Role.of(user) == Role.APPLICANT)
                .map(User::getEmail).filter(email -> email.matches("(bea|al|cy)\\..*")).toList();
        assertEquals(List.of("al.aaron@example.com", "cy.aaron@example.com", "bea.zimmer@example.com"), applicants);
    }

    @Test
    void countsTheUsersOfEachRole() {
        long applicantsBefore = userDirectoryService.viewUsers().usersByRole().get(Role.APPLICANT);
        userRepository.save(applicant("Dee", "Ng", "dee.ng@example.com"));

        UserDirectory directory = userDirectoryService.viewUsers();

        assertEquals(applicantsBefore + 1, directory.usersByRole().get(Role.APPLICANT));
        for (Role role : Role.values()) {
            assertEquals(directory.users().stream().filter(user -> Role.of(user) == role).count(),
                    directory.usersByRole().get(role));
        }
    }

    private static Applicant applicant(String firstName, String lastName, String email) {
        Applicant applicant = new Applicant();
        applicant.setFirstName(firstName);
        applicant.setLastName(lastName);
        applicant.setEmail(email);
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        return applicant;
    }
}
