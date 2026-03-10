import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RevenueChartProps {
  data: Record<string, number>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    revenue: value
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Visa Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `R${Number(value).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}