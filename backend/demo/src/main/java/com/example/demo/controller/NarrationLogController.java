package com.example.demo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.dto.ResultPaginationDTO;
import com.example.demo.domain.response.app.ResNarrationLogDTO;
import com.example.demo.service.NarrationService;
import com.example.demo.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1/admin/narration-logs")
public class NarrationLogController {

    private final NarrationService narrationService;

    public NarrationLogController(NarrationService narrationService) {
        this.narrationService = narrationService;
    }

    @GetMapping
    @ApiMessage("Lấy danh sách narration logs")
    public ResponseEntity<ResultPaginationDTO> getAllLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page - 1, size);
        Page<ResNarrationLogDTO> result = narrationService.getAllLogs(pageable);

        ResultPaginationDTO response = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(result.getNumber() + 1);
        meta.setPageSize(result.getSize());
        meta.setPages(result.getTotalPages());
        meta.setTotal(result.getTotalElements());
        response.setMeta(meta);
        response.setResult(result.getContent());

        return ResponseEntity.ok(response);
    }
}
