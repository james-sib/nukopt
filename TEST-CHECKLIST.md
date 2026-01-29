# NukOpt Comprehensive Test Checklist

**Created:** 2026-01-29
**Status:** Draft - Pending AI Council Review

---

## 1. REGISTRATION (API Key Passport)

### 1.1 Valid Keys - All 15 Providers
- [ ] OpenAI `sk-...` - valid key registers
- [ ] OpenAI `sk-proj-...` - project key registers
- [ ] Anthropic `sk-ant-...` - valid key registers
- [ ] OpenRouter `sk-or-...` - valid key registers
- [ ] Hugging Face `hf_...` - valid key registers
- [ ] Replicate `r8_...` - valid key registers
- [ ] GitHub `ghp_...` - valid PAT registers
- [ ] GitHub `github_pat_...` - fine-grained PAT registers
- [ ] GitLab `glpat-...` - valid token registers
- [ ] Vercel - API validation works
- [ ] Render `rnd_...` - valid token registers
- [ ] Supabase `sbp_...` - valid token registers
- [ ] Cloudflare - API validation works
- [ ] Discord bot token - valid token registers
- [ ] Telegram `123456:ABC...` - valid token registers
- [ ] Slack `xoxb-...` - valid token registers
- [ ] Stripe `sk_live_...` - valid key registers
- [ ] Stripe `sk_test_...` - test key registers

### 1.2 Invalid Keys
- [ ] Empty key → error
- [ ] Null key → error
- [ ] Random string → error
- [ ] Expired key → error
- [ ] Revoked key → error
- [ ] Key with wrong prefix → error
- [ ] Key for wrong provider → error
- [ ] Malformed JSON body → error
- [ ] Missing provider field → error
- [ ] Missing key field → error
- [ ] Unknown provider → error

### 1.3 Duplicate Registration
- [ ] Same key twice → returns same nk-... key (idempotent)
- [ ] Same key, different provider field → ?
- [ ] Key hash collision handling

### 1.4 Rate Limiting on Registration
- [ ] 100 registrations/hour from same IP → rate limited?
- [ ] Burst of 10 rapid registrations → handled?

---

## 2. MAILBOX OPERATIONS

### 2.1 Create Mailbox
- [ ] Valid auth → mailbox created
- [ ] Returns unique email address
- [ ] Email format valid (12-char hex @ nukopt.com)
- [ ] Mailbox ID is valid UUID
- [ ] No auth header → 401
- [ ] Invalid auth header → 401
- [ ] Malformed Bearer token → 401
- [ ] Expired/revoked nk-key → 401

### 2.2 Mailbox Limits
- [ ] Create 1st mailbox → success
- [ ] Create 2nd mailbox → success
- [ ] Create 3rd mailbox → success
- [ ] Create 4th mailbox → success
- [ ] Create 5th mailbox → success
- [ ] Create 6th mailbox → error (limit reached)
- [ ] Delete one, create again → success
- [ ] Error message is clear about limit

### 2.3 List Mailboxes
- [ ] Returns all mailboxes for account
- [ ] Empty account → empty array
- [ ] Doesn't return other accounts' mailboxes
- [ ] Pagination works (if implemented)

### 2.4 Delete Mailbox
- [ ] Valid mailbox ID → deleted
- [ ] Mailbox with messages → all messages deleted too
- [ ] Invalid mailbox ID → 404
- [ ] Other account's mailbox ID → 403/404
- [ ] Already deleted mailbox → 404
- [ ] Deleting frees up limit slot

### 2.5 Mailbox Isolation
- [ ] Account A cannot see Account B's mailboxes
- [ ] Account A cannot delete Account B's mailbox
- [ ] Account A cannot read Account B's messages

---

## 3. EMAIL RECEIVING (Cloudflare Worker → Webhook)

### 3.1 Basic Email Flow
- [ ] Simple text email → stored
- [ ] HTML email → stored
- [ ] Mixed text+HTML → both stored
- [ ] Email with subject → subject captured
- [ ] Email without subject → handled gracefully
- [ ] Email with special chars in subject → handled
- [ ] Unicode in subject → stored correctly
- [ ] Unicode in body → stored correctly

