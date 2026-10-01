package com.josvier.simplebank.demo;

import com.josvier.simplebank.demo.DemoLedgerPlanner.PlannedMovement;
import com.josvier.simplebank.model.TransactionType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DemoDatasetPlanTest {

    @Test
    void productSpikePlanMatchesDocumentedCounts() {
        List<DemoIdentity> identities = DemoCredentialsParser.parse(Path.of("docs/demo-credentials.txt"));
        int transactions = 0;
        int audits = 0;
        for (DemoIdentity identity : identities) {
            if (identity.staff()) continue;
            List<BigDecimal> targets = identity.accounts().stream().map(plan -> plan.balance()).toList();
            List<PlannedMovement> movements = DemoLedgerPlanner.plan(identity.accounts().size(), targets);
            transactions += movements.size();
            for (PlannedMovement movement : movements) {
                if (!(movement.transfer() && movement.type() == TransactionType.WITHDRAW)) audits++;
            }
        }
        assertEquals(DemoDatasetVerifier.TRANSACTIONS, transactions);
        assertEquals(DemoDatasetVerifier.BANK_AUDITS, audits);
        assertEquals(4, DemoDatasetVerifier.SECURITY_AUDITS);
    }
}
