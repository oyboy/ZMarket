package com.scammers.productservice.models;

import lombok.Data;
import org.springframework.data.annotation.Id;

import java.time.LocalDateTime;

@Data
public class FileAttachment {
    @Id
    private String id;
    private String fileName;
    private byte[] bytes;
    private LocalDateTime uploadedAt;
}