package baylor.csi5324.careerbridge.repository;

import baylor.csi5324.careerbridge.model.MembershipStatus;
import baylor.csi5324.careerbridge.model.Organization;
import baylor.csi5324.careerbridge.model.OrganizationMembership;
import baylor.csi5324.careerbridge.model.Recruiter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, Long> {

    List<OrganizationMembership> findByRecruiterOrderByRequestedAtAscMembershipIdAsc(Recruiter recruiter);

    List<OrganizationMembership> findByRecruiterAndStatus(Recruiter recruiter, MembershipStatus status);

    List<OrganizationMembership> findByOrganization(Organization organization);

    // UC-10 step 2: oldest first
    List<OrganizationMembership> findByStatusInOrderByRequestedAtAscMembershipIdAsc(Collection<MembershipStatus> statuses);

    // UC-10 extension 6a: two Administrators deciding one request at once wait for each other
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from OrganizationMembership m where m.membershipId = :membershipId")
    Optional<OrganizationMembership> lockById(Long membershipId);
}
