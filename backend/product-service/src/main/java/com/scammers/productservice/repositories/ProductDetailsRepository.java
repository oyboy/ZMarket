package com.scammers.productservice.repositories;

import com.scammers.productservice.models.ProductDetails;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductDetailsRepository extends CrudRepository<ProductDetails, String> {
    @Modifying
    @Query("INSERT INTO product_details (product_id, main_attachment_key) VALUES (:id, :mainKey)")
    void saveNew(@Param("id") String id, @Param("mainKey") String mainKey);
}