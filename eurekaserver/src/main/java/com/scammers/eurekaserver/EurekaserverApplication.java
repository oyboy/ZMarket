package com.scammers.eurekaserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaserverApplication {
    //Start before Spring Config
    public static void main(String[] args) {
        SpringApplication.run(EurekaserverApplication.class, args);
    }

}
