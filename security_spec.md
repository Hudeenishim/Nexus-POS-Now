# Security Specification - POS System

## Data Invariants
1. **User Identity Invariant**: A user document must match the authenticated `uid`. The `role` field is immutable except by an existing admin.
2. **Product Integrity Invariant**: A product must have a positive price and quantity. Only admins/managers can modify stock outside of sales.
3. **Sale Lifecycle Invariant**: A sale cannot be modified once created. It can only be deleted (voided) by an administrator.
4. **Relational Integrity**: `sales_items` must accurately reference an existing `saleId`.
5. **Admin Master Access**: The primary owner (`salahnapari@gmail.com`) has absolute bypass permissions for maintenance.

## The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Theft**: Attempt to update another user's profile role to 'admin'.
2. **Shadow Field Injection**: Update a product with `isPromoted: true` (not in schema).
3. **State Shortcutting**: Create a sale with a `totalAmount` of -100.
4. **Unauthorized Void**: Attempt to delete a sale record as a cashier.
5. **Inventory Poisoning**: Update a product with a 1MB string in the `category` field.
6. **Price Hijack**: Update product price to 0.01 as a cashier.
7. **Phantom Sale Item**: Create a `sales_item` without a valid `saleId`.
8. **Customer Data Leak**: List all customers as an unauthenticated user.
9. **Role Escalation**: Self-assign 'admin' role during user registration.
10. **Timestamp Spoofing**: Provide a `createdAt` date from 2020.
11. **Negative Loyalty**: Update a customer document with `loyaltyPoints: -999`.
12. **Orphaned Supplier**: Delete a supplier without admin permissions.

## Test Runner Logic (Conceptual)
The following behaviors are enforced by `firestore.rules`:
- All writes must pass the relevant `isValid[Entity]` helper.
- `isAdmin()` check uses both the `users` collection and a hardcoded fallback for the primary owner.
- `allow list` explicitly validates `resource.data` to prevent scraping.
