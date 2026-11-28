package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.model.Applicant;
import baylor.csi5324.careerbridge.model.ApplicationStatus;
import baylor.csi5324.careerbridge.model.JobPosting;
import baylor.csi5324.careerbridge.model.ResumeSnapshot;
import baylor.csi5324.careerbridge.model.StatusHistoryEntry;
import baylor.csi5324.careerbridge.service.ApplicationNotFoundException;
import baylor.csi5324.careerbridge.service.ApplicationReview;
import baylor.csi5324.careerbridge.service.PostingApplicants;
import baylor.csi5324.careerbridge.service.PostingNotFoundException;
import baylor.csi5324.careerbridge.service.RecruiterApplicationsService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RecruiterApplicantsControllerTest {

    private static final String RECRUITER = "riley.chen@example.com";

    private final RecruiterApplicationsService service = mock(RecruiterApplicationsService.class);
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new RecruiterApplicantsController(service))
            .setControllerAdvice(new ServiceExceptionHandlers()).build();

    @Test
    void returnsThePostingWithItsApplicantsAndTheirStages() throws Exception {
        JobPosting posting = new JobPosting();
        posting.setJobPostId(7L);
        posting.setTitle("Data Analyst");
        when(service.viewPosting(RECRUITER, 7L)).thenReturn(new PostingApplicants(posting, List.of(
                new PostingApplicants.Applicant(31L, "Chris Alvarez", ApplicationStatus.APPLIED),
                new PostingApplicants.Applicant(32L, "Omar Haddad", ApplicationStatus.INTERVIEW))));

        mockMvc.perform(get("/api/recruiter/postings/7").principal(() -> RECRUITER))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.postingId").value(7))
                .andExpect(jsonPath("$.title").value("Data Analyst"))
                .andExpect(jsonPath("$.applicants[0].applicationId").value(31))
                .andExpect(jsonPath("$.applicants[0].name").value("Chris Alvarez"))
                .andExpect(jsonPath("$.applicants[0].stage").value("APPLIED"))
                .andExpect(jsonPath("$.applicants[1].stage").value("INTERVIEW"));
    }

    @Test
    void aPostingNotFoundIsA404() throws Exception {
        when(service.viewPosting(RECRUITER, 9L)).thenThrow(new PostingNotFoundException(9L));

        mockMvc.perform(get("/api/recruiter/postings/9").principal(() -> RECRUITER))
                .andExpect(status().isNotFound());
    }

    @Test
    void returnsTheReviewWithoutAnythingAboutOtherApplications() throws Exception {
        Applicant jordan = new Applicant();
        jordan.setFirstName("Jordan");
        jordan.setLastName("Lee");
        jordan.setEmail("jordan.lee@example.com");
        jordan.setPhone("(512) 555-0193");
        jordan.setLocation("Austin, TX");
        jordan.setHeadline("Analyst moving from retail to healthcare");
        when(service.reviewApplication(RECRUITER, 31L)).thenReturn(new ApplicationReview(31L, 7L, "Data Analyst",
                "Jordan Lee", ApplicationStatus.SCREENING, jordan,
                new ResumeSnapshot("jordan-lee.pdf", "application/pdf", 2048L),
                List.of(new StatusHistoryEntry(ApplicationStatus.APPLIED, LocalDate.of(2026, 10, 9)),
                        new StatusHistoryEntry(ApplicationStatus.SCREENING, LocalDate.of(2026, 10, 14)))));

        mockMvc.perform(get("/api/recruiter/applications/31").principal(() -> RECRUITER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value(31))
                .andExpect(jsonPath("$.postingId").value(7))
                .andExpect(jsonPath("$.postingTitle").value("Data Analyst"))
                .andExpect(jsonPath("$.applicantName").value("Jordan Lee"))
                .andExpect(jsonPath("$.stage").value("SCREENING"))
                .andExpect(jsonPath("$.resume.fileName").value("jordan-lee.pdf"))
                .andExpect(jsonPath("$.resume.fileSize").value(2048))
                .andExpect(jsonPath("$.profile.email").value("jordan.lee@example.com"))
                .andExpect(jsonPath("$.profile.phone").value("(512) 555-0193"))
                .andExpect(jsonPath("$.profile.location").value("Austin, TX"))
                .andExpect(jsonPath("$.profile.headline").value("Analyst moving from retail to healthcare"))
                .andExpect(jsonPath("$.history[0].stage").value("APPLIED"))
                .andExpect(jsonPath("$.history[0].date").value("2026-10-09"))
                .andExpect(jsonPath("$.history[1].stage").value("SCREENING"))
                .andExpect(jsonPath("$.applications").doesNotExist())
                .andExpect(jsonPath("$.profile.skills").doesNotExist());
    }

    @Test
    void aReviewWithNoResumeContentStillShowsTheCopyAsNotDownloadable() throws Exception {
        Applicant jordan = new Applicant();
        jordan.setFirstName("Jordan");
        jordan.setLastName("Lee");
        // Snapshots taken before uploads existed have a name and a size but no file
        when(service.reviewApplication(RECRUITER, 31L)).thenReturn(new ApplicationReview(31L, 7L, "Data Analyst",
                "Jordan Lee", ApplicationStatus.APPLIED, jordan,
                new ResumeSnapshot("old.pdf", "application/pdf", 10L), List.of()));

        mockMvc.perform(get("/api/recruiter/applications/31").principal(() -> RECRUITER))
                .andExpect(jsonPath("$.resume.fileName").value("old.pdf"))
                .andExpect(jsonPath("$.resume.downloadable").value(false));
    }

    @Test
    void anApplicationNotFoundIsA404() throws Exception {
        when(service.reviewApplication(RECRUITER, 99L)).thenThrow(new ApplicationNotFoundException(99L));

        mockMvc.perform(get("/api/recruiter/applications/99").principal(() -> RECRUITER))
                .andExpect(status().isNotFound());
    }

    @Test
    void downloadsTheResumeCopyAsAnAttachment() throws Exception {
        ResumeSnapshot snapshot = ResumeSnapshot.of(new baylor.csi5324.careerbridge.model.Resume(
                "jordan-lee.pdf", "application/pdf", 3L, new byte[]{1, 2, 3}, java.time.LocalDateTime.now()));
        when(service.resumeOf(RECRUITER, 31L)).thenReturn(snapshot);

        mockMvc.perform(get("/api/recruiter/applications/31/resume").principal(() -> RECRUITER))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"jordan-lee.pdf\""))
                .andExpect(content().bytes(new byte[]{1, 2, 3}));
    }

    @Test
    void aResumeCopyWithNoFileIsA404() throws Exception {
        when(service.resumeOf(RECRUITER, 31L)).thenReturn(new ResumeSnapshot("old.pdf", "application/pdf", 10L));

        mockMvc.perform(get("/api/recruiter/applications/31/resume").principal(() -> RECRUITER))
                .andExpect(status().isNotFound());
    }
}
