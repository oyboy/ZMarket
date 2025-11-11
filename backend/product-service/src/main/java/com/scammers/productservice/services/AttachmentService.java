package com.scammers.productservice.services;

import com.scammers.productservice.models.FileAttachment;
import com.scammers.productservice.models.ProductDetails;
import com.scammers.productservice.repositories.ProductDetailsRepository;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {
    private final GridFsTemplate gridFsTemplate;
    private final ProductDetailsRepository productDetailsRepository;

    @Transactional
    public FileAttachment saveFileAttachment(MultipartFile file) throws IOException {
        log.info("Saving attachment: {}", file.getOriginalFilename());
        try (InputStream inputStream = file.getInputStream()) {
            ObjectId gridFsId = gridFsTemplate.store(inputStream, file.getOriginalFilename(), file.getContentType());

            FileAttachment attachment = new FileAttachment();
            attachment.setId(gridFsId.toHexString());
            attachment.setGridFsId(gridFsId.toHexString());
            attachment.setFileName(file.getOriginalFilename());
            attachment.setContentType(file.getContentType());
            return attachment;
        }
    }

    @Transactional
    public FileAttachment addAttachmentToProduct(String productId, MultipartFile file) throws IOException {
        FileAttachment attachment = saveFileAttachment(file);

        ProductDetails details = productDetailsRepository.findById(productId)
                .orElseGet(() -> {
                    ProductDetails d = new ProductDetails();
                    d.setProductId(productId);
                    d.setAttachments(new ArrayList<>());
                    return d;
                });

        details.getAttachments().add(attachment);
        if (details.getMainAttachmentId() == null) {
            details.setMainAttachmentId(attachment.getGridFsId());
        }

        productDetailsRepository.save(details);
        log.info("Attachment {} added to product {}", attachment.getGridFsId(), productId);
        return attachment;
    }

    @Transactional
    public void deleteAttachment(String productId, String gridFsId) {
        ProductDetails details = productDetailsRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product " + productId + " details not found"));

        FileAttachment toDelete = details.getAttachments() == null ? null :
                details.getAttachments().stream()
                        .filter(att -> gridFsId.equals(att.getGridFsId()) || gridFsId.equals(att.getId()))
                        .findFirst()
                        .orElseThrow(() -> new NotFoundException("Attachment " + gridFsId + " not found"));

        gridFsTemplate.delete(new Query(Criteria.where("_id").is(new ObjectId(toDelete.getGridFsId()))));

        List<FileAttachment> list = new ArrayList<>(details.getAttachments());
        list.removeIf(att -> gridFsId.equals(att.getGridFsId()) || gridFsId.equals(att.getId()));
        details.setAttachments(list);

        if (gridFsId.equals(details.getMainAttachmentId())) {
            String newMain = list.isEmpty() ? null : list.getFirst().getGridFsId();
            details.setMainAttachmentId(newMain);
        }

        productDetailsRepository.save(details);
        log.info("Deleted attachment {} for product {}", gridFsId, productId);
    }

    @Transactional
    public void setMainAttachment(String productId, String gridFsId) {
        ProductDetails details = productDetailsRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product " + productId + " details not found"));

        List<FileAttachment> list = new ArrayList<>(Optional.ofNullable(details.getAttachments())
                .orElseGet(ArrayList::new));

        if (list.isEmpty()) {
            throw new NotFoundException("No attachments for product " + productId);
        }

        int idx = IntStream.range(0, list.size())
                .filter(i -> gridFsId.equals(list.get(i).getGridFsId()) || gridFsId.equals(list.get(i).getId()))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Attachment " + gridFsId + " not found"));

        FileAttachment selected = list.remove(idx);
        list.addFirst(selected);
        details.setAttachments(list);

        details.setMainAttachmentId(selected.getGridFsId());

        productDetailsRepository.save(details);
        log.info("Set main attachment {} for product {}", selected.getGridFsId(), productId);
    }

    public List<FileAttachment> getAttachmentsForProduct(String productId) {
        return productDetailsRepository.findById(productId)
                .map(ProductDetails::getAttachments)
                .orElseGet(ArrayList::new);
    }

    public String getMainAttachmentId(String productId) {
        return productDetailsRepository.findById(productId)
                .map(ProductDetails::getMainAttachmentId)
                .orElse(null);
    }
}
