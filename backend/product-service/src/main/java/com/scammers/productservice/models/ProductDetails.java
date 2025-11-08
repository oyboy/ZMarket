package com.scammers.productservice.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document
@Data
public class ProductDetails {
    @Id
    private String productId;
    private List<FileAttachment> attachments;
}
