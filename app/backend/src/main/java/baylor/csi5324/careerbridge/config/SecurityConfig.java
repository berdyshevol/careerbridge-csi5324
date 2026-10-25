package baylor.csi5324.careerbridge.config;

import baylor.csi5324.careerbridge.model.Role;
import baylor.csi5324.careerbridge.service.LogInService;
import org.springframework.http.HttpMethod;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

// ADR-0010: users log in for a signed token (LogInService) and send it as a bearer token.
// The HTTP Basic administrator of ADR-0007 stays until the administrator page uses the token.
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CORS comes from WebConfig, so the allowed origins live in one place
                .cors(Customizer.withDefaults())
                // No session cookie is issued: every request carries its own credentials
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // The H2 console draws itself in frames
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", Role.ADMINISTRATOR.name())
                        .requestMatchers("/api/auth/me").authenticated()
                        .anyRequest().permitAll())
                .oauth2ResourceServer(server -> server
                        .bearerTokenResolver(ignoredOnPublicReads())
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(roleFromToken())))
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    // An expired token must not cost a visitor the job board (BR-3): public reads never look at it
    private static BearerTokenResolver ignoredOnPublicReads() {
        RequestMatcher publicReads = new OrRequestMatcher(
                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.GET, "/api/postings/**"),
                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.GET, "/api/postings"),
                PathPatternRequestMatcher.withDefaults().matcher("/api/auth/login"));
        DefaultBearerTokenResolver resolver = new DefaultBearerTokenResolver();
        return request -> publicReads.matches(request) ? null : resolver.resolve(request);
    }

    private static JwtAuthenticationConverter roleFromToken() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName(LogInService.ROLE_CLAIM);
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    @Bean
    UserDetailsService userDetailsService(
            @Value("${careerbridge.admin.username}") String username,
            @Value("${careerbridge.admin.password}") String password,
            PasswordEncoder passwordEncoder) {
        if (username.isBlank() || password.isBlank()) {
            return new InMemoryUserDetailsManager();
        }
        return new InMemoryUserDetailsManager(User.withUsername(username)
                .password(passwordEncoder.encode(password))
                .roles("ADMIN")
                .build());
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
