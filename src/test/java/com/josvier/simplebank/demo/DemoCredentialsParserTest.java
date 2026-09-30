package com.josvier.simplebank.demo;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DemoCredentialsParserTest {

    @Test
    void publishedFileHasTwentyIdentitiesAndExpectedRoles() {
        List<DemoIdentity> identities = DemoCredentialsParser.parse(Path.of("docs/demo-credentials.txt"));
        assertEquals(20, identities.size());
        assertEquals(1, identities.stream().filter(item -> item.role().name().equals("ADMIN")).count());
        assertEquals(2, identities.stream().filter(item -> item.role().name().equals("MANAGER")).count());
        assertEquals(3, identities.stream().filter(item -> item.role().name().equals("TELLER")).count());
        assertEquals(2, identities.stream().filter(item -> item.role().name().equals("AUDITOR")).count());
        assertEquals(12, identities.stream().filter(item -> item.role().name().equals("CUSTOMER")).count());
        assertTrue(identities.stream().filter(DemoIdentity::staff).allMatch(item -> item.accounts().isEmpty()));
        assertTrue(identities.stream().filter(item -> !item.staff()).allMatch(item -> !item.accounts().isEmpty()));
        assertEquals(21, identities.stream().mapToInt(item -> item.accounts().size()).sum());
    }

    @Test
    void malformedFileIsRejected() {
        assertThrows(IllegalStateException.class, () -> DemoCredentialsParser.parse(List.of("ADMIN | Only | Five | Fields | Here")));
    }
}
