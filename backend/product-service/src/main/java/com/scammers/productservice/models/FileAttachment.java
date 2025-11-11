package com.scammers.productservice.models;

import lombok.Data;

@Data
public class FileAttachment {
    private String id;
    private String gridFsId;
    private String fileName;
    private String contentType;
}