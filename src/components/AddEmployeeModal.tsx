import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { full_name: string; work_email: string; job_position?: string; department?: string; manager_id?: number | null }) => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSubmit }: AddEmployeeModalProps) {
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [jobPosition, setJobPosition] = useState('Immigration Support Specialist');
  const [department, setDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const jobPositions = [
    'Immigration Support Specialist',
    'Immigration Consultant',
    'Senior Consultant',
    'Sales Manager',
    'IT',
    'Finance'
  ];

  useEffect(() => {
    if (!isOpen) {
      setFullName(''); setWorkEmail(''); setJobPosition('Immigration Support Specialist'); setDepartment('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!fullName || !workEmail) {
      toast({ title: 'Please provide name and email', variant: 'destructive' });
      return;
    }
    const allowedDomain = '@immigrationspecialists.co.za';
    if (!workEmail.includes('@') || !workEmail.toLowerCase().endsWith(allowedDomain)) {
      toast({ title: 'Invalid email', description: `Work email must be a ${allowedDomain} address`, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ full_name: fullName.trim(), work_email: workEmail.trim().toLowerCase(), job_position: jobPosition, department: department || null, manager_id: null });
      onClose();
    } catch (err) {
      console.error('Add employee failed', err);
      toast({ title: 'Failed to add employee', description: String(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>Create a new team member account</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Full name</div>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Work email</div>
            <Input value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} placeholder="name@immigrationspecialists.co.za" />
          </label>
          <label className="block">
            <div className="text-sm text-gray-600 mb-1">Job position</div>
            <Select value={jobPosition} onValueChange={setJobPosition}>
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
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </label>
        </div>

        <DialogFooter>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Adding...' : 'Add Employee'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
