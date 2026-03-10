import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeCard } from './EmployeeCard';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Download, Filter } from 'lucide-react';

interface EmployeesViewProps {
  employees: any[];
  metrics: any[];
  goals: any[];
  reviews: any[];
  onAddEmployee: (data?: any) => Promise<any> | void;
  onEditEmployee?: (id: string, data: any) => Promise<any> | void;
  onCalculateMetrics: (employeeId: string) => void;
  onDeleteEmployee?: (id: string) => void;
}

export function EmployeesView({ 
  employees, 
  metrics, 
  goals, 
  reviews, 
  onAddEmployee,
  onEditEmployee,
  onCalculateMetrics,
  onDeleteEmployee
}: EmployeesViewProps) {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filter employees based on user permissions
  // Users can see all employees if they are super admin OR have view_all_data permission
  const canViewAllEmployees = isSuperAdmin || hasPermission('view_all_data');
  const visibleEmployees = canViewAllEmployees 
    ? employees 
    : employees.filter(emp => emp.work_email === user?.email);

  const filteredEmployees = visibleEmployees.filter(emp => {
    const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === 'all' || emp.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  const getEmployeeMetrics = (employeeId: string) => {
    return metrics.find(m => m.employee_id === employeeId);
  };

  const getEmployeeGoals = (employeeId: string) => {
    return goals.filter(g => g.employee_id === employeeId);
  };

  const getEmployeeReviews = (employeeId: string) => {
    return reviews.filter(r => r.employee_id === employeeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Employee Performance</h2>
          <p className="text-gray-500">{canViewAllEmployees ? 'Manage and evaluate team performance' : 'Your Profile'}</p>
        </div>
        <div className="flex gap-2">
          {canViewAllEmployees && (
            <>
              <Button variant="outline" onClick={() => {}}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </>
          )}
        </div>
      </div>

      {canViewAllEmployees && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Consulting">Consulting</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            metrics={getEmployeeMetrics(employee.id)}
            onClick={() => handleEmployeeClick(employee)}
          />
        ))}
      </div>

      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          metrics={getEmployeeMetrics(selectedEmployee.id)}
          goals={getEmployeeGoals(selectedEmployee.id)}
          reviews={getEmployeeReviews(selectedEmployee.id)}
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
          onDelete={onDeleteEmployee}
        />
      )}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (data) => {
          try {
            const res = await onAddEmployee?.(data as any);
            if (res && res.error) {
              console.error('Failed to add employee from modal', res.error);
            }
          } catch (err) {
            console.error('Failed to add employee from modal', err);
          }
        }}
      />
      {selectedEmployee && (
        <EditEmployeeModal
          isOpen={showEditModal}
          employee={selectedEmployee}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          onSubmit={async (data) => {
            try {
              const res = await onEditEmployee?.(String(selectedEmployee.id), data);
              if (res && res.error) {
                console.error('Failed to edit employee', res.error);
                throw res.error;
              }
              // Update the selected employee with new data
              setSelectedEmployee({ ...selectedEmployee, ...data });
            } catch (err) {
              console.error('Failed to edit employee from modal', err);
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
