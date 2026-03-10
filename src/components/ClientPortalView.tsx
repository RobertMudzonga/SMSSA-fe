import StatusBadge from './StatusBadge';

interface ClientPortalViewProps {
  clientData: {
    name: string;
    email: string;
    project?: any;
    documents: any[];
    activities: any[];
  };
}

export default function ClientPortalView({ clientData }: ClientPortalViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome, {clientData.name}</h2>
        <p className="text-teal-100">Track your immigration case progress</p>
      </div>

      {clientData.project && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Your Case</h3>
            <StatusBadge status={clientData.project.status} type="project" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Case Type</p>
              <p className="font-semibold">{clientData.project.case_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-teal-500 h-3 rounded-full transition-all"
                  style={{ width: `${clientData.project.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{clientData.project.progress}% Complete</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Documents</h3>
        <div className="space-y-3">
          {clientData.documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{doc.document_name}</p>
                <p className="text-sm text-gray-600">{doc.document_type}</p>
              </div>
              <StatusBadge status={doc.status} type="document" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {clientData.activities.map((activity, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">{activity.description}</p>
                <p className="text-sm text-gray-600">{new Date(activity.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
