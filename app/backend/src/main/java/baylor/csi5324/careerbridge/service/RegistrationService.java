package baylor.csi5324.careerbridge.service;

import baylor.csi5324.careerbridge.model.AccountStatus;
import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

// UC-02 Register as Applicant, CO-02.1. No verification email (A15): Iteration 1 feedback asks for no
// external services, so the applicant account is Active at once and the new Applicant is logged in.
@Service
@Transactional
public class RegistrationService {

    static final String PASSWORD_POLICY = AccountRules.PASSWORD_POLICY;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogInService logInService;

    public RegistrationService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                               LogInService logInService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.logInService = logInService;
    }

    public LoggedIn register(String fullName, String email, String password) {
        String name = AccountRules.name(fullName);
        String address = AccountRules.email(email);
        Map<String, String> errors = new LinkedHashMap<>();
        AccountRules.checkFullName(name, errors);
        AccountRules.checkEmail(address, errors);
        AccountRules.checkPassword(password, errors);
        if (!errors.isEmpty()) {
            throw new RegistrationRefusedException(errors);
        }
        if (userRepository.findByEmailIgnoreCase(address).isPresent()) {
            throw new AlreadyRegisteredException();
        }

        Applicant applicant = new Applicant();
        applicant.setFirstName(AccountRules.firstName(name));
        applicant.setLastName(AccountRules.lastName(name));
        applicant.setEmail(address);
        applicant.setAccountStatus(AccountStatus.ACTIVE);
        applicant.setPasswordHash(passwordEncoder.encode(password));
        try {
            return logInService.startSession(userRepository.saveAndFlush(applicant));
        } catch (DataIntegrityViolationException sameMomentDuplicate) {
            // Only the unique email can fail here, the lengths are checked above: two registrations
            // for one address at once, and the other passed the check above first
            throw new AlreadyRegisteredException();
        }
    }
}
