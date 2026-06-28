---
id: backend-spring
title: Backend — Spring Boot
sidebar_label: Backend (Spring Boot)
sidebar_position: 4
---

# Backend — Spring Boot

The Cred System Lab backend is built with **Spring Boot (Java 17+)** and is the system's central component. It implements the credit analysis workflow, exposes REST APIs consumed by the frontend and stress tester, and generates performance metrics via Spring Actuator.

---

## Technologies

| Technology | Version | Purpose |
|---|---|---|
| Java | 17+ | Base language |
| Spring Boot | 3.x | Main framework |
| Spring Web | — | REST APIs |
| Spring Actuator | — | Metrics and health check exposure |
| Micrometer | — | Metrics instrumentation |
| Micrometer Prometheus | — | Prometheus-format export |

---

## Package Structure

```
src/
└── main/
    └── java/
        └── com.credsystem/
            ├── controller/
            │   └── CreditController.java
            ├── service/
            │   ├── EligibilityService.java
            │   ├── RiskService.java
            │   └── DecisionService.java
            ├── model/
            │   ├── CreditRequest.java
            │   └── AnalysisResult.java
            └── CredSystemApplication.java
```

---

## REST APIs

### `POST /api/credit/analyze`

Main endpoint. Receives a credit request and executes the full analysis workflow.

**Request Body:**
```json
{
  "documentId": "123-456-789",
  "name": "John Smith",
  "requestedAmount": 15000.00,
  "termMonths": 36,
  "monthlyIncome": 5000.00
}
```

**Response (200 OK):**
```json
{
  "status": "APPROVED",
  "approvedAmount": 15000.00,
  "interestRate": 2.5,
  "maxTerm": 36,
  "risk": "LOW",
  "score": 24,
  "processingTimeMs": 1247
}
```

---

### `GET /api/credit/status`

Returns the current system status and basic session statistics.

**Response:**
```json
{
  "status": "UP",
  "totalRequests": 1482,
  "approvals": 1105,
  "rejections": 377,
  "averageLatencyMs": 1380
}
```

---

### `GET /actuator/health`

Standard Spring Actuator health check.

```json
{
  "status": "UP"
}
```

---

### `GET /actuator/prometheus`

Metrics endpoint in Prometheus format. Scraped periodically by the Prometheus server.

```
# HELP http_server_requests_seconds Duration of HTTP server request handling
# TYPE http_server_requests_seconds summary
http_server_requests_seconds_count{method="POST",status="200",uri="/api/credit/analyze"} 1482
http_server_requests_seconds_sum{method="POST",status="200",uri="/api/credit/analyze"} 2043.512
...
```

---

## Configuration

### `application.properties`

```properties
# Server
server.port=8080

# Actuator — expose all endpoints
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always

# Prometheus
management.prometheus.metrics.export.enabled=true

# Logs
logging.level.com.credsystem=DEBUG
```

---

## Latency Simulation

The backend intentionally simulates latencies at each workflow step to replicate the behavior of real external APIs.

```java
@Service
public class RiskService {

    public RiskResult analyze(CreditRequest request) throws InterruptedException {
        // Simulate external bureau query
        Thread.sleep(800);
        int creditScore = calculateScore(request);

        // Simulate payment history analysis
        Thread.sleep(300);
        boolean noRestrictions = checkHistory(request.getDocumentId());

        // Simulate capacity calculation
        Thread.sleep(100);
        double capacity = calculateCapacity(request);

        return consolidateRisk(creditScore, noRestrictions, capacity);
    }
}
```

:::warning Intentional latencies
The `Thread.sleep()` calls are deliberate. They simulate the response time of external APIs (credit bureaus, legacy systems) and are critical for stress tests to produce representative data.
:::

---

## Generated Metrics

Spring Actuator with Micrometer automatically generates HTTP metrics. The system also exposes custom metrics:

| Metric | Type | Description |
|---|---|---|
| `http_server_requests_seconds` | Histogram | Latency and count of HTTP requests |
| `credit_analysis_total` | Counter | Total analyses processed |
| `credit_approval_total` | Counter | Total approvals |
| `credit_rejection_total` | Counter | Total rejections |
| `credit_risk_score` | Histogram | Risk score distribution |
| `jvm_memory_used_bytes` | Gauge | JVM memory usage |
| `jvm_threads_live_threads` | Gauge | Active threads |

---

## CORS

The backend is configured with CORS enabled to accept requests from the Angular frontend during development:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

---

## How to Run

### Prerequisites

- Java 17 or higher
- Maven 3.8+

### Start the backend

```bash
# Compile and run
mvn spring-boot:run

# Or with Maven Wrapper
./mvnw spring-boot:run
```

### Verify it is running

```bash
# Health check
curl http://localhost:8080/actuator/health

# Test credit analysis
curl -X POST http://localhost:8080/api/credit/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "111-222-333",
    "name": "Jane Doe",
    "requestedAmount": 10000.00,
    "termMonths": 24,
    "monthlyIncome": 4500.00
  }'
```

---

## Error Handling

| HTTP Code | Scenario |
|---|---|
| `200 OK` | Analysis completed (approved or rejected) |
| `400 Bad Request` | Invalid payload or missing required fields |
| `422 Unprocessable Entity` | Valid data but client is not eligible |
| `500 Internal Server Error` | Unexpected internal error |

```json
{
  "error": "VALIDATION",
  "message": "Field 'requestedAmount' must be greater than zero",
  "field": "requestedAmount",
  "timestamp": "2026-06-28T10:35:42Z"
}
```
