package baylor.csi5324.careerbridge.service;

// CO-ADM.1 and CO-ADM.2: the account is not in the state the change starts from
public class AccountChangeRefusedException extends RuntimeException {

    public AccountChangeRefusedException(String message) {
        super(message);
    }
}
