package com.example.demo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.demo.domain.request.admin.ReqUpsertPOIDTO;
import com.example.demo.domain.response.admin.ResAdminPOIDTO;
import com.example.demo.util.error.IdInvalidException;

public interface POIService {

    Page<ResAdminPOIDTO> getAllPOIs(Pageable pageable);

    ResAdminPOIDTO getPOIById(Long id) throws IdInvalidException;

    ResAdminPOIDTO createPOI(ReqUpsertPOIDTO req) throws IdInvalidException;

    ResAdminPOIDTO updatePOI(Long id, ReqUpsertPOIDTO req) throws IdInvalidException;

    void deletePOI(Long id) throws IdInvalidException;
}
