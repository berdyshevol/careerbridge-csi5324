package baylor.csi5324.careerbridge.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Lets the frontend call the API from the browser (CORS), for every controller at once.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String frontendOrigin;

    public WebConfig(@Value("${careerbridge.frontend-origin}") String frontendOrigin) {
        this.frontendOrigin = frontendOrigin;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(frontendOrigin)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE");
    }
}
