package baylor.csi5324.careerbridge.dto;

public record PostingSearchCriteria(
        String keyword,
        String location,
        String employmentType
) {
    public static final PostingSearchCriteria ANY = new PostingSearchCriteria(null, null, null);
}
