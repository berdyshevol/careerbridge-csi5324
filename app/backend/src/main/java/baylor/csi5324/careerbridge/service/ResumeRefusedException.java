package baylor.csi5324.careerbridge.service;

// UC-03 extension 6a: the file is not a PDF or DOCX of at most 5 MB; the message is for the applicant
public class ResumeRefusedException extends RuntimeException {

    public ResumeRefusedException(String reason) {
        super(reason);
    }
}
