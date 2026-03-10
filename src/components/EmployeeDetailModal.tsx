import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Award, Calendar } from 'lucide-react';
import { EmployeeKPITab } from './EmployeeKPITab';

interface EmployeeDetailModalProps {
  employee: any;
  metrics: any;
  goals: any[];
  reviews: any[];
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
}

export function EmployeeDetailModal({ employee, metrics, goals, reviews, open, onClose, onEdit, onDelete }: EmployeeDetailModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  if (!employee) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{employee.full_name} - Performance Review</DialogTitle>
            {(onEdit || onDelete) && (
              <div className="flex gap-2">
                {onEdit && (
                  <button
                    className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    onClick={onEdit}
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100"
                    onClick={() => setConfirmOpen(true)}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <DialogDescription>{employee.job_position} • {employee.work_email}</DialogDescription>

        {/* Confirmation dialog for delete */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm delete</DialogTitle>
              <DialogDescription>Are you sure you want to delete {employee.full_name}? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-gray-100" onClick={() => setConfirmOpen(false)}>Cancel</button>
                <button
                  className="px-3 py-1 rounded bg-red-600 text-white"
                  onClick={async () => {
                    try {
                      const res = await onDelete(String(employee.id));
                      if (res && res.error) {
                        console.error('Failed to delete employee', res.error);
                        toast({ title: 'Delete failed', description: res.error.message || JSON.stringify(res.error), variant: 'destructive' });
                        return;
                      }
                      toast({ title: 'Employee deleted' });
                      setConfirmOpen(false);
                      onClose();
                    } catch (err) {
                      console.error('Failed to delete employee', err);
                      toast({ title: 'Delete failed', description: err?.message || String(err), variant: 'destructive' });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="kpi">KPI Tracking</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-500">Projects</span>
                </div>
                <p className="text-2xl font-bold">{employee?.projects_count ?? metrics?.projects_completed ?? 0}</p>
                <p className="text-xs text-gray-500">{employee?.projects_in_progress ?? metrics?.projects_in_progress ?? 0} in progress</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-500">Conversions</span>
                </div>
                <p className="text-2xl font-bold">{employee?.conversions_count ?? metrics?.prospects_converted ?? 0}</p>
                <p className="text-xs text-gray-500">of {metrics?.prospects_created || 0} leads</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 text-purple-600 font-medium">R</span>
                  <span className="text-sm text-gray-500">Revenue</span>
                </div>
                <p className="text-2xl font-bold">R{Number(employee?.total_revenue ?? metrics?.revenue_generated ?? 0).toLocaleString()}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-500">Rating</span>
                </div>
                <p className="text-2xl font-bold">{(employee?.performance_rating ?? metrics?.performance_rating) ? Number(employee?.performance_rating ?? metrics?.performance_rating).toFixed(1) : 'N/A'}</p>

              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="goals" className="space-y-4">
            {goals.map((goal) => (
              <Card key={goal.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{goal.title}</h4>
                  <Badge>{goal.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                <Progress value={(goal.current_value / goal.target_value) * 100} className="mb-2" />
                <div className="flex justify-between text-sm">
                  <span>{goal.current_value} / {goal.target_value}</span>
                  <span className="text-gray-500">Due: {new Date(goal.due_date).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="kpi">
            <EmployeeKPITab 
              employeeId={employee.id} 
              employeeName={employee.full_name}
              jobPosition={employee.job_position}
            />
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold">{new Date(review.review_date).toLocaleDateString()}</span>
                  </div>
                  <Badge>Rating: {review.overall_rating}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-green-600">Strengths:</p>
                    <p className="text-gray-600">{review.strengths}</p>
                  </div>
                  <div>
                    <p className="font-medium text-orange-600">Areas for Improvement:</p>
                    <p className="text-gray-600">{review.areas_for_improvement}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="activity">
            <p className="text-gray-500">Activity timeline coming soon...</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
