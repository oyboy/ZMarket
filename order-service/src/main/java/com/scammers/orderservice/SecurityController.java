package com.scammers.orderservice;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SecurityController {
    @GetMapping("/public")
    public String getPublic() {
        return "this is public method";
    }
    @GetMapping("/private")
    public String getPrivate() {
        return "this is private method";
    }
}
