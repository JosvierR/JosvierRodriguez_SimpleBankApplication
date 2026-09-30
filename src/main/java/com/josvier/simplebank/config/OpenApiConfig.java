package com.josvier.simplebank.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadata and bearer scheme shown in Swagger UI.
 *
 * Banking operations inherit the bearer requirement. Register and login opt out
 * with an empty {@code @SecurityRequirements} on those methods.
 */
@Configuration
public class OpenApiConfig {

    public static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI simpleBankOpenApi() {
        SecurityScheme bearer = new SecurityScheme()
                .name(BEARER_SCHEME)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Access token from POST /api/auth/login. Send Authorization: Bearer <token>.");
        return new OpenAPI()
                .info(new Info()
                        .title("Simple Bank API")
                        .description("Bank API persisted in MongoDB Atlas. Identifiers are ObjectId strings. "
                                + "Register and login issue a bearer token. Bank customers in users are separate "
                                + "from API logins in auth_users. A bearer token proves the caller may use the API. "
                                + "It does not mean that caller owns a particular bank account. "
                                + "Audit userId is the bank customer. actorUsername is the API login. "
                                + "GET /api/admin/whoami requires role ADMIN. "
                                + "Create a customer, open an account, then deposit, withdraw, and read history.")
                        .version("0.0.1"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME, bearer));
    }
}
