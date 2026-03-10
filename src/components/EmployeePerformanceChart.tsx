import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EmployeePerformanceChartProps {
  data: Array<{
    name: string;
    score: number;
    casesHandled: number;
  }>;
}

export function EmployeePerformanceChart({ data }: EmployeePerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#10b981" name="Performance Score" />
            <Line type="monotone" dataKey="casesHandled" stroke="#3b82f6" name="Cases Handled" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}