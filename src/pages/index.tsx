import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Software engineering laboratory focused on microservices architecture, credit simulation, and observability.">
      <HomepageHeader />
      <main>
        <section className="container" style={{padding: '3rem 0'}}>
          <div className="row">
            <div className="col col--4">
              <div className="text--center padding-horiz--md">
                <Heading as="h3">Microservices</Heading>
                <p>Study distributed system behavior under real load, with simulated inter-service latencies.</p>
              </div>
            </div>
            <div className="col col--4">
              <div className="text--center padding-horiz--md">
                <Heading as="h3">Stress Testing</Heading>
                <p>Run load tests with hundreds of concurrent users and observe the impact in real time.</p>
              </div>
            </div>
            <div className="col col--4">
              <div className="text--center padding-horiz--md">
                <Heading as="h3">Observability</Heading>
                <p>Visualize latency, throughput, and error metrics with Prometheus and Grafana.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
