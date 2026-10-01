package com.josvier.simplebank.demo;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.demo.DemoIdentity.DemoAccountPlan;
import com.josvier.simplebank.demo.DemoLedgerPlanner.PlannedMovement;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.AuditAction;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.AuditRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.audit.SecurityAudit;
import com.josvier.simplebank.service.AccountPrivacy;
import com.josvier.simplebank.security.audit.SecurityAuditAction;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
@Profile("demo")
@ConditionalOnProperty(name = "demo.seed.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    public static final String DATASET_VERSION = "product-spike-v1";
    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final List<String> COLLECTIONS = List.of(
            "users", "accounts", "transactions", "audits", "auth_users", "security_audits", "demo_seed_metadata");

    private final AuthUserRepository authUsers;
    private final UserRepository bankUsers;
    private final AccountRepository accounts;
    private final TransactionRepository transactions;
    private final AuditRepository audits;
    private final SecurityAuditRepository securityAudits;
    private final PasswordEncoder passwordEncoder;
    private final MongoTemplate mongo;
    private final DemoDatasetVerifier verifier;
    private final String databaseName;
    private final boolean reset;
    private final Path credentialsFile;

    public DemoDataSeeder(AuthUserRepository authUsers, UserRepository bankUsers, AccountRepository accounts,
                          TransactionRepository transactions, AuditRepository audits,
                          SecurityAuditRepository securityAudits, PasswordEncoder passwordEncoder,
                          MongoTemplate mongo, DemoDatasetVerifier verifier,
                          @Value("${spring.mongodb.database}") String databaseName,
                          @Value("${demo.seed.reset:false}") boolean reset,
                          @Value("${demo.seed.credentials-file}") String credentialsFile) {
        this.authUsers = authUsers;
        this.bankUsers = bankUsers;
        this.accounts = accounts;
        this.transactions = transactions;
        this.audits = audits;
        this.securityAudits = securityAudits;
        this.passwordEncoder = passwordEncoder;
        this.mongo = mongo;
        this.verifier = verifier;
        this.databaseName = databaseName;
        this.reset = reset;
        this.credentialsFile = Path.of(credentialsFile);
    }

    @Override
    public void run(ApplicationArguments args) {
        DemoSeedGuard.requireDemoDatabase(databaseName);
        List<DemoIdentity> identities = DemoCredentialsParser.parse(credentialsFile);
        if (reset) {
            COLLECTIONS.forEach(mongo::dropCollection);
        } else if (isComplete()) {
            verifier.verifyExisting();
            log.info("Demo dataset {} is already complete", DATASET_VERSION);
            return;
        } else if (!authUsers.findAll().isEmpty() || !bankUsers.findAll().isEmpty()) {
            throw new IllegalStateException("Demo dataset integrity error: records exist without a COMPLETE marker. Set DEMO_SEED_RESET=true to rebuild simple_bank_demo.");
        }
        LocalDateTime cursor = LocalDateTime.of(2026, 9, 1, 9, 0);
        List<AuthUser> staff = new ArrayList<>();
        for (DemoIdentity identity : identities) {
            if (!identity.staff()) continue;
            staff.add(saveAuth(identity, null, cursor));
            cursor = cursor.plusHours(2);
        }
        AuthUser admin = staff.stream().filter(user -> user.getPrimaryRole() == AuthRole.ADMIN).findFirst()
                .orElseThrow();
        List<String> tellers = staff.stream().filter(user -> user.getPrimaryRole() == AuthRole.TELLER)
                .map(AuthUser::getUsername).toList();
        List<String> tellerIds = staff.stream().filter(user -> user.getPrimaryRole() == AuthRole.TELLER)
                .map(AuthUser::getId).toList();
        List<String> managers = staff.stream().filter(user -> user.getPrimaryRole() == AuthRole.MANAGER)
                .map(AuthUser::getUsername).toList();
        List<String> managerIds = staff.stream().filter(user -> user.getPrimaryRole() == AuthRole.MANAGER)
                .map(AuthUser::getId).toList();
        int tellerTurn = 0;
        int managerTurn = 0;
        int accountSequence = 1;
        AuthUser firstCustomer = null;
        for (DemoIdentity identity : identities) {
            if (identity.staff()) continue;
            User customer = bankUsers.save(new User(identity.name(), identity.email(), cursor));
            AuthUser login = saveAuth(identity, customer.getId(), cursor);
            if (firstCustomer == null) firstCustomer = login;
            List<Account> owned = new ArrayList<>();
            for (DemoAccountPlan plan : identity.accounts()) {
                Account account = new Account(customer.getId(), plan.balance(), plan.type(), cursor);
                account.setAccountNumber(String.format("%012d", 100_000_000_000L + accountSequence));
                accountSequence++;
                owned.add(accounts.save(account));
                cursor = cursor.plusHours(3);
            }
            List<BigDecimal> targets = identity.accounts().stream().map(DemoAccountPlan::balance).toList();
            List<PlannedMovement> plan = DemoLedgerPlanner.plan(owned.size(), targets);
            Transaction pendingTransferOut = null;
            for (PlannedMovement movement : plan) {
                Account account = owned.get(movement.accountIndex());
                Transaction saved = new Transaction(account.getId(), movement.type(), movement.amount(), cursor);
                if (movement.transfer() && owned.size() > 1) {
                    Account other = owned.get(movement.accountIndex() == 0 ? 1 : 0);
                    saved.setCounterpartyAccountNumberMasked(AccountPrivacy.mask(other.getAccountNumber()));
                    saved.setCounterpartyDisplayName(AccountPrivacy.limitedName(customer.getName()));
                }
                saved = transactions.save(saved);
                if (movement.transfer() && movement.type() == TransactionType.WITHDRAW) {
                    pendingTransferOut = saved;
                } else if (movement.transfer()) {
                    String actor = managers.get(managerTurn % managers.size());
                    String actorId = managerIds.get(managerTurn % managerIds.size());
                    managerTurn++;
                    audits.save(new AuditRecord(AuditAction.TRANSFER, customer.getId(),
                            List.of(owned.get(0).getId(), owned.get(1).getId()),
                            List.of(customer.getId()), movement.amount(),
                            List.of(pendingTransferOut.getId(), saved.getId()),
                            cursor, actorId, actor));
                    pendingTransferOut = null;
                } else {
                    String actor = tellers.get(tellerTurn % tellers.size());
                    String actorId = tellerIds.get(tellerTurn % tellerIds.size());
                    tellerTurn++;
                    AuditAction action = movement.type() == TransactionType.DEPOSIT ? AuditAction.DEPOSIT : AuditAction.WITHDRAW;
                    audits.save(new AuditRecord(action, customer.getId(), List.of(account.getId()),
                            List.of(customer.getId()), movement.amount(), List.of(saved.getId()),
                            cursor, actorId, actor));
                }
                cursor = cursor.plusHours(1);
            }
            cursor = cursor.plusDays(1).withHour(9).withMinute(0);
        }
        securityAudits.save(new SecurityAudit(admin.getId(), admin.getUsername(), firstCustomer.getId(),
                SecurityAuditAction.CUSTOMER_LINKED, null, firstCustomer.getBankUserId(),
                LocalDateTime.of(2026, 9, 2, 11, 0)));
        AuthUser sampleTeller = staff.stream().filter(user -> user.getPrimaryRole() == AuthRole.TELLER).findFirst().orElseThrow();
        securityAudits.save(new SecurityAudit(admin.getId(), admin.getUsername(), sampleTeller.getId(),
                SecurityAuditAction.AUTH_USER_DISABLED, "true", "false", LocalDateTime.of(2026, 9, 3, 11, 0)));
        securityAudits.save(new SecurityAudit(admin.getId(), admin.getUsername(), sampleTeller.getId(),
                SecurityAuditAction.AUTH_USER_ENABLED, "false", "true", LocalDateTime.of(2026, 9, 3, 12, 0)));
        securityAudits.save(new SecurityAudit(admin.getId(), admin.getUsername(), sampleTeller.getId(),
                SecurityAuditAction.ROLE_CHANGED, "AUDITOR", "TELLER", LocalDateTime.of(2026, 9, 4, 11, 0)));
        verifier.verify();
        mongo.insert(new org.bson.Document("datasetVersion", DATASET_VERSION)
                .append("status", "COMPLETE")
                .append("createdAt", java.time.Instant.now().toString()), "demo_seed_metadata");
        log.info("Demo dataset {} is complete", DATASET_VERSION);
    }

    private boolean isComplete() {
        org.bson.Document marker = mongo.findOne(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("datasetVersion").is(DATASET_VERSION)
                                .and("status").is("COMPLETE")),
                org.bson.Document.class,
                "demo_seed_metadata");
        return marker != null;
    }

    private AuthUser saveAuth(DemoIdentity identity, String bankUserId, LocalDateTime createdAt) {
        return authUsers.save(new AuthUser(
                identity.username(), identity.email(), passwordEncoder.encode(identity.password()),
                Set.of(identity.role()), true, createdAt, bankUserId));
    }
}
