package com.josvier.simplebank.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DemoSeedGuardTest {

    @Test
    void normalDatabaseIsRefused() {
        assertThrows(IllegalStateException.class, () -> DemoSeedGuard.requireDemoDatabase("simple_bank"));
        assertThrows(IllegalStateException.class, () -> DemoSeedGuard.requireDemoDatabase(" "));
    }

    @Test
    void onlyTheDemoDatabaseIsAccepted() {
        DemoSeedGuard.requireDemoDatabase("simple_bank_demo");
    }

    @Test
    void seederIsLimitedToTheDemoProfile() {
        Profile profile = DemoDataSeeder.class.getAnnotation(Profile.class);
        ConditionalOnProperty property = DemoDataSeeder.class.getAnnotation(ConditionalOnProperty.class);
        assertEquals("demo", profile.value()[0]);
        assertEquals("demo.seed.enabled", property.name()[0]);
        assertEquals("true", property.havingValue());
    }
}
