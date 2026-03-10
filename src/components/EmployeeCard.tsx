import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, TrendingUp, Target, Award } from 'lucide-react';

interface EmployeeCardProps {
  employee: any;
  metrics: any;
  onClick: () => void;
}

export function EmployeeCard({ employee, metrics, onClick }: EmployeeCardProps) {
  const performanceRating = employee?.performance_rating ?? metrics?.performance_rating;
  const performanceColor = performanceRating >= 4 ? 'text-green-600' : 
                          performanceRating >= 3 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {employee.avatar_url ? (
            <img src={employee.avatar_url} alt={employee.full_name} className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg">{employee.full_name}</h3>
            <p className="text-sm text-gray-500">{employee.department}</p>
          </div>
        </div>
        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
          {employee.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Projects</p>
            <p className="font-semibold">{employee.projects_count || metrics?.projects_completed || 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Conversions</p>
            <p className="font-semibold">{employee.conversions_count || metrics?.prospects_converted || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <Award className={`w-5 h-5 ${performanceColor}`} />
          <span className="text-sm font-medium">Rating: {performanceRating ? Number(performanceRating).toFixed(1) : 'N/A'}</span>

        </div>
        <Button variant="outline" size="sm">View Details</Button>
      </div>
    </Card>
  );
}
