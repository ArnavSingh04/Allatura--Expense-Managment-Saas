# 5) Database and Data Model

```mermaid
%%{init: {'theme':'base','themeVariables': {'fontSize':'16px','lineColor':'#0f172a','primaryColor':'#e2e8f0','primaryTextColor':'#0f172a','primaryBorderColor':'#334155','clusterBkg':'#f8fafc','clusterBorder':'#334155','tertiaryColor':'#ffffff'}}}%%
erDiagram
  ORGANISATION ||--o{ USER : has
  USER ||--o{ ITSYSTEM : owns_as_business_or_technical
  ITSYSTEM ||--o{ CONTRACT : contains
  CONTRACT ||--o{ RENEWALALERT : triggers
  USER ||--o{ AUDITLOG : performs
  CONTRACT ||--o{ AUDITLOG : affects
  ITSYSTEM ||--o{ AUDITLOG : affects

  ORGANISATION {
    string tenantId
    string name
  }
  USER {
    objectId organisationId
    string email
    string passwordHash
    string role
  }
  ITSYSTEM {
    string tenantId
    string name
    objectId businessOwner
    objectId technicalOwner
    date deletedAt
  }
  CONTRACT {
    string tenantId
    objectId systemId
    number annualCost
    date renewalDate
    date deletedAt
  }
  RENEWALALERT {
    string tenantId
    objectId contractId
    string status
    objectId decisionBy
  }
  AUDITLOG {
    string tenantId
    objectId performedBy
    string entityType
    objectId entityId
    date timestamp
  }
```

- Storage is MongoDB (NoSQL) via Mongoose schemas.
- Tenant-aware design is implemented through `tenantId` propagation.
- ObjectId references connect users, systems, contracts, and renewal lifecycle records.
- Soft deletion is used for key operational entities to preserve history.
- Audit logs capture actor, action, and before/after context for compliance traceability.
