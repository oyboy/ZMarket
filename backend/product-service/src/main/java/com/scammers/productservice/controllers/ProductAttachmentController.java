package com.scammers.productservice.controllers;

import com.scammers.productservice.models.FileAttachment;
import com.scammers.productservice.services.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductAttachmentController {
    private final AttachmentService attachmentService;
    private final GridFsTemplate gridFsTemplate;

    @GetMapping("/{productId}/attachments")
    public ResponseEntity<List<FileAttachment>> list(@PathVariable String productId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsForProduct(productId));
    }

    @PostMapping(value = "/{productId}/attachments", consumes = "multipart/form-data")
    public ResponseEntity<FileAttachment> uploadAttachment(@PathVariable String productId,
                                                           @RequestParam("file") MultipartFile file) throws IOException {
        FileAttachment meta = attachmentService.addAttachmentToProduct(productId, file);
        return ResponseEntity.ok(meta);
    }

    @PostMapping(value = "{productId}/attachments/{objectId}/main")
    public ResponseEntity<Void> setMainAttachment(@PathVariable String productId, @PathVariable String objectId){
        attachmentService.setMainAttachment(productId, objectId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{productId}/attachments/{objectId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable String productId, @PathVariable String objectId) {
        attachmentService.deleteAttachment(productId, objectId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{productId}/main-image-id")
    public ResponseEntity<String> mainImage(@PathVariable String productId) {
        String id = attachmentService.getMainAttachmentId(productId);
        return id != null ? ResponseEntity.ok(id) : ResponseEntity.noContent().build();
    }

    @GetMapping("/{gridFsId}/attachments-fs")
    public ResponseEntity<byte[]> getAttachment(@PathVariable String gridFsId) throws IOException {
        if (gridFsId == null || gridFsId.length() != 24) {
            return ResponseEntity.badRequest().build();
        }
        GridFsResource resource = gridFsTemplate.getResource(
                gridFsTemplate.findOne(Query.query(Criteria.where("_id").is(new ObjectId(gridFsId))))
        );
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        byte[] bytes = resource.getInputStream().readAllBytes();

        String ct = resource.getContentType();
        MediaType mediaType;
        try {
            mediaType = (!ct.isBlank())
                    ? MediaType.parseMediaType(ct)
                    : MediaType.APPLICATION_OCTET_STREAM;
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(bytes);
    }
}
