package com.josvier.simplebank.service;

import com.josvier.simplebank.dto.request.CustomerTransferRequest;
import com.josvier.simplebank.dto.response.AuditResponse;
import com.josvier.simplebank.dto.response.CustomerTransferReceiptResponse;
import com.josvier.simplebank.dto.response.TransferPreviewResponse;
import com.josvier.simplebank.exception.InvalidTransactionException;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.Account;
import com.josvier.simplebank.model.AccountType;
import com.josvier.simplebank.model.AuditAction;
import com.josvier.simplebank.model.AuditRecord;
import com.josvier.simplebank.model.Transaction;
import com.josvier.simplebank.model.TransactionType;
import com.josvier.simplebank.model.User;
import com.josvier.simplebank.repository.AccountRepository;
import com.josvier.simplebank.repository.TransactionRepository;
import com.josvier.simplebank.repository.UserRepository;
import com.josvier.simplebank.security.actor.CurrentActor;
import com.josvier.simplebank.security.actor.CurrentActorProvider;
import com.josvier.simplebank.auth.model.AuthRole;
import com.josvier.simplebank.service.impl.AccountServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerInternalTransferTest {

    private static final String CUSTOMER_A = "68dc1234567890abcdef0001";
    private static final String CUSTOMER_B = "68dc1234567890abcdef0002";
    private static final String ACCOUNT_A = "68dc1234567890abcdef0011";
    private static final String ACCOUNT_B = "68dc1234567890abcdef0021";

    @Mock private AccountRepository accountRepository;
    @Mock private UserRepository userRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private com.josvier.simplebank.service.AuditService auditService;
    @Mock private CurrentActorProvider currentActorProvider;

    private AccountService accountService;
    private Account source;
    private Account destination;

    @BeforeEach
    void setUp() {
        accountService = new AccountServiceImpl(
                accountRepository, userRepository, transactionRepository, auditService, currentActorProvider);
        lenient().when(currentActorProvider.current()).thenReturn(
                new CurrentActor("68dc1234567890abcdef0101", "sofia.rivera", AuthRole.CUSTOMER, CUSTOMER_A));
        source = account(ACCOUNT_A, CUSTOMER_A, "500.00", "100000000231");
        destination = account(ACCOUNT_B, CUSTOMER_B, "80.00", "200045761982");
        lenient().when(userRepository.findById(CUSTOMER_A)).thenReturn(Optional.of(user(CUSTOMER_A, "Sofia Rivera")));
        lenient().when(userRepository.findById(CUSTOMER_B)).thenReturn(Optional.of(user(CUSTOMER_B, "Ethan Parker")));
        lenient().when(accountRepository.findByIdAndUserId(ACCOUNT_A, CUSTOMER_A)).thenReturn(Optional.of(source));
        lenient().when(accountRepository.findByAccountNumber("200045761982")).thenReturn(Optional.of(destination));
        lenient().when(accountRepository.findByAccountNumber("100000000231")).thenReturn(Optional.of(source));
        lenient().when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(auditService.record(any(AuditRecord.class))).thenAnswer(invocation -> {
            AuditRecord record = invocation.getArgument(0);
            record.setId("audit-1");
            return new AuditResponse(record.getId(), record.getAction(), record.getUserId(), "Sofia Rivera",
                    record.getAccountIds(), record.getInvolvedUserIds(), record.getAmount(), record.getTransactionIds(),
                    record.getCreatedAt(), record.getActorAuthUserId(), record.getActorUsername());
        });
    }

    @Test
    void previewOwnAndOtherCustomerTransfers() {
        TransferPreviewResponse other = accountService.previewCustomerTransfer(
                new CustomerTransferRequest(ACCOUNT_A, "200045761982", new BigDecimal("25.00")));
        assertFalse(other.ownTransfer());
        assertEquals("Sofia R.", AccountPrivacy.limitedName("Sofia Rivera"));
        assertEquals("Ethan P.", other.destinationDisplayName());
        assertEquals("•••• 1982", other.destinationAccountNumberMasked());
        assertEquals("•••• 0231", other.sourceAccountNumberMasked());

        Account second = account(ACCOUNT_B, CUSTOMER_A, "80.00", "200045761982");
        when(accountRepository.findByAccountNumber("200045761982")).thenReturn(Optional.of(second));
        when(userRepository.findById(CUSTOMER_A)).thenReturn(Optional.of(user(CUSTOMER_A, "Sofia Rivera")));
        TransferPreviewResponse own = accountService.previewCustomerTransfer(
                new CustomerTransferRequest(ACCOUNT_A, "200045761982", new BigDecimal("25.00")));
        assertTrue(own.ownTransfer());
        verify(accountRepository, never()).save(any());
    }

    @Test
    void submitMovesMoneyWritesDirectionalHistoryAndAudit() {
        CustomerTransferReceiptResponse receipt = accountService.submitCustomerTransfer(
                new CustomerTransferRequest(ACCOUNT_A, "200045761982", new BigDecimal("40.00")));
        assertEquals(new BigDecimal("460.00"), receipt.sourceBalance());
        assertEquals("Ethan P.", receipt.destinationDisplayName());
        assertTrue(receipt.transferReference().startsWith("TRF-"));
        ArgumentCaptor<Transaction> transactions = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, org.mockito.Mockito.times(2)).save(transactions.capture());
        assertEquals(TransactionType.TRANSFER_OUT, transactions.getAllValues().get(0).getType());
        assertEquals(TransactionType.TRANSFER_IN, transactions.getAllValues().get(1).getType());
        assertEquals("•••• 1982", transactions.getAllValues().get(0).getCounterpartyAccountNumberMasked());
        ArgumentCaptor<AuditRecord> audit = ArgumentCaptor.forClass(AuditRecord.class);
        verify(auditService).record(audit.capture());
        assertEquals(AuditAction.TRANSFER, audit.getValue().getAction());
        assertEquals(List.of(ACCOUNT_A, ACCOUNT_B), audit.getValue().getAccountIds());
        assertEquals(List.of(CUSTOMER_A, CUSTOMER_B), audit.getValue().getInvolvedUserIds());
    }

    @Test
    void missingDestinationInsufficientFundsAndSameAccountDoNotMoveMoney() {
        when(accountRepository.findByAccountNumber("200045761982")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> accountService.previewCustomerTransfer(
                new CustomerTransferRequest(ACCOUNT_A, "200045761982", new BigDecimal("10.00"))));

        when(accountRepository.findByAccountNumber("200045761982")).thenReturn(Optional.of(destination));
        assertThrows(InvalidTransactionException.class, () -> accountService.submitCustomerTransfer(
                new CustomerTransferRequest(ACCOUNT_A, "200045761982", new BigDecimal("900.00"))));

        when(accountRepository.findByAccountNumber("100000000231")).thenReturn(Optional.of(source));
        assertThrows(InvalidTransactionException.class, () -> accountService.submitCustomerTransfer(
                new CustomerTransferRequest(ACCOUNT_A, "100000000231", new BigDecimal("10.00"))));

        when(accountRepository.findByIdAndUserId(ACCOUNT_B, CUSTOMER_A)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> accountService.submitCustomerTransfer(
                new CustomerTransferRequest(ACCOUNT_B, "100000000231", new BigDecimal("10.00"))));
        verify(accountRepository, never()).save(any());
        verify(auditService, never()).record(any());
    }

    @Test
    void accountNumbersAreTwelveDigitsAndNamesStayLimited() {
        String number = new AccountNumberGenerator().next();
        assertTrue(number.matches("[1-9]\\d{11}"));
        assertEquals("•••• 1982", AccountPrivacy.mask("200045761982"));
        assertEquals("Sofia R.", AccountPrivacy.limitedName("Sofia Rivera"));
    }

    private static Account account(String id, String userId, String balance, String number) {
        Account account = new Account(userId, new BigDecimal(balance), AccountType.CHECKING, LocalDateTime.of(2026, 9, 1, 9, 0));
        account.setId(id);
        account.setAccountNumber(number);
        return account;
    }

    private static User user(String id, String name) {
        User user = new User(name, name.toLowerCase().replace(' ', '.') + "@example.com", LocalDateTime.of(2026, 9, 1, 9, 0));
        user.setId(id);
        return user;
    }
}
