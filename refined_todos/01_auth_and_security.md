# 01 - Authentication, Security & Permissions

## 1.1 Robust Token System (Fix Login Issues)
**Status:** Pending
**Priority:** Critical
**Scope:**
*   Fix the issue where a user becomes temporarily unauthorized right after login.
*   Implement an `access_token` (short-lived) and `refresh_token` (long-lived) architecture.
*   Add logic to intercept 401 errors, use the refresh token to get a new access token, and retry the failed request.
*   Ensure the authentication state is globally set before making API calls.
*   Logout user properly if the refresh token expires or fails.

## 1.2 SMS Verification System (Twilio)
**Status:** Pending
**Priority:** High
**Scope:**
*   **Login Flow:** Send a 6-digit OTP via SMS on login. Require code entry before issuing JWT. Include expiration and rate-limited resend.
*   **Owner Dashboard:** Require SMS OTP validation before an owner can view their dashboard via the magic link.
*   **Fallback:** Plan for WhatsApp verification as a fallback if Twilio SMS fails.

## 1.3 Data Isolation & Granular Permissions
**Status:** Pending
**Priority:** High
**Scope:**
*   Add page-level permission controls for team members (leads, transactions, properties, visits, teams, config).
*   Enforce strict data isolation: Team members only see data assigned to them.
*   Agency Admins/Owners retain a global view and can filter data by team member.
*   Ensure dashboard KPIs dynamically reflect the logged-in user's permitted data scope.
