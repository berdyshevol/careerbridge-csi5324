# CareerBridge — Design

> Part of the CareerBridge specification — see the [index](README.md).

## 6. Sequence Diagrams (Design)

One design sequence diagram per system operation of the implemented use cases. Each shows how the
objects of [architecture.md](architecture.md) realize an operation contract of
[ssd-and-contracts.md](ssd-and-contracts.md):

- the page sends one HTTP request (the call in `lib/api.ts` is folded into it);
- a controller hands it to the service method named after the system operation;
- the service applies the business rules, creates and changes entities and calls repositories;
- a refusal is an exception that the controller turns into an HTTP status with a reason in plain
  text or, for refused fields, a field-to-reason map;
- names are the class and method names in the code on `main`.

The diagrams are Mermaid source, so GitHub draws them and the Deliverable PDF is rendered from the
same text.

### UC-02 Register as Applicant

The service first checks the fields of CO-02.1: a full name with a last name, a well-formed email address and the password policy of A15 (at least 10 characters, including a letter and a number). Every invalid field comes back at once with its reason, so the form shows each one next to its field. Only then does the service look the address up, ignoring case, and refuse it if an account already exists, suggesting to log in instead. Otherwise it creates the Applicant as Active, keeps only a hash of the password and saves it; a unique constraint on the email turns two registrations at the same moment into the same refusal. No verification email is sent (A15): LogInService signs a token for the new Applicant (ADR-0010), and the form saves the session and opens the profile, where the Applicant is invited to add a resume (UC-03).

```mermaid
sequenceDiagram
    actor V as Visitor
    participant RF as RegisterForm
    participant RC as Registration<br/>Controller
    participant RS as Registration<br/>Service
    participant UR as UserRepository
    participant PE as PasswordEncoder
    participant LS as LogInService

    V->>RF: enter full name, email, password and submit
    RF->>RC: POST /api/applicants<br/>{fullName, email, password}
    RC->>RS: register(fullName, email, password)
    RS->>RS: validate fields: full name with a last name,<br/>email well formed, password policy (A15)

    alt invalid fields (ext. 4a, 4c)
        RS-->>RC: RegistrationRefusedException(fieldErrors)
        RC-->>RF: 400 {field: reason}
        RF-->>V: each reason next to its field, nothing saved
    else fields valid
        RS->>UR: findByEmailIgnoreCase(address)
        alt email already registered (ext. 4b)
            UR-->>RS: Optional[User]
            RS-->>RC: AlreadyRegisteredException
            RC-->>RF: 409 "An account already exists…"
            RF-->>V: message shown, nothing saved
        else all checks pass
            UR-->>RS: Optional.empty
            create participant A as :Applicant
            RS->>A: new Applicant()
            RS->>A: setFirstName(..), setLastName(..), setEmail(address),<br/>setAccountStatus(ACTIVE)
            RS->>PE: encode(password)
            PE-->>RS: hash
            RS->>A: setPasswordHash(hash)
            RS->>UR: saveAndFlush(applicant)
            UR-->>RS: Applicant
            RS->>LS: startSession(applicant)
            Note over LS: JwtEncoder signs the token:<br/>subject email, role APPLICANT,<br/>expires in 8 h
            LS-->>RS: LoggedIn(token, applicant)
            RS-->>RC: LoggedIn
            RC-->>RF: 201 LoggedInResponse {token, user}
            RF->>RF: saveSession(session)
            RF->>RF: router.replace("/profile")
            RF-->>V: logged in, invited to add a resume (UC-03)
        end
    end
```

**Figure 26: SD-8 Register as an applicant (UC-02)**

## 7. Design Class Diagram (DCD)

Not written yet. Iteration 2 adds the design class diagram, consistent with the sequence diagrams
above and with the [domain model](domain-model.md).

### 7.1 Consistency with the sequence diagrams

Every system operation in a sequence diagram above, and the classes and methods that realize it;
the DCD must contain each of them.

| Diagram | Controller method | Service method | Repository calls |
| --- | --- | --- | --- |
| SD-8 | `RegistrationController.register` | `RegistrationService.register`; `LogInService.startSession` | `UserRepository.findByEmailIgnoreCase`, `saveAndFlush` |
