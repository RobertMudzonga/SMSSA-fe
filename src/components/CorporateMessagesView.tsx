import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, BellRing, Lock, Clock } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function CorporateMessagesView({ 
  token, 
  managerName = "Case Manager", 
  managerRole = "Senior Associate" 
}: { 
  token: string;
  managerName?: string;
  managerRole?: string;
}) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  // Get initials for avatar
  const initials = managerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [token]);

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/corporate-dashboard/messages?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/corporate-dashboard/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, text: message })
      });
      
      if (response.ok) {
        setMessage('');
        fetchMessages();
      } else {
        toast({
          title: "Error",
          description: "Failed to send message.",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Connection Error",
        description: "Could not reach the server.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] max-h-[800px]">
      <div className="flex items-center justify-between mb-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">Case Manager Chat</h2>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
               <Lock className="h-4 w-4" /> Secure End-to-End Communication
            </p>
         </div>
         <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border border-indigo-100">
            <BellRing className="h-4 w-4" />
            Email Notifications Active
         </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-slate-200">
         {/* Chat Header */}
         <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                  {initials}
               </div>
               <div>
                  <p className="font-semibold text-slate-900">{managerName}</p>
                  <p className="text-xs text-slate-500">{managerRole}</p>
               </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               Online
            </div>
         </div>

         {/* Chat Messages */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            <div className="text-center">
               <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full border">
                  Today
               </span>
            </div>
            
            {messages.map((msg) => (
               <div 
                 key={msg.id} 
                 className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : 'items-start'} ${msg.sender === 'system' ? 'items-center my-4' : ''}`}
               >
                 {msg.sender === 'system' ? (
                    <p className="text-xs text-gray-500 italic bg-gray-50 px-3 py-1 rounded-full">{msg.text}</p>
                 ) : (
                   <div className={`max-w-[70%] ${msg.sender === 'client' ? 'order-1' : 'order-2'}`}>
                     <div 
                       className={`px-4 py-2 rounded-2xl ${
                         msg.sender === 'client' 
                           ? 'bg-indigo-600 text-white rounded-tr-none' 
                           : 'bg-slate-100 text-slate-800 rounded-tl-none'
                       }`}
                     >
                        <p>{msg.text}</p>
                     </div>
                      <p className={`text-[10px] text-gray-400 mt-1 ${msg.sender === 'client' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                 )}
               </div>
            ))}
         </div>

         {/* Email Notification Disclaimer */}
         <div className="bg-slate-50 px-4 py-2 border-t border-b flex items-center justify-center gap-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            Messages are securely archived. If offline, the manager will be notified via email immediately.
         </div>

         {/* Chat Input */}
         <div className="p-4 bg-white">
            <form onSubmit={handleSend} className="flex items-center gap-2">
               <Input 
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder="Type a secure message to your Case Manager..." 
                 className="flex-1 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
               />
               <Button type="submit" size="icon" className="rounded-full bg-indigo-600 hover:bg-indigo-700 shrink-0 h-10 w-10">
                  <Send className="h-4 w-4" />
               </Button>
            </form>
         </div>
      </Card>
    </div>
  );
}
