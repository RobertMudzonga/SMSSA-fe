import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

export default function AppraisalsListView() {
  const [appraisals, setAppraisals] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/appraisals`);
        const data = await res.json();
        setAppraisals(data || []);
        // build employees map from returned rows if present
        const empIds = Array.from(new Set((data || []).flatMap(a => [a.employee_id, a.reviewer_id]).filter(Boolean)));
        if (empIds.length) {
          const resp = await fetch(`${API_BASE}/employees`);
          const emps = await resp.json();
          const map = {};
          emps.forEach(e => map[e.id] = e.full_name);
          setEmployeesMap(map);
        }
      } catch (err) {
        console.error('Failed to fetch appraisals', err);
        setAppraisals([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading appraisals...</div>;

  const filtered = filterPeriod ? appraisals.filter(a => a.review_period === filterPeriod) : appraisals;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Performance Appraisals</h2>
      <div className="mb-4">
        <label className="mr-2">Filter by period:</label>
        <input value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} placeholder="e.g., Q3 2025" className="border px-2 py-1 rounded" />
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(a => (
              <tr key={a.appraisal_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employeesMap[a.employee_id] || a.employee_name || a.employee_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employeesMap[a.reviewer_id] || a.reviewer_name || a.reviewer_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(a.review_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.review_period}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
