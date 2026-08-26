package com.scammers.recservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableFeignClients
@EnableScheduling
@SpringBootApplication(scanBasePackages = {
        "com.scammers.recservice",
        "com.scammers.commonresilience"
})
public class RecServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecServiceApplication.class, args);
    }

}
