package com.josvier.simplebank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Simple Bank REST API.
 *
 * This phase keeps all data in memory so the layered design can be learned
 * before a later branch introduces MySQL and Spring Data JPA.
 */
@SpringBootApplication
public class SimpleBankApplication {

    public static void main(String[] args) {
        SpringApplication.run(SimpleBankApplication.class, args);
    }
}