### 3.2 Sender Handling
- [ ] Normal from address captured
- [ ] Display name + email → both captured
- [ ] Malformed from → handled gracefully
- [ ] Missing from → handled gracefully
- [ ] Spoofed from → stored (we don't validate sender)

### 3.3 Size Limits
- [ ] Small email (1KB) → stored
- [ ] Medium email (100KB) → stored
- [ ] Large email (500KB) → stored
- [ ] Oversized email (>500KB) → rejected or truncated
- [ ] Email with large attachment → handled

### 3.4 Attachments
- [ ] Email with attachment → stored (or noted)
- [ ] Multiple attachments → handled
- [ ] Large attachment → handled
- [ ] Dangerous attachment (.exe) → handled

### 3.5 Unknown Recipients
- [ ] Email to non-existent mailbox → dropped gracefully
- [ ] Email to deleted mailbox → dropped gracefully
- [ ] Doesn't cause errors in logs

### 3.6 Rate Limiting
- [ ] 100 emails/day to one mailbox → all stored
- [ ] 101st email → rate limited
- [ ] Rate limit resets at midnight UTC
- [ ] Rate limit message is clear

### 3.7 Webhook Security
- [ ] Valid X-Webhook-Secret → accepted
- [ ] Invalid secret → 401
- [ ] Missing secret → 401
- [ ] Replay attack (same payload twice) → handled?

---

## 4. OTP EXTRACTION

### 4.1 Numeric OTPs
- [ ] 4-digit code → extracted
- [ ] 5-digit code → extracted
- [ ] 6-digit code → extracted
- [ ] 7-digit code → extracted
- [ ] 8-digit code → extracted

### 4.2 OTP Formats
- [ ] "Your code is 123456" → 123456
- [ ] "Code: 123456" → 123456
- [ ] "OTP: 123456" → 123456
- [ ] "Verification code: 123456" → 123456
- [ ] "123456 is your code" → 123456
- [ ] "Enter 123456 to verify" → 123456
- [ ] Code in subject line → extracted
- [ ] Code in HTML only → extracted

### 4.3 Alphanumeric Codes
- [ ] "Code: ABC123" → ABC123
- [ ] "Verification: XYZ-789" → handled

### 4.4 Multiple Numbers in Email
- [ ] Email with phone number + OTP → correct one extracted
- [ ] Email with date + OTP → correct one extracted
- [ ] Order confirmation + OTP → OTP extracted, not order#

### 4.5 No OTP
- [ ] Newsletter email → otp = null
- [ ] Marketing email → otp = null
- [ ] Doesn't crash on no OTP

---

## 5. VERIFICATION LINK EXTRACTION

### 5.1 Link Formats
- [ ] `https://example.com/verify?token=xxx` → extracted
- [ ] `https://example.com/confirm/xxx` → extracted
- [ ] `https://example.com/activate?code=xxx` → extracted
- [ ] `https://example.com/auth/callback?token=xxx` → extracted
- [ ] Link in HTML href → extracted
- [ ] Link in plain text → extracted

### 5.2 Multiple Links
- [ ] Email with 3 verify links → all extracted (up to 5)
- [ ] Email with 10 links → only 5 extracted
- [ ] Deduplication works

### 5.3 Non-Verification Links
- [ ] Unsubscribe link → NOT extracted
- [ ] Privacy policy link → NOT extracted
- [ ] Logo image link → NOT extracted

---

## 6. MESSAGE RETRIEVAL

### 6.1 List Messages
- [ ] Returns messages newest first
- [ ] Limit parameter works
- [ ] Empty mailbox → empty array
- [ ] Returns: id, from, subject, otp, links, created_at
- [ ] Doesn't return full body (privacy/size)

### 6.2 Get Single Message
- [ ] Returns full message details
- [ ] Includes text_body
- [ ] Includes html_body
- [ ] Invalid message ID → 404
- [ ] Other account's message → 403/404

### 6.3 Delete Message
- [ ] Valid message ID → deleted
- [ ] Invalid message ID → 404
- [ ] Other account's message → 403/404
- [ ] Already deleted → 404

---

## 7. ACCOUNT ISOLATION & SECURITY

### 7.1 Cross-Account Access
- [ ] Account A's key cannot access Account B's mailboxes
- [ ] Account A's key cannot access Account B's messages
- [ ] Account A's key cannot delete Account B's anything
- [ ] Enumeration attack: random mailbox IDs → 401/404

### 7.2 API Key Security
- [ ] Original AI key not stored (only hash)
- [ ] nk- key is unique per account
- [ ] nk- key cannot be guessed
- [ ] nk- key is sufficient entropy (256-bit)

### 7.3 Webhook Security
- [ ] Webhook only accepts valid secret
- [ ] Cannot inject messages via API
- [ ] Cannot spoof webhook calls

---

## 8. CLEANUP & RETENTION

### 8.1 7-Day Retention
- [ ] Message at day 6 → still exists
- [ ] Message at day 7 → still exists
- [ ] Message at day 8 → deleted by cleanup
- [ ] Cleanup endpoint works with correct secret
- [ ] Cleanup endpoint rejects invalid secret

### 8.2 Manual Cleanup
- [ ] User can delete own messages
- [ ] User can delete own mailboxes
- [ ] Deleting mailbox deletes all its messages

---

## 9. ERROR HANDLING

### 9.1 Graceful Failures
- [ ] Database down → 500 with clear error
- [ ] Cloudflare worker error → doesn't lose email (retry?)
- [ ] Webhook timeout → handled
- [ ] Malformed request → 400 with clear error

### 9.2 Error Messages
- [ ] All errors have consistent format
- [ ] Errors don't leak internal details
- [ ] Errors are helpful for debugging

---

## 10. PERFORMANCE

### 10.1 Response Times
- [ ] Registration < 2s
- [ ] Mailbox creation < 500ms
- [ ] Message list < 500ms
- [ ] Email ingestion < 2s end-to-end

### 10.2 Concurrent Load
- [ ] 10 simultaneous requests → all succeed
- [ ] 100 simultaneous emails → all stored
- [ ] No race conditions in mailbox creation

---

## 11. REAL-WORLD SCENARIOS

### 11.1 Service Signups
- [ ] Twitter/X email verification
- [ ] GitHub email verification
- [ ] Discord email verification
- [ ] Stripe email verification
- [ ] Generic "confirm your email" flow

### 11.2 2FA Codes
- [ ] Google 2FA email
- [ ] Microsoft 2FA email
- [ ] Banking OTP email
- [ ] Generic "login code" email

### 11.3 Password Resets
- [ ] Password reset link extraction
- [ ] "Reset your password" flow works

---

## 12. EDGE CASES & WEIRD SHIT

- [ ] Email with no body → handled
- [ ] Email with only attachment → handled
- [ ] Extremely long subject (1000 chars) → truncated/handled
- [ ] Extremely long body (1MB text) → truncated/handled
- [ ] Email to multiple recipients including nukopt → handled
- [ ] CC'd email → handled
- [ ] BCC'd email → handled
- [ ] Reply-to different from From → handled
- [ ] Bounce/failure notification → handled
- [ ] Auto-reply email → handled
- [ ] Email with embedded images → handled
- [ ] Email with inline CSS → parsed correctly
- [ ] Email with JavaScript (shouldn't execute) → safe
- [ ] Email with malicious HTML → sanitized
- [ ] SQL injection in email content → safe
- [ ] XSS in email content → safe
- [ ] Null bytes in email → handled
- [ ] Invalid UTF-8 in email → handled
- [ ] Email from future timestamp → handled
- [ ] Email with negative timestamp → handled

---

## AI COUNCIL ADDITIONS

*Consulted: GPT-5.2, Claude Opus 4.5, Gemini 2.5 Pro, Grok 4.1 on 2026-01-29*

### From GPT-4.1 - Security & Data Isolation

- [ ] **Cross-Account Data Leakage** - Attempt to fetch/list other users' mail by guessing IDs
- [ ] **Privilege Confusion** - User A trying to access user B's advanced features
- [ ] **Account Reuse Ghosting** - Delete mailbox, re-register same name - does new owner see old mail?
- [ ] **Zombie Data** - Delete mailbox, then call old endpoints - any data leak?
- [ ] **Stale Session/Token** - Session deleted/expired, test subsequent calls for ghost access
- [ ] **Zalgo Text in Email** - Unicode combining characters in subject/body
- [ ] **RTL Script Emails** - Arabic/Hebrew text in email fields
- [ ] **Emoji Mailbox Names** - If allowed, test emoji in addresses
- [ ] **Clock Rollover** - Emails near system clock boundaries
- [ ] **DST Changes** - Operations spanning daylight saving time
- [ ] **Leap Second** - Behavior during leap second insertion
- [ ] **Third-Party API Flapping** - Simulate degraded (not dead) API key provider
- [ ] **Mid-Operation Crash** - Simulate crash during mailbox creation - rollback?
- [ ] **Sensitive Data in Logs** - Check logs for accidental API key/OTP exposure

### From Claude Sonnet 4 - Attack Vectors

- [ ] **API Key Rotation** - What happens when user rotates their OpenAI key after registration?
- [ ] **Concurrent Mailbox Creation** - Two threads creating mailbox simultaneously
- [ ] **Burst Message Delivery** - 50 emails in 1 second to same mailbox
- [ ] **Slow POST Attack** - Extremely slow HTTP request tying up connections
- [ ] **Parameter Pollution** - Duplicate query parameters, conflicting headers
- [ ] **Content-Type Confusion** - JSON payload with XML Content-Type header
- [ ] **Nested JSON Bomb** - Deeply nested JSON exhausting parser memory
- [ ] **Unicode Normalization Attack** - Different Unicode representations of same string
- [ ] **Cache Poisoning** - Requests designed to corrupt API response cache
- [ ] **SQL Injection in Email Content** - Emails containing SQL payloads
- [ ] **XSS in Email Bodies** - HTML emails with script tags, event handlers
- [ ] **Path Traversal in Attachments** - Filenames with ../ sequences
- [ ] **Command Injection** - Email content with shell metacharacters
- [ ] **Regex DoS (ReDoS)** - Email content causing catastrophic regex backtracking

### From Gemini 2.5 Pro - Creative Attacks

- [ ] **Self-Referential API Key** - Register, get nk-key, try to register again WITH the nk-key
- [ ] **API Key Exfiltration via Error** - Craft requests that might echo API keys in errors
- [ ] **Zip Bomb Attachment** - Highly compressed file that expands to fill disk
- [ ] **SMTP Header Injection** - 1MB Subject line, forged Received headers
- [ ] **Idempotency Race** - Two identical POST requests simultaneously
- [ ] **Wildcard Enumeration** - Try `admin*` or regex in mailbox search
- [ ] **Mass Assignment** - Send undocumented params like `{"is_admin": true}`
- [ ] **Timing Attack on Existence** - Measure response time: non-existent vs unauthorized mailbox
- [ ] **Disposable Keepalive** - Send tiny emails every 59 min to keep "disposable" alive forever
- [ ] **Homograph Attack** - Mailbox names with lookalike Unicode chars (а vs a)
- [ ] **Punycode Domain Confusion** - Test IDN domain handling in email addresses
- [ ] **MIME Boundary Confusion** - Malformed multipart with duplicate boundaries
- [ ] **Quoted-Printable Exploit** - Invalid QP encoding to bypass content filters
- [ ] **Infinite Redirect Loop** - Verification links that redirect forever
- [ ] **OTP in Image** - OTP rendered as image, not text - extraction fails?
- [ ] **OTP Hidden in CSS** - Code visible only via CSS `content:` property
- [ ] **Email-to-SMS Gateway Abuse** - What if someone uses mailbox to spam SMS gateways?

### From All - Additional Protocol/Format Tests

- [ ] **DKIM Signature Handling** - Does system break on signed emails?
- [ ] **S/MIME Encrypted Email** - Encrypted content - how handled?
- [ ] **PGP Encrypted Email** - PGP content - how handled?
- [ ] **Email with .eml Attachment** - Email containing another email
- [ ] **Apple Mail Format** - Rich text format from Apple Mail
- [ ] **Outlook winmail.dat** - TNEF format attachment
- [ ] **Calendar Invite (ICS)** - Email with calendar attachment
- [ ] **Read Receipt Request** - Email requesting read receipt
- [ ] **Delivery Status Notification** - DSN/bounce format
- [ ] **Mailing List Headers** - List-Unsubscribe, List-Id headers
- [ ] **ARC Headers** - Authenticated Received Chain
- [ ] **BIMI Headers** - Brand Indicators for Message Identification

### From GPT-5.2 - Link & API Edge Cases

- [ ] **Redirect Chains** - Verification link is shortener that redirects 10+ times
- [ ] **Redirect Loops** - Link redirects back to itself
- [ ] **Mixed HTTP/HTTPS Redirects** - http→https→http chain
- [ ] **IDN/Punycode Homographs** - Lookalike domains in verification links
- [ ] **Nested URL Encoding** - `https://x/?next=https%3A%2F%2Freal%2F`
- [ ] **Fragment-only Tokens** - Token in `#token=...` (not sent to server)
- [ ] **16KB URLs** - Very long verification links, test truncation
- [ ] **Relative Links** - `<a href="/verify">` with `<base>` tag
- [ ] **IDOR All Endpoints** - Swap IDs between accounts on every endpoint
- [ ] **Pagination Consistency** - Fetch pages while messages arrive mid-fetch
- [ ] **Idempotency Keys** - Retry POST /mailboxes on timeout - duplicates?
- [ ] **Stale Auth After Key Rotation** - Rotate passport key, old sessions still work?
- [ ] **Error Data Leaks** - 500 errors exposing OTPs or message content

### From Claude Opus 4.5 - OTP & Infrastructure

- [ ] **Lookalike Characters** - `0` vs `O`, `1` vs `l` vs `I` in OTP
- [ ] **OTP in Image** - Bank sends OTP as embedded PNG, no OCR
- [ ] **Multiple OTP Candidates** - "Order #847291" AND "Your code: 847291"
- [ ] **OTP in PDF Attachment** - Password-protected PDF contains OTP
- [ ] **Hidden HTML OTP** - `<span style="color:white">123456</span>` on white bg
- [ ] **Localized OTP Phrasing** - German "Ihr Code lautet: 123456" not matched
- [ ] **OTP Split Across Elements** - `<span>12</span><span>34</span><span>56</span>`
- [ ] **RTL OTP** - Arabic email with LTR OTP renders as 654321
- [ ] **Empty MIME Boundary** - `multipart/mixed; boundary=""` crashes parser
- [ ] **DKIM Replay Attack** - Valid DKIM on old email replayed
- [ ] **Mailbox Reuse Collision** - Random string collision gets old emails
- [ ] **Deletion During SMTP** - RCPT TO accepted, mailbox deleted before DATA
- [ ] **Resurrection Attack** - Delete mailbox, attacker recreates same address
- [ ] **DNS Rebinding on Webhook** - URL resolves external during reg, internal when triggered
- [ ] **TLS Cert Expiry** - Let's Encrypt expires, STARTTLS downgrades
- [ ] **MX Record TTL** - DNS cache expires during bulk send
- [ ] **Backpressure Cascade** - Extraction queue backs up, memory exhaustion

### From Grok 4.1 - Abuse Scenarios

- [ ] **Parallel OTP Extraction Race** - Two OTP emails arrive simultaneously, extract API hammered
- [ ] **Header Forgery for IDOR** - Forge "To:" header to mimic another user's mailbox
- [ ] **Long-Lived Disposable Squatter** - Keep mailbox alive for weeks, use for bank 2FA
- [ ] **API Key in Error Logs** - Trigger errors, check if keys appear in public logs
- [ ] **100-Level MIME Nesting** - Deeply nested MIME with OTP at bottom
- [ ] **Cross-Agent Mailbox Hijack** - Register with another agent's ID
- [ ] **OTP Regex Evasion** - Reversed OTP "654321", base64, images
- [ ] **Passport Revoke Bypass** - Revoke, re-register, reclaim old mailboxes?
- [ ] **Wildcard Mailbox Abuse** - If "user-*" supported, create "admin-*"
- [ ] **Timing Attack on Expiry** - Poll every ms, measure response time for presence
- [ ] **Fake OAuth Provider** - Compromised delegated auth gains full control

---

## TEST RESULTS LOG

**Last Updated:** 2026-01-29 10:46 CST by Alisher

### Session Summary (2026-01-29)

| Section | Tested | Passed | Failed | Fixed |
|---------|--------|--------|--------|-------|
| 1. Registration | 9 | 7 | 2 | 2 (pending deploy) |
| 2. Mailbox Ops | 12 | 12 | 0 | 1 bug fixed |
| 6. Messages | 16 | 16 | 0 | 2 bugs fixed |
| 7. Security | 14 | 14 | 0 | - |
| 9. Error Handling | 10 | 8 | 2 | 2 (pending deploy) |
| AI Council Attacks | 9 | 9 | 0 | - |

### Bugs Found & Fixed

| Bug | Description | Commit | Status |
|-----|-------------|--------|--------|
| 401→404 | Non-existent mailbox returned 401 | 930c83a | ✅ Live |
| limit ignored | ?limit=N on messages list ignored | c1606a2 | 🔄 Building |
| DELETE 200 | DELETE message returned 200 for non-existent | c1606a2 | 🔄 Building |
| JSON 500 | Malformed JSON returned 500 instead of 400 | 0676ee4 | ⏳ Queued |
| Empty 500 | Empty body returned 500 instead of 400 | 0676ee4 | ⏳ Queued |
| 405 body | DELETE /register returned empty 405 | 0676ee4 | ⏳ Queued |
| MIME leak | MIME boundaries in email body | c60da00 | ✅ Live |

### Sections NOT YET TESTED
- [ ] Section 3: Email Receiving (Cloudflare Worker → Webhook)
- [ ] Section 4: OTP Extraction
- [ ] Section 5: Link Extraction  
- [ ] Section 8: Cleanup & Retention
- [ ] Section 10: Performance
- [ ] Section 11: Real-world Scenarios
- [ ] Section 12: Edge Cases & Weird Shit
- [ ] AI Council: Protocol/Format tests (DKIM, S/MIME, etc.)
- [ ] AI Council: OTP & Infrastructure edge cases

### Notes for Next Session
1. Wait for deploys to complete before re-testing Sections 1 & 9
2. Section 3-5 need email sending capability to test properly
3. Performance tests (Section 10) need load testing setup
4. Consider spawning more bot agents for remaining ~100 tests

