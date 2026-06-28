---
id: credit-workflow
title: Credit Workflow
sidebar_label: Credit Workflow
sidebar_position: 3
---

# Credit Workflow

The credit workflow is the central process of Cred System Lab. It simulates the analysis pipeline that a real credit system would execute upon receiving a request — from initial validation through to the final approval or rejection decision.

---

## Workflow Overview

```
   Client / Frontend
          |
          | POST /api/credit/analyze
          v
+---------------------+
|  1. Eligibility     |<-- Initial client validation
|                     |    (data, format, basic rules)
+----------+----------+
           | Eligible
           v
+---------------------+
|  2. Risk Analysis   |<-- Chained internal calls
|                     |    Simulated external queries
|   +---------------+ |    Intensive processing
|   | Score         | |
|   | History       | |
|   | Capacity      | |
|   +---------------+ |
+----------+----------+
           | Risk calculated
           v
+---------------------+
|  3. Final Decision  |<-- Approval or Rejection
|                     |    based on consolidated risk
+----------+----------+
           |
           v
     JSON Response
  { status, amount, reason }
```

---

## Step 1 — Eligibility

The first step performs the **initial validation** of the client before any costly processing begins.

### What is checked

- Presence and format of required fields (ID, amount, profile data)
- Basic business rules (minimum and maximum amount, age range, etc.)
- Data consistency

### Behavior

If the client is **not eligible**, the workflow is immediately terminated and a rejection response is returned without proceeding to subsequent steps. This simulates the behavior of real systems that avoid unnecessary processing.

### Response on ineligibility

```json
{
  "status": "REJECTED",
  "step": "ELIGIBILITY",
  "reason": "Invalid ID or amount outside the permitted range"
}
```

---

## Step 2 — Risk Analysis

The most complex step in the workflow. Simulates the behavior of a system that makes **multiple chained internal and external calls** to calculate client risk.

### Simulated sub-processes

| Sub-process | Description | Simulated Latency |
|---|---|---|
| Score Query | Simulated credit bureau lookup | High (~800ms) |
| Payment History | Internal delinquency analysis | Medium (~300ms) |
| Payment Capacity | Income vs. commitment calculation | Low (~100ms) |
| Identity Validation | Simulated external query | High (~600ms) |

:::info Why simulated latencies?
The artificial latencies are intentional. They make the system behave like a real production environment, where calls to external APIs introduce response time variation. This makes load tests more representative.
:::

### Risk Calculation

After all sub-processes complete, the risk is consolidated into a score between `0` and `100`:

| Risk Range | Classification | Action |
|---|---|---|
| 0 – 30 | Low | Automatic approval |
| 31 – 60 | Medium | Approval with additional review |
| 61 – 80 | High | Conditional approval or limit reduction |
| 81 – 100 | Critical | Rejection |

---

## Step 3 — Final Decision

Based on the calculated risk, the system issues the **final decision** of the analysis.

### Possible outcomes

**Approval**
```json
{
  "status": "APPROVED",
  "approvedAmount": 15000.00,
  "interestRate": 2.5,
  "maxTerm": 36,
  "risk": "LOW",
  "score": 24
}
```

**Conditional Approval**
```json
{
  "status": "CONDITIONALLY_APPROVED",
  "approvedAmount": 8000.00,
  "interestRate": 4.2,
  "maxTerm": 24,
  "risk": "MEDIUM",
  "score": 55
}
```

**Rejection**
```json
{
  "status": "REJECTED",
  "step": "FINAL_DECISION",
  "reason": "Risk score above the permitted threshold",
  "risk": "CRITICAL",
  "score": 87
}
```

---

## API Contract

### Main endpoint

```
POST /api/credit/analyze
Content-Type: application/json
```

### Request payload

```json
{
  "documentId": "123-456-789",
  "name": "John Smith",
  "dateOfBirth": "1985-04-15",
  "requestedAmount": 15000.00,
  "termMonths": 36,
  "monthlyIncome": 5000.00
}
```

### Required fields

| Field | Type | Description |
|---|---|---|
| `documentId` | `string` | Client identifier |
| `requestedAmount` | `number` | Amount in currency |
| `monthlyIncome` | `number` | Gross monthly income |
| `termMonths` | `integer` | Desired term in months |

---

## Total Response Time

Total response time varies depending on the step where the workflow ends:

| Scenario | Estimated Time |
|---|---|
| Rejection at eligibility | < 50ms |
| Fast approval (low risk) | ~1.2s |
| Full analysis (medium/high risk) | ~1.8s – 2.5s |

These values are intentionally calibrated to simulate the real variability of production credit systems and make stress tests more meaningful.

---

## Relevance for Stress Testing

The credit workflow is the **primary target** of load tests. Because it involves multiple steps with accumulated latencies, it is possible to observe:

- How the backend behaves under hundreds of simultaneous requests
- Which step causes the most resource contention
- How average latency grows as request volume increases
- What the system's saturation point is
