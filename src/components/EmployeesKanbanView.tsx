import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

export default function EmployeesKanbanView() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/employees`);
        const data = await res.json();
        setEmployees(data || []);
      } catch (err) {
        console.error('Failed to fetch employees', err);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;

  const byDept = employees.reduce((acc, e) => {
    const k = e.department || 'Unassigned';
    if (!acc[k]) acc[k] = [];
    acc[k].push(e);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Employee Directory — Kanban</h2>
      <div className="flex gap-4 overflow-x-auto">
        {Object.keys(byDept).map(dept => (
          <div key={dept} className="min-w-[260px] bg-gray-50 rounded p-3">
            <h3 className="font-semibold mb-2">{dept}</h3>
            <div className="space-y-2">
              {byDept[dept].map(emp => (
                <div key={emp.id} className="bg-white rounded shadow p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div>
                      <div className="font-medium">{emp.full_name}</div>
                      <div className="text-sm text-gray-500">{emp.job_position}</div>
                      <div className="text-sm text-gray-400">{emp.work_email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
