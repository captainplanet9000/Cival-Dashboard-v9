import SwaggerApiDocs from '@/components/api-docs/SwaggerApiDocs'

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <SwaggerApiDocs />
    </div>
  )
}

export const metadata = {
  title: 'API Documentation - AI Trading Dashboard',
  description: 'Comprehensive API documentation for the Advanced Multi-Agent Trading Platform with 25+ endpoints'
}