import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Lock, Clock, User } from 'lucide-react';

export default function ClientMessagesView({ clientName }: { clientName: string }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "system",
      text: `Hello ${clientName}, you are now connected with your Case Manager.`,
      timestamp: "09:30 AM"
    },
    {
      id: 2,
      sender: "manager",
      text: "I've received your passport copy. It looks clear. I'm now proceeding with the VFS appointment booking.",
      timestamp: "09:35 AM"
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      sender: "client",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMsg]);
    setMessage('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "manager",
        text: "Understood. I'll update you as soon as the appointment is confirmed.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="bg-teal-600 text-white p-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center border border-teal-400">
               <User className="h-5 w-5 text-white" />
            </div>
            <div>
               <p className="font-semibold">Emily Chen</p>
               <p className="text-xs text-teal-100">Senior Case Manager</p>
            </div>
         </div>
         <div className="flex items-center gap-2 text-xs bg-teal-700/50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Online
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
         {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : 'items-start'} ${msg.sender === 'system' ? 'items-center my-2' : ''}`}>
               {msg.sender === 'system' ? (
                  <p className="text-[10px] text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm uppercase tracking-wider font-medium">
                    {msg.text}
                  </p>
               ) : (
                  <div className="max-w-[85%]">
                     <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                        msg.sender === 'client' 
                          ? 'bg-teal-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border rounded-tl-none'
                     }`}>
                        <p className="text-sm">{msg.text}</p>
                     </div>
                     <p className="text-[10px] text-gray-400 mt-1 px-1">
                        {msg.timestamp}
                     </p>
                  </div>
               )}
            </div>
         ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
         <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2 px-1">
            <Lock className="h-3 w-3" /> Secure end-to-end encrypted messaging
         </div>
         <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..." 
              className="flex-1 rounded-full border-gray-200 focus-visible:ring-teal-500 h-11"
            />
            <Button type="submit" size="icon" className="rounded-full bg-teal-600 hover:bg-teal-700 shrink-0 h-11 w-11 shadow-md">
               <Send className="h-4 w-4" />
            </Button>
         </form>
         <p className="text-[10px] text-gray-400 mt-2 text-center italic">
            <Clock className="h-3 w-3 inline mr-1" /> Case managers typically respond within 1-2 business hours.
         </p>
      </div>
    </div>
  );
}
