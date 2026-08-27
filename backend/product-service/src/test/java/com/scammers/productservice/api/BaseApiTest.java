package com.scammers.productservice.api;


import com.scammers.productservice.api.clients.ProductClient;
import com.scammers.productservice.api.clients.TestTokens;
import com.scammers.productservice.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.UUID;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class BaseApiTest extends AbstractIntegrationTest {

    @LocalServerPort
    protected int port;

    protected UUID sellerId;
    protected UUID otherSellerId;

    protected ProductClient asSeller;
    protected ProductClient asOtherSeller;
    protected ProductClient asBuyer;
    protected ProductClient anonymous;

    @BeforeEach
    void setUpApiClients() {
        ProductClient.configure(port);

        sellerId = UUID.randomUUID();
        otherSellerId = UUID.randomUUID();
        TestTokens.register(jwtDecoder, sellerId, otherSellerId);

        asSeller = ProductClient.withToken(TestTokens.SELLER_TOKEN);
        asOtherSeller = ProductClient.withToken(TestTokens.OTHER_SELLER_TOKEN);
        asBuyer = ProductClient.withToken(TestTokens.BUYER_TOKEN);
        anonymous = ProductClient.anonymous();
    }
}
