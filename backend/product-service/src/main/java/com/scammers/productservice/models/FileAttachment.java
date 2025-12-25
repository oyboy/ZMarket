package com.scammers.productservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table
public class FileAttachment {
    @Id
    private String objectKey;
    private String productId;
    private String fileName;
    private String contentType;
}