import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { API_BASE } from '../lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface LeaveBalance {
  employeeId: number;
  year: number;
  totalAllocated: number | string;
  accruedToDate: number | string;
  daysUsed: number | string;
  daysRemaining: number | string;
  lastAccrualDate: string;
}

// Helper function to safely convert to number
const toNumber = (value: number | string | undefined): number => {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

export default function LeaveBalanceCounter() {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadLeaveBalance();
    // Refresh balance every 5 minutes
    const interval = setInterval(loadLeaveBalance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaveBalance = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      const email = user?.email || window.localStorage.getItem('userEmail');
      if (email) {
        headers['x-user-email'] = email;
      }

      const res = await fetch(`${API_BASE}/leave-requests/balance/me`, { headers });
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Employee not found');
        } else {
          setError('Failed to load leave balance');
        }
        setBalance(null);
        return;
      }

      const data = await res.json();
      setBalance(data);
      setError(null);
    } catch (err) {
      console.error('Error loading leave balance:', err);
      setError('Could not fetch leave balance');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center text-sm text-gray-600">Loading leave balance...</div>
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <div className="text-center text-sm text-gray-600">{error || 'Leave balance unavailable'}</div>
      </Card>
    );
  }

  const percentageUsed = (toNumber(balance.daysUsed) / toNumber(balance.totalAllocated)) * 100;
  const percentageRemaining = (toNumber(balance.daysRemaining) / toNumber(balance.totalAllocated)) * 100;
  const isNegative = toNumber(balance.daysRemaining) < 0;

  return (
    <Card className={`p-6 bg-gradient-to-br ${
      isNegative 
        ? 'from-red-50 to-orange-50 border-red-200' 
        : 'from-green-50 to-emerald-50 border-green-200'
    }`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Leave Days Balance</h3>
            <p className="text-xs text-gray-500 mt-1">Year {balance.year}</p>
          </div>
          <div className={`text-2xl font-bold ${
            isNegative ? 'text-red-600' : 'text-green-600'
          }`}>
            {Math.abs(toNumber(balance.daysRemaining)).toFixed(1)}
          </div>
        </div>

        {/* Status text */}
        <div className="text-sm font-medium text-gray-700">
          {isNegative ? (
            <span className="text-red-600">
              {Math.abs(balance.daysRemaining).toFixed(1)} days in unpaid leave debt
            </span>
          ) : (
            <span className="text-green-600">
              {toNumber(balance.daysRemaining).toFixed(1)} days remaining
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Accrued: {toNumber(balance.accruedToDate).toFixed(1)} days</span>
            <span>Used: {toNumber(balance.daysUsed).toFixed(1)} days</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                isNegative 
                  ? 'bg-red-500' 
                  : percentageRemaining > 30 
                  ? 'bg-green-500' 
                  : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {percentageUsed.toFixed(0)}% of annual allocation used
          </div>
        </div>

        {/* Details breakdown */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-300">
          <div className="text-center">
            <div className="text-xs text-gray-600 font-medium">Total</div>
            <div className="text-lg font-bold text-gray-800">
              {toNumber(balance.totalAllocated).toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 font-medium">Accrued</div>
            <div className="text-lg font-bold text-blue-600">
              {toNumber(balance.accruedToDate).toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 font-medium">Used</div>
            <div className="text-lg font-bold text-orange-600">
              {toNumber(balance.daysUsed).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Accrual rate info */}
        <div className="text-xs text-gray-600 bg-white bg-opacity-50 p-3 rounded mt-3">
          <strong>Accrual Rate:</strong> 1.5 days per month (resets yearly on Jan 1)
        </div>

        {/* Negative balance warning */}
        {isNegative && (
          <div className="text-xs text-red-700 bg-red-100 bg-opacity-70 p-3 rounded">
            <strong>⚠️ Warning:</strong> You have exceeded your allocated leave days. 
            Additional leave will be marked as <strong>unpaid</strong>.
          </div>
        )}

        {/* Low balance warning */}
        {!isNegative && toNumber(balance.daysRemaining) < 3 && toNumber(balance.daysRemaining) > 0 && (
          <div className="text-xs text-orange-700 bg-orange-100 bg-opacity-70 p-3 rounded">
            <strong>⚠️ Note:</strong> You have less than 3 days remaining. 
            Plan your leave carefully to avoid unpaid leave.
          </div>
        )}
      </div>
    </Card>
  );
}
