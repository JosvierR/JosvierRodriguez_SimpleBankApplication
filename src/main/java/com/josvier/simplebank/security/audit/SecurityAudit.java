package com.josvier.simplebank.security.audit;

import java.time.LocalDateTime;

public class SecurityAudit {
    private String id;
    private final String actorAuthUserId;
    private final String actorUsername;
    private final String targetAuthUserId;
    private final SecurityAuditAction action;
    private final String previousValue;
    private final String newValue;
    private final LocalDateTime createdAt;

    public SecurityAudit(String actorAuthUserId, String actorUsername, String targetAuthUserId,
                         SecurityAuditAction action, String previousValue, String newValue,
                         LocalDateTime createdAt) {
        this.actorAuthUserId = actorAuthUserId;
        this.actorUsername = actorUsername;
        this.targetAuthUserId = targetAuthUserId;
        this.action = action;
        this.previousValue = previousValue;
        this.newValue = newValue;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getActorAuthUserId() { return actorAuthUserId; }
    public String getActorUsername() { return actorUsername; }
    public String getTargetAuthUserId() { return targetAuthUserId; }
    public SecurityAuditAction getAction() { return action; }
    public String getPreviousValue() { return previousValue; }
    public String getNewValue() { return newValue; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
