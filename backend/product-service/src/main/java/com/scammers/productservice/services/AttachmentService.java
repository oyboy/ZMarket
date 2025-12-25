package com.scammers.productservice.services;

import com.scammers.productservice.models.FileAttachment;
import com.scammers.productservice.models.ProductDetails;
import com.scammers.productservice.repositories.FileAttachmentRepository;
import com.scammers.productservice.repositories.ProductDetailsRepository;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {
    private final MinioClient minioClient;
    private final ProductDetailsRepository productRepo;
    private final FileAttachmentRepository attachmentRepo;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Transactional
    public FileAttachment addAttachmentToProduct(String productId, MultipartFile file) {
        ensureBucket();

        try {
            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String objectKey = productId + "/" + UUID.randomUUID() + (extension != null ? "." + extension : "");

            attachmentRepo.saveNew(objectKey, productId, file.getOriginalFilename(), file.getContentType());

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            FileAttachment attachment = new FileAttachment(objectKey, productId, file.getOriginalFilename(), file.getContentType());

            ProductDetails details = productRepo.findById(productId).orElse(null);

            if (details == null) {
                productRepo.saveNew(productId, objectKey);
            } else {
                if (details.getMainAttachmentKey() == null) {
                    details.setMainAttachmentKey(objectKey);
                    productRepo.save(details);
                }
            }

            return attachment;

        } catch (Exception e) {
            log.error("Error uploading file", e);
            throw new RuntimeException("Upload failed", e);
        }
    }

    @Transactional
    public void deleteAttachment(String productId, String objectKey) {
        if (attachmentRepo.existsById(objectKey)) {
            attachmentRepo.deleteById(objectKey);
        }

        ProductDetails details = productRepo.findById(productId).orElse(null);
        if (details != null && objectKey.equals(details.getMainAttachmentKey())) {
            List<FileAttachment> others = attachmentRepo.findAllByProductId(productId);
            details.setMainAttachmentKey(others.isEmpty() ? null : others.get(0).getObjectKey());
            productRepo.save(details);
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );
        } catch (Exception e) {
            log.warn("Error deleting from MinIO: {}", objectKey, e);
        }
    }

    @Transactional
    public void setMainAttachment(String productId, String objectKey) {
        ProductDetails details = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        FileAttachment attachment = attachmentRepo.findById(objectKey)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        if (!attachment.getProductId().equals(productId)) {
            throw new RuntimeException("Image belongs to another product");
        }

        details.setMainAttachmentKey(objectKey);
        productRepo.save(details);
    }

    public List<FileAttachment> getAttachmentsForProduct(String productId) {
        return attachmentRepo.findAllByProductId(productId);
    }

    public String getMainAttachmentKey(String productId) {
        return productRepo.findById(productId)
                .map(ProductDetails::getMainAttachmentKey)
                .orElse(null);
    }

    public byte[] getAttachmentBytes(String objectKey) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectKey)
                        .build())) {
            return stream.readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException("Download failed", e);
        }
    }

    private void ensureBucket() {
        try {
            if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build())) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
        } catch (Exception e) {
            throw new RuntimeException("MinIO bucket check failed", e);
        }
    }
}