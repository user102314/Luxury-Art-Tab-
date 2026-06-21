package com.luxart.ecommerce.service.impl;

import com.luxart.ecommerce.dto.AIAdvisorDto;
import com.luxart.ecommerce.exception.ResourceNotFoundException;
import com.luxart.ecommerce.model.entity.AIAdvisor;
import com.luxart.ecommerce.repository.AIAdvisorRepository;
import com.luxart.ecommerce.service.AIAdvisorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AIAdvisorServiceImpl implements AIAdvisorService {

    private final AIAdvisorRepository aiAdvisorRepository;

    @Override
    public List<AIAdvisorDto> findAll() {
        return aiAdvisorRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public AIAdvisorDto findById(Long id) {
        return toDto(getEntity(id));
    }

    @Override
    public AIAdvisorDto create(AIAdvisorDto dto) {
        AIAdvisor advisor = AIAdvisor.builder()
                .modelName(dto.getModelName())
                .context(dto.getContext())
                .historique(dto.getHistorique())
                .build();
        return toDto(aiAdvisorRepository.save(advisor));
    }

    @Override
    public AIAdvisorDto update(Long id, AIAdvisorDto dto) {
        AIAdvisor advisor = getEntity(id);
        advisor.setModelName(dto.getModelName());
        advisor.setContext(dto.getContext());
        advisor.setHistorique(dto.getHistorique());
        return toDto(aiAdvisorRepository.save(advisor));
    }

    @Override
    public void delete(Long id) {
        aiAdvisorRepository.delete(getEntity(id));
    }

    private AIAdvisor getEntity(Long id) {
        return aiAdvisorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conseiller IA introuvable: " + id));
    }

    private AIAdvisorDto toDto(AIAdvisor advisor) {
        return AIAdvisorDto.builder()
                .id(advisor.getId())
                .modelName(advisor.getModelName())
                .context(advisor.getContext())
                .historique(advisor.getHistorique())
                .build();
    }
}
