package com.scammers.productservice.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Table;

import java.util.ArrayList;
import java.util.List;


@Data
@Table
public class ProductDetails {
    @Id
    private String productId;

    private String mainAttachmentKey;

    @Transient
    private List<FileAttachment> attachments = new ArrayList<>();
}