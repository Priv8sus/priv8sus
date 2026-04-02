import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const SENTRY_ENV = import.meta.env.VITE_SENTRY_ENV || 'production';

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] No DSN configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      console.error('[Sentry] Captured error:', event.exception?.values?.[0]?.value);
      return event;
    },
  });
}

export function setSentryUser(userId: number, email?: string) {
  Sentry.setUser({
    id: userId.toString(),
    email,
  });
}

export function captureSentryMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

export function captureSentryException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

export { Sentry };
