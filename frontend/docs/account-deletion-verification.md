# Account deletion — manual verification

1. Sign in via **Settings → Sign in** (or register first).
2. Create a focus session and some home progress.
3. Open **Settings → Account → Delete account**.
4. Click **Continue**, then type `DELETE` and confirm.
5. **Expected:**
   - Success: signed out, sign-in form shown, local progress cleared after reload.
   - Backend: `DELETE /api/account` returns `{ ok: true }`.
6. **Failure case:** stop backend, try delete → error shown, user stays signed in.

Automated tests: `backend/tests/test_account_deletion.py`
