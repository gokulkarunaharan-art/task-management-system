package com.taskmanagementsystem.task.filter;

import com.taskmanagementsystem.task.model.UserContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class UserContextPopulationFilter extends OncePerRequestFilter {

    private final UserContext userContext;
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        userContext.setUsername(request.getHeader("X-Auth-Username"));
        userContext.setEmail(request.getHeader("X-Auth-Email"));
        userContext.setRole(request.getHeader("X-Auth-Role"));
        filterChain.doFilter(request, response);
    }
}
