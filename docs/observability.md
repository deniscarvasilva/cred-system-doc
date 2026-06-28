---
id: observability
title: Observability
sidebar_label: Observability
sidebar_position: 7
---

# Observability

The Cred System Lab observability layer allows real-time monitoring of system behavior during normal operations and under stress. It is composed of three integrated components: **Spring Actuator**, **Prometheus**, and **Grafana**.

---

## Observability Architecture

```
+---------------------------------------------------------+
|                    Spring Boot                          |
|                                                         |
|  +-------------------------------------------------+   |
|  |              Spring Actuator                     |   |
|  |  /actuator/health    /actuator/prometheus        |   |
|  +-------------------------+-----------------------+   |
+----------------------------+----------------------------+
                             | scrape every 15s
                             v
                  +----------------------+
                  |      Prometheus      |
                  |  (collects & stores) |
                  +----------+-----------+
                             | PromQL queries
                             v
                  +----------------------+
                  |       Grafana        |
                  |  (visual dashboards) |
                  +----------------------+
```

---

## Spring Actuator

**Spring Actuator** is the backend's instrumentation layer. With the `micrometer-registry-prometheus` dependency, it automatically exposes dozens of JVM and application metrics in a Prometheus-compatible format.

### Configuration

```properties
# application.properties
management.endpoints.web.exposure.include=health,info,prometheus,metrics
management.endpoint.health.show-details=always
management.prometheus.metrics.export.enabled=true
```

### Maven dependency

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

### Available endpoints

| Endpoint | Description |
|---|---|
| `/actuator/health` | Overall service status |
| `/actuator/prometheus` | Metrics in Prometheus format |
| `/actuator/metrics` | List of all available metrics |
| `/actuator/info` | Application metadata |

### Automatically exposed metrics

| Metric | Description |
|---|---|
| `http_server_requests_seconds` | Latency and count of HTTP requests |
| `jvm_memory_used_bytes` | Heap and non-heap memory usage |
| `jvm_threads_live_threads` | Number of active threads |
| `jvm_gc_pause_seconds` | Garbage collection pause durations |
| `process_cpu_usage` | Process CPU usage |
| `system_cpu_usage` | System CPU usage |

---

## Prometheus

**Prometheus** periodically scrapes the metrics exposed by Spring Actuator and stores them in its time-series database.

### Installation and configuration

#### `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'cred-system-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'
```

### Start with Docker

```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### Verify collection

Open `http://localhost:9090/targets` to confirm the backend is being monitored with status **UP**.

### PromQL examples

```promql
# Requests per second over the last 5 minutes
rate(http_server_requests_seconds_count{uri="/api/credit/analyze"}[5m])

# Median latency (P50) for credit requests
histogram_quantile(0.50,
  rate(http_server_requests_seconds_bucket{uri="/api/credit/analyze"}[5m])
)

# P95 latency
histogram_quantile(0.95,
  rate(http_server_requests_seconds_bucket{uri="/api/credit/analyze"}[5m])
)

# P99 latency
histogram_quantile(0.99,
  rate(http_server_requests_seconds_bucket{uri="/api/credit/analyze"}[5m])
)

# HTTP 5xx error rate
rate(http_server_requests_seconds_count{status=~"5.."}[5m])

# Heap memory usage in MB
jvm_memory_used_bytes{area="heap"} / 1024 / 1024

# Active threads
jvm_threads_live_threads
```

---

## Grafana

**Grafana** queries Prometheus data via PromQL and displays it in interactive visual dashboards.

### Install with Docker

```bash
docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

Open: `http://localhost:3000`  
Default credentials: `admin` / `admin`

### Configure Prometheus datasource

1. Go to **Configuration → Data Sources → Add data source**
2. Select **Prometheus**
3. URL: `http://localhost:9090`
4. Click **Save & Test**

---

### Recommended dashboard — Cred System Lab

#### Panel 1 — Throughput (Requests/s)

```
Type: Graph
Query: rate(http_server_requests_seconds_count{uri="/api/credit/analyze"}[1m])
Legend: Req/s
```

#### Panel 2 — Latency P50 / P95 / P99

```
Type: Graph
Queries:
  A: histogram_quantile(0.50, rate(http_server_requests_seconds_bucket{uri="/api/credit/analyze"}[1m]))
  B: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{uri="/api/credit/analyze"}[1m]))
  C: histogram_quantile(0.99, rate(http_server_requests_seconds_bucket{uri="/api/credit/analyze"}[1m]))
Legends: P50, P95, P99
```

#### Panel 3 — Error Rate

```
Type: Stat
Query: rate(http_server_requests_seconds_count{status=~"5.."}[5m])
Thresholds: Green < 0.01 | Yellow < 0.05 | Red >= 0.05
```

#### Panel 4 — JVM Memory

```
Type: Gauge
Query: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}
Unit: Percentage (0-100%)
```

#### Panel 5 — Active Threads

```
Type: Stat
Query: jvm_threads_live_threads
Thresholds: Green < 50 | Yellow < 100 | Red >= 100
```

---

## Running with Docker Compose

Start the full observability stack with a single command:

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    extra_hosts:
      - "host.docker.internal:host-gateway"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - prometheus
```

```bash
# Start observability stack
docker compose up -d

# Check status
docker compose ps
```

:::tip Quick access
With Docker Compose running:
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (admin/admin)
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:4200`
:::

---

## What to Watch During the Stress Test

With the Python stress test running and Grafana open, you can observe in real time:

| Signal | What it indicates |
|---|---|
| P99 latency climbing > 5s | Backend thread pool saturating |
| Throughput dropping despite more users | System cannot scale linearly |
| GC pause spikes | Memory pressure, potential degradation |
| Active threads near pool maximum | Risk of thread starvation |
| 5xx error rate > 1% | System starting to drop requests |

These patterns are the **bottleneck signals** that Cred System Lab is designed to surface and study.
