package com.example.demo.domain.dto;

import lombok.Data;

/**
 * DTO cho kết quả phân trang
 */
@Data
public class ResultPaginationDTO {
    private Meta meta;
    private Object result;

    @Data
    public static class Meta {
        private int page;
        private int pageSize;
        private int pages;
        private long total;
    }
}
