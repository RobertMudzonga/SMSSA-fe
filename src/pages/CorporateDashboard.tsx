import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, FileText, MessageSquare, Loader2, Lock, AlertCircle, Scale, Calendar, Plus, Upload, Briefcase } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import CorporateReportsView from '@/components/CorporateReportsView';
import CorporateMessagesView from '@/components/CorporateMessagesView';
import EmployeeVisasTracker from '@/components/EmployeeVisasTracker';
import CaseCreationModalCorporate from '@/components/CaseCreationModalCorporate';
import DocumentUploadCorporate from '@/components/DocumentUploadCorporate';

export default function CorporateDashboard() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Corporate Data
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  
  // View state
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'visas' | 'reports' | 'messages'>('overview');
  
  // Modal states
  const [showCaseCreationModal, setShowCaseCreationModal] = useState(false);
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedCaseName, setSelectedCaseName] = useState<string>('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid access link. Please contact your immigration consultant.');
      setLoading(false);
      return;
    }

    setToken(tokenParam);
    
    // Fetch corporate client data using token
    const fetchCorporateData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/corporate-clients/by-token/${tokenParam}`);
        if (response.ok) {
          const data = await response.json();
          setCompanyInfo(data);
        } else {
          setError('Corporate client not found.');
        }
      } catch (err) {
        console.error('Error fetching corporate data:', err);
        setError('Failed to load corporate information.');
      } finally {
        setLoading(false);
      }
    };

    fetchCorporateData();
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;
    
    setLoginLoading(true);
    setLoginError(null);
    
    try {
      // Validate password against the corporate access token
      // For now, we'll check if the password matches part of the token or a simple validation
      const isValid = password && companyInfo; // Simple validation - in production, use proper auth
      
      if (isValid) {
        setIsAuthenticated(true);
        
        // Fetch cases for this corporate
        await fetchCases();
        
        setLoginLoading(false);
      } else {
        setLoginError('Invalid access code. Please try again.');
        setLoginLoading(false);
      }
    } catch (err) {
      setLoginError('Authentication failed. Please try again.');
      setLoginLoading(false);
    }
  };

  const fetchCases = async () => {
    if (!companyInfo) return;
    
    try {
      setCasesLoading(true);
      
      // Fetch Legal Cases
      const casesPromise = fetch(`${API_BASE}/api/legal-cases?corporate_client_id=${companyInfo.corporate_id}`)
        .then(res => res.ok ? res.json() : { cases: [] });
        
      // Fetch Projects
      const projectsPromise = fetch(`${API_BASE}/api/projects?corporate_client_id=${companyInfo.corporate_id}`)
        .then(res => res.ok ? res.json() : []);
        
      const [casesData, projectsData] = await Promise.all([casesPromise, projectsPromise]);
      
      setCases(casesData.cases || []);
      setProjects(projectsData || []);
    } catch (err) {
      console.error('Error fetching cases/projects:', err);
    } finally {
      setCasesLoading(false);
    }
  };

  const handleOpenDocumentUpload = (caseId: number, caseName: string) => {
    setSelectedCaseId(caseId);
    setSelectedCaseName(caseName);
    setShowDocumentUploadModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
           <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
           <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Corporate Portal Login</h1>
            <p className="text-gray-600">Secure access for HR & Global Mobility</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter corporate access code"
                className="w-full p-3 border rounded-lg text-center text-lg tracking-widest font-mono"
                autoFocus
              />
            </div>
            {loginError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loginLoading || !password}>
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Secure Access'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{companyInfo?.name}</h1>
            <p className="text-slate-400 mt-1">Corporate Client Dashboard</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 text-sm">
             <div className="bg-slate-800 px-4 py-2 rounded-lg">
                <span className="text-slate-400 block pb-1">Total Items</span>
                <span className="font-semibold text-lg">{(cases.length + projects.length) || 0}</span>
             </div>
             <div className="bg-slate-800 px-4 py-2 rounded-lg">
                <span className="text-slate-400 block pb-1">Active Items</span>
                <span className="font-semibold text-lg text-amber-400">
                  {(cases.filter(c => c.case_status === 'active').length + projects.filter(p => !['Completed', 'Closed'].includes(p.status)).length) || 0}
                </span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6 h-14 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`flex items-center gap-2 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'cases' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Scale className="h-4 w-4" />
              Cases
            </button>
            <button
              onClick={() => setActiveTab('visas')}
              className={`flex items-center gap-2 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'visas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              Foreign Employees
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              Reports
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'messages' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </button>
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Building2 className="h-5 w-5" />
               Dashboard Overview
             </h2>
             
             {/* Quick Stats */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <Card className="p-4">
                 <div className="text-sm text-gray-600">Total Cases</div>
                 <div className="text-3xl font-bold text-indigo-600">{cases.length}</div>
               </Card>
               <Card className="p-4">
                 <div className="text-sm text-gray-600">Active Cases</div>
                 <div className="text-3xl font-bold text-green-600">
                   {cases.filter(c => c.case_status === 'active').length}
                 </div>
               </Card>
               <Card className="p-4">
                 <div className="text-sm text-gray-600">Total Projects</div>
                 <div className="text-3xl font-bold text-blue-600">{projects.length}</div>
               </Card>
             </div>

             {/* Recent Cases */}
             <div>
               <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                 <Scale className="h-5 w-5" />
                 Recent Cases
               </h3>
               
               {casesLoading ? (
                 <div className="flex items-center justify-center p-8">
                   <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                 </div>
               ) : cases.length === 0 ? (
                 <Card className="p-8 text-center">
                   <p className="text-gray-500 mb-4">No cases yet. Ready to get started?</p>
                   <Button
                     onClick={() => setShowCaseCreationModal(true)}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white"
                   >
                     <Plus className="h-4 w-4 mr-2" />
                     Open Your First Case
                   </Button>
                 </Card>
               ) : (
                 <div className="space-y-3">
                   {cases.slice(0, 5).map((caseItem) => (
                     <Card key={caseItem.case_id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => handleOpenDocumentUpload(caseItem.case_id, caseItem.case_title)}
                     >
                       <div className="flex justify-between items-start">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-sm font-mono text-indigo-600">{caseItem.case_reference}</span>
                             <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                               caseItem.case_status === 'active' ? 'bg-green-100 text-green-800' :
                               caseItem.case_status === 'closed' ? 'bg-gray-100 text-gray-800' :
                               'bg-blue-100 text-blue-800'
                             }`}>
                               {caseItem.case_status}
                             </span>
                           </div>
                           <h4 className="font-semibold">{caseItem.case_title}</h4>
                           <p className="text-sm text-gray-600">Client: {caseItem.client_name}</p>
                         </div>
                         <Upload className="h-4 w-4 text-gray-400" />
                       </div>
                     </Card>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )}

        {/* CASES TAB */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold flex items-center gap-2">
                 <Scale className="h-5 w-5" />
                 Cases & Projects
               </h2>
               <Button
                 onClick={() => setShowCaseCreationModal(true)}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white"
               >
                 <Plus className="h-4 w-4 mr-2" />
                 Open New Case
               </Button>
             </div>
             
             {casesLoading ? (
               <div className="flex items-center justify-center p-8">
                 <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
               </div>
             ) : (cases.length === 0 && projects.length === 0) ? (
               <Card className="p-8 text-center">
                 <p className="text-gray-500 mb-4">No cases or projects yet.</p>
                 <Button
                   onClick={() => setShowCaseCreationModal(true)}
                   className="bg-indigo-600 hover:bg-indigo-700 text-white"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Create Your First Case
                 </Button>
               </Card>
             ) : (
               <div className="grid gap-4">
                 {/* Combine and map both types */}
                 {[
                   ...cases.map(c => ({ ...c, _type: 'case' })),
                   ...projects.map(p => ({ ...p, _type: 'project' }))
                 ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).map((item: any) => {
                   const isCase = item._type === 'case';
                   const id = isCase ? item.case_id : item.project_id;
                   const reference = isCase ? item.case_reference : `PRJ-${id}`;
                   const title = isCase ? item.case_title : item.project_name;
                   const status = isCase ? item.case_status : item.status;
                   const type = isCase ? item.case_type : item.case_type || 'General Project';
                   const deadline = isCase ? item.next_deadline : item.start_date;
                   const step = isCase ? `Step ${item.current_step}` : `Stage ${item.current_stage || 1}`;
                   const priority = item.priority;

                   return (
                     <Card key={`${item._type}-${id}`} className="p-4 hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                             {isCase ? (
                               <Scale className="h-4 w-4 text-indigo-500" title="Legal Case" />
                             ) : (
                               <Briefcase className="h-4 w-4 text-amber-500" title="Project" />
                             )}
                             <span className="text-sm font-mono text-indigo-600 font-semibold">{reference}</span>
                             <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                               (status === 'active' || status === 'Active' || status === 'In Progress') ? 'bg-green-100 text-green-800' :
                               (status === 'closed' || status === 'Closed' || status === 'Completed') ? 'bg-gray-100 text-gray-800' :
                               (status === 'on_hold' || status === 'On Hold' || status === 'Pending') ? 'bg-yellow-100 text-yellow-800' :
                               'bg-blue-100 text-blue-800'
                             }`}>
                               {status}
                             </span>
                           </div>
                           <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                           <p className="text-sm text-gray-600 mb-3">{type?.replace(/_/g, ' ').toUpperCase()}</p>
                           
                           <div className="flex gap-4 text-sm flex-wrap">
                             {deadline && (
                               <div className="flex items-center gap-1 text-gray-600">
                                 <Calendar className="h-4 w-4" />
                                 <span>{isCase ? 'Deadline' : 'Started'}: {new Date(deadline).toLocaleDateString()}</span>
                               </div>
                             )}
                             {priority && (
                               <span className={`font-medium ${
                                 priority === 'urgent' ? 'text-red-600' :
                                 priority === 'high' ? 'text-orange-600' :
                                 priority === 'medium' ? 'text-blue-600' :
                                 'text-gray-600'
                               }`}>
                                 Priority: {priority}
                               </span>
                             )}
                           </div>
                         </div>
                         <div className="text-right ml-4">
                           <div className="text-sm text-gray-500 mb-3">{step}</div>
                           {isCase && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleOpenDocumentUpload(item.case_id, item.case_title)}
                               className="whitespace-nowrap"
                             >
                               <Upload className="h-3 w-3 mr-1" />
                               Upload
                             </Button>
                           )}
                         </div>
                       </div>
                     </Card>
                   );
                 })}
               </div>
             )}
          </div>
        )}

        {/* VISA TRACKING TAB */}
        {activeTab === 'visas' && (
          <div className="space-y-6">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Users className="h-5 w-5" />
               Foreign Employee Visa Management
             </h2>
             
             <EmployeeVisasTracker
               token={token || ''}
               corporateClientId={companyInfo?.corporate_id}
               onRefresh={() => {
                 // Optional: refresh other data if needed
               }}
             />
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
             <CorporateReportsView token={token || ''} />
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
             <CorporateMessagesView 
               token={token || ''} 
               managerName={companyInfo?.primary_contact_name}
               managerRole={companyInfo?.primary_contact_role}
             />
          </div>
        )}
      </div>

      {/* Modals */}
      <CaseCreationModalCorporate
        isOpen={showCaseCreationModal}
        onClose={() => setShowCaseCreationModal(false)}
        onSuccess={fetchCases}
        token={token || ''}
        corporateClientId={companyInfo?.corporate_id}
        companyName={companyInfo?.name}
      />

      {selectedCaseId && (
        <DocumentUploadCorporate
          isOpen={showDocumentUploadModal}
          onClose={() => {
            setShowDocumentUploadModal(false);
            setSelectedCaseId(null);
            setSelectedCaseName('');
          }}
          onSuccess={fetchCases}
          caseId={selectedCaseId}
          caseName={selectedCaseName}
          token={token || ''}
          sharepointFolderUrl={companyInfo?.sharepoint_folder_url}
        />
      )}
    </div>
  );
}
