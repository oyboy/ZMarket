package com.scammers.productservice.repositories;

import com.scammers.productservice.models.FileAttachment;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileAttachmentRepository extends CrudRepository<FileAttachment, String> {
    List<FileAttachment> findAllByProductId(String productId);

    @Modifying
    @Query("INSERT INTO file_attachment (object_key, product_id, file_name, content_type) VALUES (:key, :prodId, :name, :type)")
    void saveNew(@Param("key") String key,
                 @Param("prodId") String prodId,
                 @Param("name") String name,
                 @Param("type") String type);
}