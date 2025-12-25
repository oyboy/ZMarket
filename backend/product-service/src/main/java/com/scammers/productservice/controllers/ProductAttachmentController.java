package com.scammers.productservice.controllers;

import com.scammers.productservice.models.FileAttachment;
import com.scammers.productservice.services.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductAttachmentController {
    private final AttachmentService attachmentService;

    @GetMapping("/{productId}/attachments")
    public ResponseEntity<List<FileAttachment>> list(@PathVariable String productId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsForProduct(productId));
    }

    @PostMapping(value = "/{productId}/attachments", consumes = "multipart/form-data")
    public ResponseEntity<FileAttachment> uploadAttachment(@PathVariable String productId,
                                                           @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attachmentService.addAttachmentToProduct(productId, file));
    }

    @PostMapping("/{productId}/attachments/main")
    public ResponseEntity<Void> setMainAttachment(@PathVariable String productId,
                                                  @RequestParam("key") String objectKey) {
        attachmentService.setMainAttachment(productId, objectKey);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{productId}/attachments")
    public ResponseEntity<Void> deleteAttachment(@PathVariable String productId,
                                                 @RequestParam("key") String objectKey) {
        attachmentService.deleteAttachment(productId, objectKey);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{productId}/main-image-id")
    public ResponseEntity<String> mainImage(@PathVariable String productId) {
        String key = attachmentService.getMainAttachmentKey(productId);
        return key != null ? ResponseEntity.ok(key) : ResponseEntity.noContent().build();
    }

    @GetMapping("/attachments/download")
    public ResponseEntity<byte[]> getAttachment(@RequestParam("key") String objectKey) {
        byte[] data = attachmentService.getAttachmentBytes(objectKey);
        return ResponseEntity.ok(data);
    }
}