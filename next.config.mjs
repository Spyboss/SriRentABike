import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  reactStrictMode: true,
}

export default withSentryConfig(nextConfig, { silent: true })
