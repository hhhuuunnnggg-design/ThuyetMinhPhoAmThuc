package com.example.demo.service;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.util.error.IdInvalidException;

public interface TTSAudioService {
    TTSAudio createTTSAudio(ReqTTSDTO request, byte[] audioData, String fileName, String createdBy)
            throws IOException;

    TTSAudio getTTSAudioById(Long id) throws IdInvalidException;

    Page<ResTTSAudioDTO> getAllTTSAudios(Specification<TTSAudio> spec, Pageable pageable);

    List<ResTTSAudioDTO> getTTSAudiosByUser(String createdBy);

    void deleteTTSAudio(Long id) throws IOException, IdInvalidException;

    TTSAudio updateTTSAudio(Long id, ReqTTSDTO request) throws IOException, IdInvalidException;
}
