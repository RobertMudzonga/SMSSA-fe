import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CompletionChartProps {
  data: {
    completed: number;
    inProgress: number;
    pending: number;
  };
}

export function CompletionChart({ data }: CompletionChartProps) {
  const chartData = [
    { name: 'Completed', value: data.completed, color: '#10b981' },
    { name: 'Submitted', value: data.inProgress, color: '#3b82f6' },
    { name: 'Pending', value: data.pending, color: '#f59e0b' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Completion Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}