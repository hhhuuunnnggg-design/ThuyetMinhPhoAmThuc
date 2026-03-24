package com.example.demo.service;

import java.io.IOException;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.demo.domain.TTSAudio;
import com.example.demo.domain.request.tts.ReqTTSDTO;
import com.example.demo.domain.request.tts.ReqUpdateTTSAudioGroupDTO;
import com.example.demo.domain.response.tts.ResMultilingualAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioDTO;
import com.example.demo.domain.response.tts.ResTTSAudioGroupDTO;
import com.example.demo.util.error.IdInvalidException;

public interface TTSAudioService {
        TTSAudio createTTSAudio(ReqTTSDTO request, byte[] audioData, String fileName, String createdBy)
                        throws IOException;

        TTSAudio getTTSAudioById(Long id) throws IdInvalidException;

        Page<ResTTSAudioDTO> getAllTTSAudios(Specification<TTSAudio> spec, Pageable pageable);

        List<ResTTSAudioDTO> getTTSAudiosByUser(String createdBy);

        void deleteTTSAudio(Long id) throws IOException, IdInvalidException;

        TTSAudio updateTTSAudio(Long id, ReqTTSDTO request) throws IOException, IdInvalidException;

        TTSAudio updateTTSAudioWithNewFile(Long id, ReqTTSDTO request, byte[] audioData, String fileName)
                        throws IOException, IdInvalidException;

        void deleteTTSAudioFileFromS3(String fileName) throws IOException;

        Resource getAudioResourceFromS3(String fileName) throws IOException;

        Resource getImageResourceFromS3(String fileName) throws IOException;

        // ============ Multi-language ============
        ResMultilingualAudioDTO createMultilingualAudio(ReqTTSDTO request) throws IOException;

        /**
         * Tạo audio đa ngôn ngữ cho một audio tiếng Việt đã tồn tại.
         * Audio tiếng Việt và multilingual sẽ cùng một group.
         * @param viAudio Audio tiếng Việt đã được save (có group được gán)
         */
        ResMultilingualAudioDTO createMultilingualForExisting(TTSAudio viAudio, ReqTTSDTO request);

        ResTTSAudioGroupDTO getGroupById(Long id) throws IdInvalidException;

        ResTTSAudioGroupDTO getGroupByKey(String groupKey) throws IdInvalidException;

        // ============ Group CRUD ============
        Page<ResTTSAudioGroupDTO> getAllGroups(Pageable pageable);

        void deleteGroup(Long id) throws IOException, IdInvalidException;

        ResMultilingualAudioDTO generateMultilingualForGroup(Long groupId) throws IOException, IdInvalidException;

        ResTTSAudioGroupDTO updateGroup(Long id, ReqUpdateTTSAudioGroupDTO request) throws IdInvalidException;
}
