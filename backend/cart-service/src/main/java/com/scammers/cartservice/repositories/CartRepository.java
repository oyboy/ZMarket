package com.scammers.cartservice.repositories;

import com.scammers.cartservice.models.CartEntity;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
@Repository
public interface CartRepository extends CrudRepository<CartEntity, UUID> {
}
