package com.fintrack.application.service;

import com.fintrack.api.dto.AuthResponse;
import com.fintrack.api.dto.LoginRequest;
import com.fintrack.api.dto.RegisterRequest;
import com.fintrack.domain.exception.UserAlreadyExistsException;
import com.fintrack.domain.exception.UserNotFoundException;
import com.fintrack.domain.model.User;
import com.fintrack.domain.repository.UserRepository;
import com.fintrack.infrastructure.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(request.getEmail());
        }

        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);

        var accessToken = jwtUtil.generateAccessToken(user.getEmail());
        var refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException(
                        "User not found with email: " + request.getEmail()
                ));

        var accessToken = jwtUtil.generateAccessToken(user.getEmail());
        var refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .fullName(user.getFullName())
                .email(user.getEmail())
                .build();
    }
}