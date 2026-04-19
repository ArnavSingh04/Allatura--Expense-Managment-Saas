# 6) Current Limitations

- Renewal cron currently scans large contract sets in-process; cost rises linearly with dataset size.
- CSV import path processes rows sequentially, reducing throughput for enterprise-scale uploads.
- Some high-volume listing APIs are unpaginated, increasing latency and payload size as tenants grow.
- JWT/Stripe dev fallback secrets exist in code paths and should be hardened for production-only config.
- Frontend RBAC support exists but enforcement is not consistently applied across all user actions.
- Mixed typing quality (`any` usage, legacy patterns in selected services) increases long-term maintenance cost.
