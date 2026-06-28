---
id: architecture
title: Architecture
sidebar_label: Architecture
sidebar_position: 2
---

# System Architecture

Cred System Lab is structured in independent layers that communicate through well-defined protocols. The separation between frontend, backend, observability, and stress testing allows each component to be studied in isolation or together.

---

## Overview

```
+----------------------------------------------------------------+
|                        CRED SYSTEM LAB                         |
|                                                                |
|  +--------------+        +----------------------------------+  |
|  |   Frontend   |<------>|         Backend                  |  |
|  |   Angular    |  HTTP  |      Spring Boot (Java 17+)      |  |
|  |              |        |                                  |  |
|  |  - Dashboard |        |  - REST API                      |  |
|  |  - Simulation|        |  - Credit Workflow               |  |
|  |  - Metrics   |        |  - Spring Actuator               |  |
|  +--------------+        +---------------+------------------+  |
|                                          |                     |
|  +--------------+                        | /actuator           |
|  | Stress Test  |-------------->         | /prometheus         |
|  |   Python     |  HTTP (load)   +-------v------------------+  |
|  |              |                |     Observability         | |
|  |  - Users     |                |                           | |
|  |  - Requests  |                |  Prometheus --> Grafana   | |
|  |  - Reports   |                |                           | |
|  +--------------+                +---------------------------+ |
+----------------------------------------------------------------+
```

---

## Components

### Frontend — Angular

The system's graphical interface. Consumes the backend APIs via HTTP and displays data in real time.

**Responsibilities:**
- Main dashboard with system status
- Credit simulation form
- Latency and request volume charts
- Step-by-step workflow status visualization

**Communication:** HTTP REST with the Spring Boot backend.

---

### Backend — Spring Boot

The system's core. Implements the credit workflow, exposes REST APIs, and generates metrics via Spring Actuator.

**Responsibilities:**
- Receive credit analysis requests
- Execute workflow steps (eligibility → risk → decision)
- Expose metrics at `/actuator/prometheus`
- Simulate business rules with controlled latencies

**Technology:** Java 17+, Spring Boot 3.x, Spring Web, Spring Actuator, Micrometer.

---

### Stress Testing — Python

The load generation robot. Fires requests in bulk against the backend to simulate high-concurrency scenarios.

**Responsibilities:**
- Simulate multiple simultaneous users
- Send requests with different credit amounts
- Record latencies and error rates
- Produce performance reports

**Technology:** Python 3.x, async HTTP libraries (e.g. `httpx`, `asyncio`).

---

### Observability — Prometheus + Grafana

The monitoring layer. Collects metrics from the backend and presents them in visual dashboards.

**Responsibilities:**
- Prometheus: periodic scraping of `/actuator/prometheus`
- Grafana: real-time visualization of latency, throughput, and errors

**Technology:** Prometheus, Grafana, Spring Actuator (Micrometer).

---

## Communication Flow

```
                         Credit Request
                              |
        +---------------------v----------------------+
        |               Angular (UI)                  |
        |  User fills out form and submits             |
        +---------------------+----------------------+
                              | POST /api/credit/analyze
                              v
        +---------------------------------------------+
        |            Spring Boot (Backend)             |
        |                                             |
        |  1. Eligibility Check                       |
        |  2. Risk Analysis                           |
        |  3. Final Decision                          |
        +---------------------+-----------------------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
         Response          Metrics          Logs
          (JSON)      /actuator/prometheus
              |               |
              v               v
           Angular        Prometheus
            (UI)              |
                              v
                           Grafana
                         (Dashboard)
```

---

## Design Decisions

### Why Spring Boot?

Spring Boot offers native integration with Micrometer and Spring Actuator, which eliminates manual configuration for metrics exposure. Its widespread adoption in enterprise ecosystems also makes it ideal for simulating real credit applications.

### Why Angular?

Angular is widely adopted in financial and corporate systems. Its component model and RxJS support make it straightforward to build reactive dashboards with real-time updates.

### Why Python for stress testing?

Python offers mature async libraries (`asyncio`, `httpx`, `aiohttp`) that can simulate thousands of concurrent connections with minimal code. The language's readability also makes test scripts easy to maintain.

### Why Prometheus + Grafana?

This combination is the industry standard for observability in distributed systems. Spring Actuator natively exposes metrics in the Prometheus format, requiring no additional instrumentation.

---

## Default Ports and Endpoints

| Service | Port | Main Endpoint |
|---|---|---|
| Backend (Spring Boot) | `8080` | `/api/credit/analyze` |
| Spring Actuator | `8080` | `/actuator/prometheus` |
| Prometheus | `9090` | `/` |
| Grafana | `3000` | `/` |
| Frontend (Angular) | `4200` | `/` |
