package com.josvier.simplebank.demo;

/**
 * Refuses demo seeding and reset against the normal bank database.
 */
public final class DemoSeedGuard {

    public static final String DEMO_DATABASE = "simple_bank_demo";
    public static final String NORMAL_DATABASE = "simple_bank";

    private DemoSeedGuard() {
    }

    public static void requireDemoDatabase(String databaseName) {
        if (databaseName == null || databaseName.isBlank() || NORMAL_DATABASE.equals(databaseName)) {
            throw new IllegalStateException("Demo seeding is refused for the normal database");
        }
        if (!DEMO_DATABASE.equals(databaseName)) {
            throw new IllegalStateException("Demo seeding only runs against " + DEMO_DATABASE);
        }
    }
}
