FEATURE #1 — INCIDENT INGESTION PIPELINE 

GOAL:
Accept user incident data (text + location), run LLM extraction,
calculate risk using rule-based scoring, store incident in DB,
return processed result.

------------------------------------------------------------
REQUIRED INPUT (User must send):
- rawText (string)
- state (string)
- district (string)

Reject request if ANY are missing.

------------------------------------------------------------
PIPELINE FLOW (DO NOT CHANGE THE ORDER):

1. Receive request (rawText, state, district)

2. Validate request:
   IF empty or missing → respond with error.
   Do not call LLM if invalid.

3. Prepare LLM request:
   - Send rawText only (prompt.js handles extraction rules)
   - Do not send user’s state/district to AI to avoid bias

4. Get LLM response:
   Expect JSON containing:
   - category
   - location (may be null)
   - indicators (booleans)
   - confidence (0–100)

5. Validate LLM output:
   - Must match your schema shape from prompt.js
   - category MUST be from allowed list
   - confidence < 40 → mark incident as "needs_review": true
   - NEVER calculate risk based on confidence

6. Apply Risk Scoring (backend deterministic):
   - category → base score
   - indicators → add points
   - total score → assign risk level
   (based on your Day-1 rules text)

7. Combine FINAL incident object:
   - rawText = user text
   - location = user state + district (always overrides AI location)
   - extracted = LLM JSON (store as given)
   - risk = score + level
   - status:
        if confidence < 40 → "Needs Review"
        else "Processed"

8. Store in database:
   - ALWAYS store rawText
   - ALWAYS store extracted data
   - ALWAYS store risk
   - ALWAYS store user location
   - NEVER store null fields as empty strings

9. Respond to user with JSON summary:
   {
     "message": "Incident recorded",
     "riskLevel": "...",
     "riskScore": X,
     "confidence": X,
     "status": "Processed" or "Needs Review"
   }

------------------------------------------------------------
RISK SCORE RULES SNAPSHOT:
- Risk Score = base(category) + sum(indicator points)
- Level mapping:
    0–39 → Low
    40–69 → Medium
    70–89 → High
    90+  → Critical

------------------------------------------------------------
CRITICAL RULES (DO NOT BREAK):
- LLM NEVER decides risk.
- LLM NEVER decides escalation.
- User location ALWAYS overrides AI location.
- If AI JSON malformed → return "AI Extraction Error".
- rawText is ALWAYS stored, never altered.
- Confidence < 40 NEVER auto-rejects; just mark review-needed.

------------------------------------------------------------
FEATURE #1 IS COMPLETE WHEN:
- You can send a request, get a structured response.
- Risk is 100% rule-based, no AI influence.
- DB saves the full incident record.
- Low-confidence incidents are tagged for review.
- No dashboard/CSV/alerts code is touched yet.
