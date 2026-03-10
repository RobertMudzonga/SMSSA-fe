import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any> | void;
}

export default function EditEmployeeModal({ isOpen, employee, onClose, onSubmit }: EditEmployeeModalProps) {
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [managerId, setManagerId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { isSuperAdmin: currentUserIsSuperAdmin } = useAuth();

  const jobPositions = [
    'Immigration Support Specialist',
    'Immigration Consultant',
    'Senior Consultant',
    'Sales Manager',
    'IT',
    'Finance'
  ];

  const departments = ['Sales', 'Project', 'Legal', 'Accounts', 'Management', 'IT'];

  useEffect(() => {
    if (isOpen && employee) {
      setFullName(employee.full_name || '');
      setWorkEmail(employee.work_email || '');
      setJobPosition(employee.job_position || '');
      setDepartment(employee.department || '');
      setManagerId(employee.manager_id || null);
      setIsActive(employee.is_active !== false);
      setIsSuperAdmin(employee.is_super_admin === true);
    }
  }, [isOpen, employee]);

  const handleSubmit = async () => {
    if (!fullName || !workEmail) {
      toast({ title: 'Please provide name and email', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const updateData = {
        full_name: fullName.trim(),
        work_email: workEmail.trim().toLowerCase(),
        job_position: jobPosition.trim(),
        department: department || null,
        manager_id: managerId,
        is_active: isActive,
        is_super_admin: isSuperAdmin,
      };

      await onSubmit(updateData);
      toast({ title: 'Employee updated successfully' });
      onClose();
    } catch (err) {
      console.error('Update employee failed', err);
      toast({ title: 'Failed to update employee', description: String(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update employee information</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Full name</div>
            <Input 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              disabled={submitting}
            />
          </label>

          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Work email</div>
            <Input 
              value={workEmail} 
              onChange={(e) => setWorkEmail(e.target.value)} 
              placeholder="name@immigrationspecialists.co.za"
              disabled={submitting}
            />
          </label>

          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Job position</div>
            <Select value={jobPosition} onValueChange={setJobPosition} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select job position" />
              </SelectTrigger>
              <SelectContent>
                {jobPositions.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Department</div>
            <Select value={department} onValueChange={setDepartment} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <Select value={isActive ? 'true' : 'false'} onValueChange={(v) => setIsActive(v === 'true')} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </label>

          {currentUserIsSuperAdmin && (
            <label className="block">
              <div className="text-sm text-gray-600 mb-1">Super Admin</div>
              <Select value={isSuperAdmin ? 'true' : 'false'} onValueChange={(v) => setIsSuperAdmin(v === 'true')} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select super admin status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes - Full System Access</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Super admins have complete access to all features and can manage other super admins
              </p>
            </label>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Updating...' : 'Update Employee'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
