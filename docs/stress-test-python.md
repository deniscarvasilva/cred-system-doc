---
id: stress-test-python
title: Stress Test — Python
sidebar_label: Stress Test (Python)
sidebar_position: 6
---

# Stress Test — Python

The stress testing module is a **Python** robot that simulates multiple users sending simultaneous requests to the backend. The goal is to generate controlled load and observe system behavior under pressure — measuring latency, throughput, and error rate.

---

## Technologies

| Library | Purpose |
|---|---|
| `asyncio` | Async event loop |
| `httpx` | Async HTTP client |
| `rich` | Formatted terminal output |
| `csv` / `json` | Results export |

---

## Project Structure

```
stress-test/
+-- runner.py            ← Main entry point
+-- config.py            ← Test configuration (URL, workers, amounts)
+-- payloads.py          ← Request payload generation
+-- reporter.py          ← Results collection and display
+-- requirements.txt
+-- results/
    +-- result_YYYYMMDD_HHMMSS.csv
```

---

## How It Works

The stress tester creates a **pool of async workers**, each representing a virtual user. All workers send requests to the `/api/credit/analyze` endpoint concurrently for the configured duration.

```
+------------------------------------------+
|           Stress Test Runner             |
|                                          |
|  +--------+  +--------+  +--------+     |
|  |User #1 |  |User #2 |  |User #N |     |
|  +---+----+  +---+----+  +---+----+     |
|      |           |           |           |
|      +-----------+-----------+           |
|                  | POST /api/credit/analyze
+------------------+-----------------------+
                   |
                   v
          Spring Boot Backend
```

---

## Configuration

### `config.py`

```python
BASE_URL = "http://localhost:8080/api/credit/analyze"

# Number of simultaneous users
CONCURRENT_USERS = 50

# Total test duration in seconds
DURATION_SECONDS = 120

# Simulated credit amounts
CREDIT_AMOUNTS = [10_000, 15_000, 25_000, 50_000, 100_000]

# Simulated terms (months)
TERMS = [12, 24, 36, 48, 60]

# Per-request timeout (seconds)
TIMEOUT = 10
```

---

## Payload Generation

### `payloads.py`

```python
import random
from faker import Faker

fake = Faker("en_US")

def generate_payload() -> dict:
    return {
        "documentId": fake.ssn(),
        "name": fake.name(),
        "requestedAmount": random.choice([10_000, 15_000, 25_000, 50_000]),
        "termMonths": random.choice([12, 24, 36, 48]),
        "monthlyIncome": round(random.uniform(1_500, 20_000), 2)
    }
```

Each request uses randomly generated data to simulate distinct clients, avoiding cache hits or optimizations based on repeated input.

---

## Running the Stress Test

### `runner.py`

```python
import asyncio
import httpx
from config import BASE_URL, CONCURRENT_USERS, DURATION_SECONDS, TIMEOUT
from payloads import generate_payload
from reporter import Reporter

reporter = Reporter()

async def worker(user_id: int, client: httpx.AsyncClient):
    while reporter.within_time_limit():
        payload = generate_payload()
        try:
            start = asyncio.get_event_loop().time()
            response = await client.post(BASE_URL, json=payload, timeout=TIMEOUT)
            duration_ms = (asyncio.get_event_loop().time() - start) * 1000
            reporter.record(
                user_id=user_id,
                status=response.status_code,
                latency_ms=duration_ms,
                result=response.json().get("status")
            )
        except httpx.TimeoutException:
            reporter.record_timeout(user_id)
        except Exception as e:
            reporter.record_error(user_id, str(e))

async def main():
    reporter.start(DURATION_SECONDS)
    async with httpx.AsyncClient() as client:
        tasks = [worker(i, client) for i in range(CONCURRENT_USERS)]
        await asyncio.gather(*tasks)
    reporter.print_report()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## How to Run

### Prerequisites

```bash
# Python 3.10+
python --version

# Install dependencies
pip install -r requirements.txt
```

### `requirements.txt`

```
httpx==0.27.0
faker==24.0.0
rich==13.7.0
```

### Run the test

```bash
# With default configuration
python runner.py

# With custom parameters via environment variables
CONCURRENT_USERS=100 DURATION_SECONDS=300 python runner.py
```

---

## Terminal Output

During execution, the terminal displays a real-time panel:

```
+======================================================+
|              CRED SYSTEM — STRESS TEST               |
+======================================================+
|  Concurrent users     : 50                           |
|  Elapsed time         : 00:01:23 / 00:02:00          |
|  Requests sent        : 3,842                        |
|  Req/second           : 46.3                         |
+======================================================+
|  APPROVED             : 2,891 (75.2%)                |
|  REJECTED             : 821   (21.4%)                |
|  ERRORS / TIMEOUTS    : 130   (3.4%)                 |
+======================================================+
|  Min latency          : 128ms                        |
|  Avg latency          : 1,247ms                      |
|  Max latency          : 8,932ms                      |
|  P95                  : 2,103ms                      |
|  P99                  : 4,871ms                      |
+======================================================+
```

---

## Final Report

At the end of the test, a CSV file is generated in `results/`:

```csv
timestamp,user_id,latency_ms,http_status,credit_result
2026-06-28T10:01:01.123Z,3,1247,200,APPROVED
2026-06-28T10:01:01.456Z,12,843,200,REJECTED
2026-06-28T10:01:01.789Z,7,9201,0,TIMEOUT
...
```

This file can be imported into Grafana or analyzed with Python/pandas for historical reporting.

---

## Recommended Test Scenarios

| Scenario | Users | Duration | Goal |
|---|---|---|---|
| Smoke test | 5 | 30s | Verify the system responds |
| Moderate load | 20 | 120s | Normal behavior baseline |
| High load | 50 | 180s | Onset of saturation |
| Peak stress | 100 | 300s | Breaking point |
| Spike test | 5 → 200 → 5 | 120s | System elasticity |

---

## What to Watch During the Test

1. **Rising average latency** — sign that backend threads are saturating
2. **Increasing timeouts** — backend cannot respond within the time limit
3. **500 errors** — possible resource exhaustion (memory, connections)
4. **Dropping throughput** — system can no longer accept new requests efficiently

All these signals are captured by Prometheus and visualized in Grafana in real time.
