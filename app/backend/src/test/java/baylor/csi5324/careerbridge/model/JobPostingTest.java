package baylor.csi5324.careerbridge.model;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JobPostingTest {

    private static JobPosting published(LocalDate deadline, String timeZone) {
        Organization organization = new Organization("Brazos Analytics");
        organization.setTimeZone(timeZone);
        JobPosting posting = new JobPosting();
        posting.setOrganization(organization);
        posting.setPostStatus(PostStatus.PUBLISHED);
        posting.setApplicationDeadline(deadline);
        return posting;
    }

    @Test
    void closesAt2359OnTheDeadlineInTheOrganizationsZone() {
        JobPosting posting = published(LocalDate.of(2026, 10, 17), "America/Chicago");

        assertEquals(Instant.parse("2026-10-18T04:59:00Z"), posting.closesAt());
    }

    @Test
    void isOpenUntilTheClosingMinuteAndNotAtIt() {
        JobPosting posting = published(LocalDate.of(2026, 10, 17), "America/Chicago");

        assertTrue(posting.isOpen(Instant.parse("2026-10-18T04:58:59Z")));
        assertFalse(posting.isOpen(Instant.parse("2026-10-18T04:59:00Z")));
    }

    @Test
    void isNotOpenUnlessPublished() {
        JobPosting posting = published(LocalDate.of(2026, 10, 17), "UTC");
        posting.setPostStatus(PostStatus.CLOSED);

        assertFalse(posting.isOpen(Instant.parse("2026-10-01T00:00:00Z")));
    }

    @Test
    void hasNoClosingMomentWithoutADeadline() {
        JobPosting posting = published(null, "UTC");

        assertNull(posting.closesAt());
        assertFalse(posting.isOpen(Instant.parse("2026-10-01T00:00:00Z")));
        assertFalse(posting.isPastDeadline(Instant.parse("2026-10-01T00:00:00Z")));
    }
}
