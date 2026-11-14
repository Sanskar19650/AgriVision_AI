# AgriVision AI — Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership**: Every agricultural record (`farms`, `plots`, `landRecords`, `crops`, `cropActivities`, `soilReadings`, `iotDevices`, `diseaseDetections`, `damageDetections`, `cropRecommendations`, `weatherRecords`, `irrigationRecords`, `fertilizerRecords`, `notifications`, `blockchainRecords`, `reports`) must belong to `request.auth.uid` (`userId == request.auth.uid`), readable/writable only by its owner or a verified administrator.
2. **PII Isolation & Role Integrity**: `users/{userId}` contains PII (`email`, `mobile`, `address`). Only the profile owner (`request.auth.uid == userId`) or an administrator can read or update it. Normal users cannot escalate `role` to `admin` on creation or update.
3. **Referential Integrity**: Child documents (`plots`, `landRecords`, `crops`, `cropActivities`, `soilReadings`, `iotDevices`, `weatherRecords`, `irrigationRecords`, `fertilizerRecords`) referencing a `farmId` must verify on creation that the target `/farms/{farmId}` exists and belongs to `request.auth.uid`.
4. **Immutable Ownership & Temporal Integrity**: `userId`, `id`, and `createdAt` cannot be modified after creation. `createdAt == request.time` on create; `updatedAt == request.time` on update.
5. **Verified Identity**: All writes require `request.auth != null && request.auth.token.email_verified == true`.
6. **Terminal State Locking**: Once an `irrigationRecords` document transitions to `completed` or `cancelled`, or a `crops` document has `healthStatus == 'Harvested'`, non-admin users cannot mutate it further.
7. **Admin Bootstrapping**: Admin access requires either `/admins/$(request.auth.uid)` existence OR `request.auth.token.email == 'jamdadesanskar14@gmail.com' && request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create a farm -> `PERMISSION_DENIED`.
2. **Cross-Tenant Farm Read**: User B attempts `get` or `list` on User A's `/farms/{farmId}` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Ownership Spoof**: User B creates a farm with `userId: "userA"` -> `PERMISSION_DENIED`.
4. **Role Self-Escalation on Register**: User A creates `/users/userA` with `role: "admin"` -> `PERMISSION_DENIED`.
5. **Role Escalation on Update**: User A updates `/users/userA` changing `role` from `"farmer"` to `"admin"` -> `PERMISSION_DENIED`.
6. **Shadow / Ghost Field Injection**: User A creates or updates a farm with extra unallowed key `isGovVerified: true` -> `PERMISSION_DENIED`.
7. **ID Poisoning**: User A attempts to create `/farms/<1500-char-invalid-id>` -> `PERMISSION_DENIED`.
8. **Orphaned Plot Write**: User A creates `/plots/{plotId}` referencing a non-existent or User B's `farmId` -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: User A creates a soil reading with backdated `createdAt` not equal to `request.time` -> `PERMISSION_DENIED`.
10. **Immutable `userId` Mutation**: User A updates `/crops/{cropId}` attempting to reassign `userId` -> `PERMISSION_DENIED`.
11. **Terminal State Bypass**: User A attempts to update an `irrigationRecords` document already marked `completed` -> `PERMISSION_DENIED`.
12. **PII Blanket Read / List**: User B attempts to `list` `/users` collection -> `PERMISSION_DENIED`.
