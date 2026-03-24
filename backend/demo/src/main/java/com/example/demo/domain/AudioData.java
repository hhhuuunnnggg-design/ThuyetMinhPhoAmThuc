package com.example.demo.domain;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AudioData implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(nullable = false)
    String fileName;

    @Column
    String s3Url;

    @Column(nullable = false)
    Long fileSize;

    @Column(nullable = false)
    String mimeType;
}
