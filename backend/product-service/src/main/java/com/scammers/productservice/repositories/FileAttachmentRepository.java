package com.scammers.productservice.repositories;

import com.scammers.productservice.models.FileAttachment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FileAttachmentRepository extends MongoRepository<FileAttachment, String> {
}