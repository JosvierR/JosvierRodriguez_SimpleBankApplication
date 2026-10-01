package com.josvier.simplebank.demo;

import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.auth.model.AuthUser;
import com.josvier.simplebank.auth.repository.AuthUserRepository;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.AuditRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.audit.SecurityAuditRepository;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Checks the product-spike-v1 demo dataset after seeding and on every later startup.
 */
@Component
public class DemoDatasetVerifier {

    public static final String DATASET_VERSION = "product-spike-v1";
    public static final int AUTH_USERS = 20;
    public static final int BANK_USERS = 12;
    public static final int ACCOUNTS = 21;
    public static final int TRANSACTIONS = 78;
    public static final int BANK_AUDITS = 60;
    public static final int SECURITY_AUDITS = 4;
    private static final Pattern BCRYPT = Pattern.compile("^\\$2[aby]\\$\\d{2}\\$.{53}$");

    private final AuthUserRepository authUsers;
    private final UserRepository bankUsers;
    private final AccountRepository accounts;
    private final TransactionRepository transactions;
    private final AuditRepository audits;
    private final SecurityAuditRepository securityAudits;
    private final MongoTemplate mongo;

    public DemoDatasetVerifier(AuthUserRepository authUsers, UserRepository bankUsers, AccountRepository accounts,
                               TransactionRepository transactions, AuditRepository audits,
                               SecurityAuditRepository securityAudits, MongoTemplate mongo) {
        this.authUsers = authUsers;
        this.bankUsers = bankUsers;
        this.accounts = accounts;
        this.transactions = transactions;
        this.audits = audits;
        this.securityAudits = securityAudits;
        this.mongo = mongo;
    }

    public void verify() {
        List<AuthUser> logins = authUsers.findAll();
        require(logins.size() == AUTH_USERS, "expected " + AUTH_USERS + " auth users but found " + logins.size());
        require(count(logins, AuthRole.ADMIN) == 1, "expected 1 ADMIN");
        require(count(logins, AuthRole.MANAGER) == 2, "expected 2 MANAGER");
        require(count(logins, AuthRole.TELLER) == 3, "expected 3 TELLER");
        require(count(logins, AuthRole.AUDITOR) == 2, "expected 2 AUDITOR");
        require(count(logins, AuthRole.CUSTOMER) == 12, "expected 12 CUSTOMER");
        require(bankUsers.findAll().size() == BANK_USERS, "expected " + BANK_USERS + " bank customers");
        List<Account> storedAccounts = accounts.findAll();
        require(storedAccounts.size() == ACCOUNTS, "expected " + ACCOUNTS + " accounts but found " + storedAccounts.size());
        require(unique(logins.stream().map(AuthUser::getUsername).toList()), "duplicate demo usernames");
        require(unique(logins.stream().map(AuthUser::getEmail).toList()), "duplicate demo emails");
        long linkedCustomers = logins.stream().filter(user -> user.getPrimaryRole() == AuthRole.CUSTOMER && user.getBankUserId() != null).count();
        long unlinkedStaff = logins.stream().filter(user -> user.getPrimaryRole() != AuthRole.CUSTOMER && user.getBankUserId() == null).count();
        require(linkedCustomers == 12, "expected 12 linked customers");
        require(unlinkedStaff == 8, "expected 8 unlinked staff identities");
        int transactionCount = 0;
        for (Account account : storedAccounts) {
            List<Transaction> history = transactions.findByAccountId(account.getId());
            transactionCount += history.size();
            BigDecimal net = BigDecimal.ZERO;
            for (Transaction transaction : history) {
                net = transaction.getType() == TransactionType.DEPOSIT ? net.add(transaction.getAmount()) : net.subtract(transaction.getAmount());
            }
            require(net.compareTo(account.getBalance()) == 0, "account balance does not reconcile");
        }
        require(transactionCount == TRANSACTIONS, "expected " + TRANSACTIONS + " transactions but found " + transactionCount);
        require(audits.findAll().size() == BANK_AUDITS, "expected " + BANK_AUDITS + " banking audits");
        require(securityAudits.findAll().size() == SECURITY_AUDITS, "expected " + SECURITY_AUDITS + " security audits");
        for (Document document : mongo.findAll(Document.class, "auth_users")) {
            require(!document.containsKey("password") && !document.containsKey("plaintextPassword"), "plaintext password field is stored");
            String hash = document.getString("passwordHash");
            require(hash != null && BCRYPT.matcher(hash).matches(), "password hash is not BCrypt");
            require(!document.toJson().contains("Demo!"), "plaintext demo password is stored");
        }
    }

    private static long count(List<AuthUser> users, AuthRole role) {
        return users.stream().filter(user -> user.getPrimaryRole() == role).count();
    }

    private static boolean unique(List<String> values) {
        return new HashSet<>(values).size() == values.size();
    }

    private static void require(boolean condition, String message) {
        if (!condition) {
            throw new IllegalStateException("Demo dataset integrity error: " + message);
        }
    }
}
