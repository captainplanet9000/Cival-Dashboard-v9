'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Database } from 'lucide-react'

const FileManagerDashboard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          File Manager
        </CardTitle>
        <CardDescription>File management with Supabase storage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <Database className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">File Management</h3>
          <p className="text-muted-foreground mb-4">Supabase storage integration for file uploads and management</p>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Supabase Storage Ready
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default FileManagerDashboard