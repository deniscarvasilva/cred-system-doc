---
id: frontend-angular
title: Frontend — Angular
sidebar_label: Frontend (Angular)
sidebar_position: 5
---

# Frontend — Angular

The Cred System Lab frontend is an **Angular** application responsible for providing a graphical interface to interact with the system, simulate credit analyses, and visualize performance metrics in real time.

---

## Technologies

| Technology | Version | Purpose |
|---|---|---|
| Angular | 17+ | SPA framework |
| TypeScript | 5.x | Base language |
| RxJS | — | Reactive programming and streams |
| Angular HttpClient | — | Backend communication |
| Chart.js / ng2-charts | — | Metrics charts |
| Angular Material | — | UI components |

---

## Module Structure

```
src/
└── app/
    ├── core/
    │   ├── services/
    │   │   ├── credit.service.ts        ← Credit API integration
    │   │   └── metrics.service.ts       ← Status metrics polling
    │   └── models/
    │       ├── credit-request.model.ts
    │       └── analysis-result.model.ts
    ├── features/
    │   ├── dashboard/
    │   │   ├── dashboard.component.ts
    │   │   └── dashboard.component.html
    │   ├── simulation/
    │   │   ├── simulation.component.ts
    │   │   └── simulation.component.html
    │   └── metrics/
    │       ├── metrics.component.ts
    │       └── metrics.component.html
    └── shared/
        └── components/
            ├── status-badge/
            └── latency-chart/
```

---

## Pages and Features

### Main Dashboard

Real-time overview of system state.

**What it displays:**
- Backend status (UP / DOWN)
- Counters for total requests, approvals, and rejections
- Approval rate as a percentage
- Average latency of the last N requests
- Chart of request volume per minute

**Update strategy:** data is reloaded periodically via polling or SSE (Server-Sent Events) depending on configuration.

---

### Credit Simulation

Interactive form for triggering an individual credit analysis.

**Form fields:**

| Field | Type | Validation |
|---|---|---|
| Document ID | Text | Format and check digits |
| Full name | Text | Minimum 3 characters |
| Requested amount | Numeric | Between $1,000 and $500,000 |
| Term (months) | Select | 12, 24, 36, 48, 60 |
| Monthly income | Numeric | Greater than zero |

**Result display:**

After submission, the result is shown with:
- Status (APPROVED / REJECTED / CONDITIONALLY_APPROVED) with a colored badge
- Approved amount and interest rate (when approved)
- Rejection reason (when rejected)
- Processing time in milliseconds
- Step where the workflow terminated (eligibility, risk, or decision)

---

### Metrics Visualization

Dedicated page for system performance charts.

**Available charts:**
- **Latency per request** — timeline with latency of each analysis
- **Result distribution** — pie chart with approvals vs. rejections
- **Volume by interval** — bar chart with requests per minute
- **Risk score** — histogram of score distribution

---

## Backend Integration

### `CreditService`

```typescript
@Injectable({ providedIn: 'root' })
export class CreditService {

  private readonly baseUrl = 'http://localhost:8080/api/credit';

  constructor(private http: HttpClient) {}

  analyze(request: CreditRequest): Observable<AnalysisResult> {
    return this.http.post<AnalysisResult>(
      `${this.baseUrl}/analyze`,
      request
    );
  }

  getStatus(): Observable<SystemStatus> {
    return this.http.get<SystemStatus>(`${this.baseUrl}/status`);
  }
}
```

### `MetricsService`

```typescript
@Injectable({ providedIn: 'root' })
export class MetricsService {

  private readonly pollingIntervalMs = 5000;

  getLiveMetrics(): Observable<SystemStatus> {
    return interval(this.pollingIntervalMs).pipe(
      switchMap(() => this.creditService.getStatus())
    );
  }
}
```

---

## TypeScript Models

```typescript
export interface CreditRequest {
  documentId: string;
  name: string;
  requestedAmount: number;
  termMonths: number;
  monthlyIncome: number;
}

export interface AnalysisResult {
  status: 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'REJECTED';
  approvedAmount?: number;
  interestRate?: number;
  maxTerm?: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  reason?: string;
  step?: string;
  processingTimeMs: number;
}

export interface SystemStatus {
  status: 'UP' | 'DOWN';
  totalRequests: number;
  approvals: number;
  rejections: number;
  averageLatencyMs: number;
}
```

---

## Environment Configuration

### `environment.ts` (development)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  pollingIntervalMs: 5000
};
```

### `environment.prod.ts` (production)

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://your-backend:8080/api',
  pollingIntervalMs: 10000
};
```

---

## How to Run

### Prerequisites

- Node.js 18+
- Angular CLI 17+

### Install dependencies and start

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Application available at:
# http://localhost:4200
```

### Production build

```bash
ng build --configuration production
```

---

## Behavior During Stress Test

While the Python stress test is running, the dashboard reflects in real time:

- Rapid growth in the request counter
- Increasing average latency as the backend saturates
- Variation in the approval rate
- Possible HTTP errors visible in the request log

This allows **visually observing** the impact of load on the system without needing to consult Grafana directly.
