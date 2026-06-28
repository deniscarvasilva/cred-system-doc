---
id: intro
title: Introduction
sidebar_label: Introduction
sidebar_position: 1
---

# Cred System Lab

**Cred System Lab** is a software engineering laboratory designed to simulate, analyze, and observe the behavior of distributed systems under high-load scenarios — focused on credit approval workflows.

---

## What is this project?

Cred System Lab is a controlled environment that replicates the complexity of a real credit system, enabling:

- Studying **service-to-service latency** in chained synchronous calls
- Simulating **production environments** with multiple concurrent users
- Analyzing **behavior under extreme load** through stress testing
- Visualizing **real-time metrics** with Prometheus and Grafana

The project is not intended to build a real credit product. Its focus is **educational and technical**: understanding how distributed systems behave and how to observe them.

---

## Motivation

Credit systems are classic examples of workflows with multiple internal dependencies, complex business rules, and low-latency requirements. They involve:

- Queries to external services (credit bureaus, scoring APIs)
- Parallel and sequential rule processing
- Decision-making based on multiple factors

These characteristics make the credit domain ideal for studying **microservices, resilience, and observability**.

---

## System Components

| Component | Technology | Responsibility |
|---|---|---|
| Backend | Spring Boot (Java 17+) | REST API, credit workflow, metrics |
| Frontend | Angular | Dashboard, simulation, visualization |
| Stress Testing | Python | Load generation, user simulation |
| Metrics | Prometheus + Grafana | Metrics collection and visualization |

---

## Learning Goals

- Understand the behavior of distributed systems under load
- Measure and interpret end-to-end latency
- Configure observability with Prometheus and Grafana
- Run stress tests with real metrics
- Visualize performance data in dashboards

---

## How to Use This Documentation

This documentation is organized into the following sections:

- [**Architecture**](./architecture) — overview of components and their relationships
- [**Credit Workflow**](./credit-workflow) — detailed breakdown of the analysis and decision pipeline
- [**Backend — Spring Boot**](./backend-spring) — APIs, configuration, and metrics
- [**Frontend — Angular**](./frontend-angular) — dashboard and simulation
- [**Stress Test — Python**](./stress-test-python) — load generation and analysis
- [**Observability**](./observability) — Prometheus, Grafana, and Spring Actuator

---

:::tip Recommended starting point
Start with the [**Architecture**](./architecture) section to get a high-level view of the system before exploring individual components.
:::
