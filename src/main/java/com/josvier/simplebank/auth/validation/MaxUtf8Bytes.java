package com.josvier.simplebank.auth.validation;

import com.josvier.simplebank.auth.PasswordPolicyMessage;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Limits a string by UTF-8 byte length. {@code @Size} counts Java characters,
 * which is not the limit BCrypt uses.
 */
@Documented
@Constraint(validatedBy = MaxUtf8BytesValidator.class)
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MaxUtf8Bytes {

    int value();

    String message() default PasswordPolicyMessage.TOO_LONG;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
