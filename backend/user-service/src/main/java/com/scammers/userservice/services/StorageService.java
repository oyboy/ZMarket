package com.scammers.userservice.services;

import io.minio.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {
    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.external-url}")
    private String externalUrl;

    public String uploadAvatar(UUID userId, MultipartFile file) {
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }

            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String fileName = userId + "/" + UUID.randomUUID() + "." + extension;

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());

            return fileName;

        } catch (Exception e) {
            log.error("Ошибка загрузки файла", e);
            throw new RuntimeException("Не удалось загрузить аватар", e);
        }
    }

    public void deleteFile(String fileUrl) {
        try {
            String objectName = fileUrl.replace(externalUrl + "/" + bucketName + "/", "");

            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build());
        } catch (Exception e) {
            log.warn("Ошибка удаления аватара продавца: {}", fileUrl, e);
        }
    }

    public String getPublicUrl(String objectName) {
        return String.format("%s/%s/%s", externalUrl, bucketName, objectName);
    }
}