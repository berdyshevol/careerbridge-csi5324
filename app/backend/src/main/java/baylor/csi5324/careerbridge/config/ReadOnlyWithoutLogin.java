package baylor.csi5324.careerbridge.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

// ADR-0006: until every write checks who is logged in (ADR-0010), the public deployment changes no data
public class ReadOnlyWithoutLogin implements HandlerInterceptor {

    public static final String REASON =
            "Saving is switched off on the public site until every action checks who is logged in.";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (HttpMethod.GET.matches(request.getMethod())
                || HttpMethod.HEAD.matches(request.getMethod())
                || HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.TEXT_PLAIN_VALUE);
        response.getWriter().write(REASON);
        return false;
    }
}
