package baylor.csi5324.careerbridge.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] frontendOrigins;
    private final boolean publicDeployment;

    public WebConfig(
            @Value("${careerbridge.frontend-origins}") String[] frontendOrigins,
            @Value("${careerbridge.public-deployment}") boolean publicDeployment) {
        this.frontendOrigins = frontendOrigins;
        this.publicDeployment = publicDeployment;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (publicDeployment) {
            // Logging in writes only the A15 counters and registering only the new account (UC-02);
            // every later write still meets this switch
            registry.addInterceptor(new ReadOnlyWithoutLogin()).addPathPatterns("/api/**")
                    .excludePathPatterns("/api/auth/login", "/api/applicants");
        }
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(frontendOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE");
    }
}
