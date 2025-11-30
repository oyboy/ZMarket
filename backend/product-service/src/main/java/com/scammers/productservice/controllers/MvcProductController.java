package com.scammers.productservice.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
public class MvcProductController {
    @GetMapping(value = { "/", "/product/**" })
    public String forward() {
        return "forward:/index.html";
    }
}
