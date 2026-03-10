import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, RefreshCw, Wrench } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HealthCheckResult {
  status: string;
  timestamp: string;
  issues: any[];
  warnings: any[];
  summary: {
    total_issues: number;
    total_warnings: number;
    tables_checked: number;
  };
}

export default function DatabaseHealthDashboard() {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/functions/database-health-check', { method: 'POST' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Health check failed');
      setHealthData(json.data);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyMigrations = async () => {
    if (!healthData?.issues.length) return;
    
    setMigrating(true);
    try {
      const migrations = healthData.issues
        .filter(issue => issue.category === 'column')
        .map(issue => {
          // Extract the expected data type from the message
          const dataTypeMatch = issue.message.match(/of type '([^']+)'/);
          const dataType = dataTypeMatch ? dataTypeMatch[1] : 'TEXT';
          
          // Map SQL types to proper format
          const typeMapping: Record<string, string> = {
            'uuid': 'UUID',
            'text': 'TEXT',
            'integer': 'INTEGER',
            'numeric': 'NUMERIC(10, 2)',
            'date': 'DATE',
            'timestamp with time zone': 'TIMESTAMP WITH TIME ZONE'
          };
          
          const mappedType = typeMapping[dataType.toLowerCase()] || dataType.toUpperCase();
          
          return {
            type: 'add_column',
            table: issue.table,
            column: issue.column,
            dataType: mappedType,
            required: issue.column === 'id' || issue.column === 'name' || issue.column === 'email',
            defaultValue: issue.column === 'created_at' || issue.column === 'updated_at' ? 'NOW()' : 
                         mappedType === 'INTEGER' ? '0' :
                         mappedType === 'TEXT' ? "''" : null
          };
        });

      const resp = await fetch('/api/functions/apply-database-migrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrations })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Migration failed');
      console.log('Migrations applied:', json);
      setTimeout(() => runHealthCheck(), 1000);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Health Dashboard</h1>
          <p className="text-muted-foreground">Monitor schema integrity and apply migrations</p>
        </div>
        <Button onClick={runHealthCheck} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Run Health Check
        </Button>
      </div>

      {healthData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {healthData.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-2xl font-bold capitalize">{healthData.status.replace('_', ' ')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.summary.total_issues}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tables Checked</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.summary.tables_checked}</div>
              </CardContent>
            </Card>
          </div>

          {healthData.issues.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Schema Issues</CardTitle>
                    <CardDescription>Database schema validation errors</CardDescription>
                  </div>
                  <Button onClick={applyMigrations} disabled={migrating}>
                    <Wrench className="mr-2 h-4 w-4" />
                    {migrating ? 'Applying...' : 'Apply Fixes'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthData.issues.map((issue, idx) => (
                    <Alert key={idx} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant="outline" className="mr-2">{issue.category}</Badge>
                            <Badge variant="outline" className="mr-2">{issue.table}</Badge>
                            {issue.column && <Badge variant="outline">{issue.column}</Badge>}
                            <p className="mt-1">{issue.message}</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}