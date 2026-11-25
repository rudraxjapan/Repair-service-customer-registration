# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Customer Ownership & PII Isolation**: A `Customer` document at `/customers/{customerId}` may only be created, read, or updated by the authenticated user whose `request.auth.uid == customerId` (with verified email), or read/listed by an authorized administrator (`isAdmin()`). No non-owner user may read or list another customer's PII (`mobileNumber`, `email`, `address`, `pinCode`).
2. **Registered Customer Requirement**: A `RepairRequest` document at `/repairRequests/{requestId}` cannot exist without an existing parent `Customer` record for `request.auth.uid` (`exists(/databases/$(database)/documents/customers/$(request.auth.uid))`), and `customerId` must strictly equal `request.auth.uid`.
3. **Status Lifecycle & Terminal Locking**: Customers must create repair requests with `status == 'Pending'`. Customers can only transition their own `Pending` request to `Cancelled` (updating only `status` and `updatedAt`). Once a request reaches `Completed` or `Cancelled`, customers cannot modify it. Only `isAdmin()` can transition requests across `Pending`, `Accepted`, `In Progress`, `Completed`, and `Cancelled`, or update `adminNotes`.
4. **Temporal & Structural Integrity**: `createdAt` must equal `request.time` on creation and remain immutable on update. `updatedAt` must equal `request.time` on both create and update. Shadow/ghost fields are strictly rejected via `hasAll` + `hasOnly` on create and `affectedKeys().hasOnly(...)` on update.
5. **Admin Privilege Isolation**: Users cannot self-assign admin privileges by writing to `/admins/{adminId}` or adding `role` / `isAdmin` fields to `/customers/{customerId}`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on Customer Create**: User `uid_A` attempts `create` at `/customers/uid_B` with `{ uid: "uid_B", ... }` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Customer Create**: User `uid_A` attempts `create` at `/customers/uid_A` with extra `{ isAdmin: true }` -> `PERMISSION_DENIED`.
3. **PII Blanket Read**: User `uid_A` attempts `get` on `/customers/uid_B` -> `PERMISSION_DENIED`.
4. **Unscoped Customer List**: Non-admin user `uid_A` attempts `list` on `/customers` -> `PERMISSION_DENIED`.
5. **Orphaned Repair Request**: Unregistered user `uid_X` (no `/customers/uid_X` doc) attempts `create` at `/repairRequests/REP-1001` -> `PERMISSION_DENIED`.
6. **Status Shortcutting on Create**: User `uid_A` attempts `create` at `/repairRequests/REP-1002` with `status: "Completed"` -> `PERMISSION_DENIED`.
7. **Unauthorized Status Escalation by Customer**: User `uid_A` attempts `update` on `/repairRequests/REP-1002` changing `status` to `"Accepted"` -> `PERMISSION_DENIED`.
8. **Terminal State Modification by Customer**: User `uid_A` attempts `update` on a `"Completed"` repair request -> `PERMISSION_DENIED`.
9. **Resource Poisoning via Oversized ID**: User `uid_A` attempts `create` at `/repairRequests/` + 500-char ID -> `PERMISSION_DENIED`.
10. **Timestamp Forgery**: User `uid_A` attempts `create` with backdated `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
11. **Unscoped Repair Request List**: Non-admin user `uid_A` attempts `list` on `/repairRequests` without `where('customerId', '==', 'uid_A')` -> `PERMISSION_DENIED`.
12. **Self-Admin Privilege Escalation**: Non-admin user `uid_A` attempts `create` at `/admins/uid_A` with `{ uid: "uid_A", role: "admin" }` -> `PERMISSION_DENIED`.
