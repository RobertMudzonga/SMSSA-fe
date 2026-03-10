import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

export default function EmployeesTableView() {
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

  if (loading) return <div>Loading employees...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Employee Directory — Table</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Email</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map(emp => (
              <tr key={emp.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.job_position}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.manager_id || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.work_email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
