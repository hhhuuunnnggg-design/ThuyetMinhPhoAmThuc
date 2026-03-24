package com.example.demo.service;

import java.io.IOException;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.request.tts.ReqUpdateTTSAudioGroupDTO;
import com.example.demo.domain.response.tts.ResAudioDataDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioGroupDTO;
import com.example.demo.util.error.IdInvalidException;

public interface TTSAudioService {

        // ============ READ — TTSAudio (chỉ xem) ============
        ResTTSAudioDTO getTTSAudioById(Long id) throws IdInvalidException;

        Page<ResTTSAudioDTO> getAllTTSAudios(Pageable pageable);

        // ============ Group CRUD ============
        ResTTSAudioGroupDTO createGroup(ReqTTSDTO request) throws IOException;

        ResTTSAudioGroupDTO getGroupById(Long id) throws IdInvalidException;

        ResTTSAudioGroupDTO getGroupByKey(String groupKey) throws IdInvalidException;

        Page<ResTTSAudioGroupDTO> getAllGroups(Pageable pageable);

        ResTTSAudioGroupDTO updateGroup(Long id, ReqUpdateTTSAudioGroupDTO request) throws IdInvalidException;

        void deleteGroup(Long id) throws IOException, IdInvalidException;

        // ============ Audio File ============
        Resource getAudioResource(String groupKey, String languageCode) throws IdInvalidException;

        Map<String, ResAudioDataDTO> generateMultilingualAudio(Long groupId) throws IOException, IdInvalidException;

        // ============ Helpers ============
        void deleteAudioFile(String fileName) throws IOException;

        Resource getImageResource(String fileName) throws IOException;
}
