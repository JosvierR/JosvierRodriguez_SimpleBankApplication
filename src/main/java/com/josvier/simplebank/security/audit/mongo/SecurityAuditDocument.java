package com.josvier.simplebank.security.audit.mongo;

import com.josvier.simplebank.security.audit.SecurityAuditAction;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.LocalDateTime;

@Document(collection = "security_audits")
public class SecurityAuditDocument {
    @MongoId(FieldType.OBJECT_ID)
    private String id;
    private String actorAuthUserId;
    private String actorUsername;
    private String targetAuthUserId;
    private SecurityAuditAction action;
    private String previousValue;
    private String newValue;
    @Indexed(name = "security_audit_created_at_idx")
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getActorAuthUserId() { return actorAuthUserId; }
    public void setActorAuthUserId(String value) { actorAuthUserId = value; }
    public String getActorUsername() { return actorUsername; }
    public void setActorUsername(String value) { actorUsername = value; }
    public String getTargetAuthUserId() { return targetAuthUserId; }
    public void setTargetAuthUserId(String value) { targetAuthUserId = value; }
    public SecurityAuditAction getAction() { return action; }
    public void setAction(SecurityAuditAction value) { action = value; }
    public String getPreviousValue() { return previousValue; }
    public void setPreviousValue(String value) { previousValue = value; }
    public String getNewValue() { return newValue; }
    public void setNewValue(String value) { newValue = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime value) { createdAt = value; }
}
