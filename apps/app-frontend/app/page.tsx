import { Button } from '@/components/ui';

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold text-gradient">
          Welcome to U-PCB
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl">
          Unified Platform for Cloud-based Policy and Compliance. Secure your
          cloud infrastructure with intelligent scanning, policy management, and
          real-time alerts.
        </p>
        <div className="flex gap-4 pt-4">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Cloud Scanning</h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Comprehensive scanning of your cloud infrastructure to identify
            security risks and compliance issues.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-secondary-600 dark:text-secondary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Policy Management</h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Create, manage, and enforce security policies across your entire
            cloud infrastructure.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 bg-info-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-info-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Real-time Alerts</h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Instant notifications for security events, violations, and
            compliance issues.
          </p>
        </div>
      </section>
    </div>
  );
}
