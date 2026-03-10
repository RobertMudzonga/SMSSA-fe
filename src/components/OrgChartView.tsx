import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

function buildTree(employees) {
  const map = new Map();
  employees.forEach(e => map.set(e.id, { ...e, children: [] }));
  const roots = [];
  map.forEach((node) => {
    if (node.manager_id && map.has(node.manager_id)) {
      map.get(node.manager_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function Node({ node, level = 0 }) {
  return (
    <div className="ml-" style={{ marginLeft: level * 20 }}>
      <div className="p-2 rounded bg-white shadow mb-2">
        <div className="font-medium">{node.full_name}</div>
        <div className="text-sm text-gray-500">{node.job_position}</div>
      </div>
      {node.children && node.children.map(c => (
        <Node key={c.id} node={c} level={level + 1} />
      ))}
    </div>
  );
}

export default function OrgChartView() {
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

  if (loading) return <div>Loading org chart...</div>;

  const tree = buildTree(employees);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Organizational Chart</h2>
      <div className="bg-gray-50 p-4 rounded">
        {tree.map(root => (
          <Node key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}
