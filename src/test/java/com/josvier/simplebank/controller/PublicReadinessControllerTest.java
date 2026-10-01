package com.josvier.simplebank.controller;

import com.josvier.simplebank.dto.response.ReadinessResponse;
import com.josvier.simplebank.service.ReadinessService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicConfigController.class)
@AutoConfigureMockMvc(addFilters = false)
class PublicReadinessControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReadinessService readiness;

    @Test
    void readyUp_returns200() throws Exception {
        when(readiness.check()).thenReturn(new ReadinessResponse("UP", "staging", "abc123"));

        mockMvc.perform(get("/api/public/ready"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.environment").value("staging"))
                .andExpect(jsonPath("$.revision").value("abc123"))
                .andExpect(content().string(not(containsString("mongodb"))))
                .andExpect(content().string(not(containsString("secret"))));
    }

    @Test
    void readyDown_returns503() throws Exception {
        when(readiness.check()).thenReturn(new ReadinessResponse("DOWN", "staging", "abc123"));

        mockMvc.perform(get("/api/public/ready"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.environment").value("staging"))
                .andExpect(jsonPath("$.revision").value("abc123"));
    }
}
