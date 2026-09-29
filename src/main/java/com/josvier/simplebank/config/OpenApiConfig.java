package com.josvier.simplebank.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadata shown at the top of Swagger UI.
 *
 * Springdoc discovers the controllers on its own. This bean only sets the
 * title and description of the generated OpenAPI document.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI simpleBankOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Simple Bank API")
                        .description("Bank API persisted in MongoDB Atlas. Identifiers are ObjectId strings. "
                                + "Create a user, open an account, then deposit, withdraw, and read history.")
                        .version("0.0.1"));
    }
}
