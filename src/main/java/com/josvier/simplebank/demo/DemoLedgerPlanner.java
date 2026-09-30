package com.josvier.simplebank.demo;

import com.josvier.simplebank.model.TransactionType;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Builds a deposit and a withdrawal whose net is the requested balance.
 * Two-account customers also get a transfer pair that nets to zero.
 */
public final class DemoLedgerPlanner {

    public static final BigDecimal SWING = new BigDecimal("200.00");
    public static final BigDecimal TRANSFER = new BigDecimal("50.00");

    private DemoLedgerPlanner() {
    }

    public record PlannedMovement(int accountIndex, TransactionType type, BigDecimal amount, boolean transfer) {
    }

    public static List<PlannedMovement> plan(int accountCount, List<BigDecimal> targets) {
        List<PlannedMovement> movements = new ArrayList<>();
        for (int index = 0; index < accountCount; index++) {
            BigDecimal target = targets.get(index);
            movements.add(new PlannedMovement(index, TransactionType.DEPOSIT, target.add(SWING), false));
            movements.add(new PlannedMovement(index, TransactionType.WITHDRAW, SWING, false));
        }
        if (accountCount > 1) {
            movements.add(new PlannedMovement(0, TransactionType.WITHDRAW, TRANSFER, true));
            movements.add(new PlannedMovement(1, TransactionType.DEPOSIT, TRANSFER, true));
            movements.add(new PlannedMovement(1, TransactionType.WITHDRAW, TRANSFER, true));
            movements.add(new PlannedMovement(0, TransactionType.DEPOSIT, TRANSFER, true));
        }
        return List.copyOf(movements);
    }

    public static BigDecimal net(List<PlannedMovement> movements, int accountIndex) {
        BigDecimal total = BigDecimal.ZERO;
        for (PlannedMovement movement : movements) {
            if (movement.accountIndex() != accountIndex) continue;
            total = movement.type() == TransactionType.DEPOSIT
                    ? total.add(movement.amount())
                    : total.subtract(movement.amount());
        }
        return total;
    }
}
