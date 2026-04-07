import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, onTabChange, isOpen = false, onClose }: SidebarProps) {
  const { user } = useAuth();

  const displayName = user?.full_name || user?.email || 'Unknown User';
  const displayTitle = user?.job_position || user?.role || 'Staff';
  const initials = (displayName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'U';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'corporate-client-dashboard', label: 'Corporate Client Dashboard', icon: '🏢' },
    { id: 'leads', label: 'Leads', icon: '🎯' },
    { id: 'prospects', label: 'Prospects', icon: '👥' },
    { id: 'lost', label: 'Records', icon: '🔍' },
    { id: 'forecast', label: 'Forecast', icon: '📈' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'submissions', label: 'Submissions', icon: '📤' },
    { id: 'legal-projects', label: 'Legal Projects', icon: '⚖️' },
    { id: 'employees', label: 'Employees', icon: '👔' },
    { id: 'leave-requests', label: 'Leave Requests', icon: '🏖️' },
    { id: 'work-calendar', label: 'Work Calendar', icon: '🗓️' },
    { id: 'payment-requests', label: 'Payment Requests', icon: '💳' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'templates', label: 'Templates', icon: '📝' },
    { id: 'database-health', label: 'Database Health', icon: '🔧' }
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex-col h-screen fixed top-0 left-0 z-30">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-teal-400">ImmigratePro</h1>
          <p className="text-sm text-gray-400 mt-1">Case Management</p>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeTab === tab.id 
                  ? 'bg-teal-600 text-white' 
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              <span className="mr-3">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-gray-400">{displayTitle}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sliding sidebar */}
      <div className={`md:hidden fixed inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
        <div className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
        <aside className={`absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 flex items-center justify-between border-b border-slate-700">
            <div>
              <h1 className="text-lg font-bold text-teal-400">ImmigratePro</h1>
              <p className="text-xs text-gray-400">Case Management</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-200 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 overflow-y-auto flex-1 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); onClose && onClose(); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
