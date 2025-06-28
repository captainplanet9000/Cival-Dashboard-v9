/**
 * COMPLETELY CLEAN TEST - Zero imports, inline everything
 * Testing if the issue is project-wide or component-specific
 */

'use client'

export default function TestCleanPage() {
  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>
        Clean Test Page
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '24px',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
            Zero Imports Test
          </h2>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '8px' }}>
            ✅ Testing
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            This component has absolutely no imports - everything is inline
          </p>
        </div>

        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '24px',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
            Project Test
          </h2>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Isolating
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Testing if the circular dependency is project-wide
          </p>
        </div>

        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          padding: '24px',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
            Module 43686
          </h2>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Investigation
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Pure HTML/CSS - no React components, no dependencies
          </p>
        </div>
      </div>

      <div style={{ 
        border: '1px solid #dbeafe', 
        borderRadius: '8px', 
        padding: '24px',
        marginTop: '24px',
        backgroundColor: '#eff6ff'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
          🔬 Ultimate Clean Test
        </h2>
        <p style={{ fontSize: '14px', color: '#1e40af', lineHeight: '1.5' }}>
          This page has ZERO external dependencies:
          <br />• No React component imports
          <br />• No external library imports  
          <br />• No shadcn/ui components
          <br />• No @/lib/utils imports
          <br />• Everything is pure HTML with inline styles
          <br /><br />
          If this page loads without module 43686 errors, the issue is with 
          component imports or dependencies. If this page ALSO fails, the 
          issue is fundamental to this Next.js project configuration.
        </p>
      </div>
    </div>
  )
}