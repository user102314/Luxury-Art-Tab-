package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.UserDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.User;
import com.luxart.ecommerce.repository.UserRepository;
import com.luxart.ecommerce.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserDto> findAll() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public UserDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public UserDto create(UserDto dto) {
        User user = User.builder()
                .nom(dto.getNom())
                .email(dto.getEmail())
                .motDePasse(dto.getMotDePasse())
                .role(dto.getRole())
                .build();
        return toDto(userRepository.save(user));
    }

    @Override
    public UserDto update(Long id, UserDto dto) {
        User user = getEntity(id);
        user.setNom(dto.getNom());
        user.setEmail(dto.getEmail());
        user.setMotDePasse(dto.getMotDePasse());
        user.setRole(dto.getRole());
        return toDto(userRepository.save(user));
    }

    @Override
    public void delete(Long id) {
        userRepository.delete(getEntity(id));
    }

    private User getEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable: " + id));
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .nom(user.getNom())
                .email(user.getEmail())
                .motDePasse(user.getMotDePasse())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
