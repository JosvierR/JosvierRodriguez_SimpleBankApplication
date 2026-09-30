package com.josvier.simplebank.demo;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DemoLedgerPlannerTest {

    @Test
    void movementsReconcileToRequestedBalances() {
        List<BigDecimal> targets = List.of(new BigDecimal("3200.00"), new BigDecimal("12000.00"));
        var movements = DemoLedgerPlanner.plan(2, targets);
        assertEquals(0, DemoLedgerPlanner.net(movements, 0).compareTo(targets.get(0)));
        assertEquals(0, DemoLedgerPlanner.net(movements, 1).compareTo(targets.get(1)));
    }

    @Test
    void singleAccountStillReconciles() {
        List<BigDecimal> targets = List.of(new BigDecimal("1850.00"));
        var movements = DemoLedgerPlanner.plan(1, targets);
        assertEquals(0, DemoLedgerPlanner.net(movements, 0).compareTo(targets.get(0)));
    }
}
