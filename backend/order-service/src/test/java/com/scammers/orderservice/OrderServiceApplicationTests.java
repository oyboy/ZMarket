package com.scammers.orderservice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static com.scammers.orderservice.InfrastructureContainer.getGatewayUrl;
import static com.scammers.orderservice.InfrastructureContainer.getOrderServiceUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class OrderServiceApplicationTests extends AbstractIntegrationTest{
    @Test
    public void testOrderServiceDirectAccess() {
        String orderServiceUrl = getOrderServiceUrl() + "/private";

        auth.authorizedRequest()
                .get(orderServiceUrl)
                .then()
                .statusCode(200);
    }

    @Test
    public void testThroughGateway() {
        String gatewayOrderUrl = getGatewayUrl() + "/orderservice/private";

        auth.authorizedRequest()
                .get(gatewayOrderUrl)
                .then()
                .statusCode(200);
    }
}
