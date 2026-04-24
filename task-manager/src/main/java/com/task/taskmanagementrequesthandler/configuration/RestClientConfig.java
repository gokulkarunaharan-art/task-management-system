package com.task.taskmanagementrequesthandler.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.client.RestClient;

import java.util.stream.Collectors;

@Configuration
public class RestClientConfig {

    @Value("${task.service.url}")
    private String baseUrl;

    @Value("${task.service.username}")
    private String username;

    @Value("${task.service.password}")
    private String password;

    @Bean
    public RestClient restClient(){

        return RestClient.builder()
                .defaultHeaders(headers->headers.setBasicAuth(username, password))
                .requestInterceptor((request, body, execution) -> {

                    JwtAuthenticationToken auth =
                            (JwtAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null) {
                        Jwt jwt = auth.getToken();

                        request.getHeaders().set("X-Auth-Username", jwt.getClaimAsString("sub"));
                        request.getHeaders().set("X-Auth-Email",    jwt.getClaimAsString("email"));
                        request.getHeaders().set("X-Auth-Role",    jwt.getClaimAsStringList("roles")
                                .stream()
                                .filter(role -> role.startsWith("ROLE_"))
                                .collect(Collectors.joining(",")));
                    }
                    System.out.println("Request sent to URI: " + request.getURI());
                    System.out.println("Headers: " + request.getHeaders());
                    return execution.execute(request, body);
                })
                .baseUrl(baseUrl)
                .build();
    }
}
