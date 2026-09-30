package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.response.AuditResponse;
import com.josvier.simplebank.exception.GlobalExceptionHandler;
import com.josvier.simplebank.exception.ResourceNotFoundException;
import com.josvier.simplebank.model.AuditAction;
import com.josvier.simplebank.service.AuditService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuditController.class)
@Import(GlobalExceptionHandler.class)
@WithMockUser
class AuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuditService auditService;

    @Test
    void getAudits_returnsOk() throws Exception {
        when(auditService.getAudits()).thenReturn(List.of(sample()));

        mockMvc.perform(get("/api/audits"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].action").value("TRANSFER"))
                .andExpect(jsonPath("$[0].userId").value("68dc1234567890abcdef0001"))
                .andExpect(jsonPath("$[0].accountIds[1]").value("68dc1234567890abcdef0003"))
                .andExpect(jsonPath("$[0].amount").value(40.00));
    }

    @Test
    void getAudit_returnsOk() throws Exception {
        when(auditService.getAudit("68dc1234567890abcdef0088")).thenReturn(sample());

        mockMvc.perform(get("/api/audits/68dc1234567890abcdef0088"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("68dc1234567890abcdef0088"))
                .andExpect(jsonPath("$.userName").value("Josvier Rodriguez"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void getAudit_missing_returnsNotFound() throws Exception {
        when(auditService.getAudit("68dc1234567890abcdef0099"))
                .thenThrow(new ResourceNotFoundException("Audit with id 68dc1234567890abcdef0099 was not found"));

        mockMvc.perform(get("/api/audits/68dc1234567890abcdef0099").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    private AuditResponse sample() {
        return new AuditResponse(
                "68dc1234567890abcdef0088",
                AuditAction.TRANSFER,
                "68dc1234567890abcdef0001",
                "Josvier Rodriguez",
                List.of("68dc1234567890abcdef0002", "68dc1234567890abcdef0003"),
                List.of("68dc1234567890abcdef0001", "68dc1234567890abcdef0004"),
                new BigDecimal("40.00"),
                List.of("68dc1234567890abcdef0011", "68dc1234567890abcdef0012"),
                LocalDateTime.of(2026, 9, 29, 12, 0),
                "68dc1234567890abcdef0101",
                "josvier");
    }
}
