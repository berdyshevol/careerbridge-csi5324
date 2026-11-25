package baylor.csi5324.careerbridge.controller;

import baylor.csi5324.careerbridge.controller.dto.ApprovalQueueEntry;
import baylor.csi5324.careerbridge.controller.dto.MembershipResponse;
import baylor.csi5324.careerbridge.controller.dto.RequestDetailsResponse;
import baylor.csi5324.careerbridge.service.MembershipApprovalService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// UC-10. Only the Administrator role reaches /api/admin/** (SecurityConfig, FR-UC10.1).
@RestController
@RequestMapping("/api/admin/requests")
public class AdminMembershipRequestController {

    private final MembershipApprovalService approvalService;

    public AdminMembershipRequestController(MembershipApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    public List<ApprovalQueueEntry> openApprovalQueue() {
        return approvalService.openApprovalQueue().stream().map(ApprovalQueueEntry::from).toList();
    }

    @GetMapping("/{requestId}")
    public RequestDetailsResponse selectRequest(@PathVariable Long requestId) {
        return RequestDetailsResponse.from(approvalService.selectRequest(requestId));
    }

    @PostMapping("/{requestId}/approve")
    public MembershipResponse approveRequest(@PathVariable Long requestId, Authentication administrator) {
        return MembershipResponse.from(approvalService.approveRequest(requestId, administrator.getName()));
    }

    @PostMapping("/{requestId}/deny")
    public MembershipResponse denyRequest(@PathVariable Long requestId, @RequestBody NoteRequest request,
                                          Authentication administrator) {
        return MembershipResponse.from(
                approvalService.denyRequest(requestId, administrator.getName(), request.note()));
    }

    @PostMapping("/{requestId}/request-information")
    public MembershipResponse requestInformation(@PathVariable Long requestId, @RequestBody NoteRequest request,
                                                 Authentication administrator) {
        return MembershipResponse.from(
                approvalService.requestInformation(requestId, administrator.getName(), request.note()));
    }

    public record NoteRequest(String note) {
    }
}
