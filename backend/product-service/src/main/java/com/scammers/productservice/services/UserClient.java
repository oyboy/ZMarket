package com.scammers.productservice.services;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "auth-service", url = "")
public interface UserClient {

    @GetMapping("/sellers/{uuid}")
    Boolean exists(@PathVariable("uuid") UUID sellerid);
}