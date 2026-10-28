package baylor.csi5324.careerbridge.service;

// CO-03.2 updateProfile(details)
public record ProfileDetails(String firstName, String lastName, String phone, String location,
                             String headline, String skills, String education, String workExperience) {
}
