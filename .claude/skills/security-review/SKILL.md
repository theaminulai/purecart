---
name: security-review
description: Security audit of PureCart PHP code. Checks for SQL injection, XSS, missing capability/nonce checks, file path traversal, and direct file URL exposure.
disable-model-invocation: true
argument-hint: <file-path-or-diff>
---

# PureCart Security Review

Perform a security audit of the code below. Focus only on exploitable vulnerabilities — not style or performance.

## Target

!`git diff HEAD -- $ARGUMENTS 2>/dev/null || cat $ARGUMENTS`

---

## Checks to run

### SQL injection
- Every `$wpdb->query()`, `$wpdb->get_results()`, `$wpdb->get_row()`, `$wpdb->get_var()` call must use `$wpdb->prepare()` when any variable appears in the SQL string.
- Look for string concatenation inside SQL: `"SELECT * FROM {$wpdb->prefix}... WHERE id = " . $id` — never acceptable.

### Output escaping (XSS)
- Every value echoed in PHP templates or admin pages must pass through `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()`, or `absint()` as appropriate.
- `echo $variable` with no escaping is a finding regardless of where `$variable` came from.

### Authentication and authorization
- Every REST route handler must call `current_user_can()` with an appropriate capability before acting on data.
- Every AJAX handler must call `check_ajax_referer()` or `wp_verify_nonce()`.
- REST route `permission_callback` must not be `__return_true` for write operations.

### File path traversal
- Any user-controlled value used to construct a file path must be sanitized and checked to stay within the intended directory (e.g. `realpath()` + `strpos()` guard).
- Download token redemption must verify the token belongs to the requesting user before streaming.

### Direct file URL exposure
- File delivery must stream through PHP (`readfile()` / `fpassthru()`), never by returning or redirecting to a direct filesystem or CDN URL.

### Hardcoded secrets
- Flag any hardcoded API key, password, secret, or token.

---

## Output format

For each finding:
- **Severity:** Critical / High / Medium
- **Location:** file + approximate line
- **Vulnerability:** what it is
- **Attack scenario:** how an attacker exploits it (one sentence)
- **Fix:** the corrected code

If no vulnerabilities are found, state that clearly.
