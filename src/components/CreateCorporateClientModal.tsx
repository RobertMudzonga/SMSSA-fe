import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface CreateCorporateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCorporateClientModal({
  isOpen,
  onClose,
  onSuccess
}: CreateCorporateClientModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_registration_number: '',
    industry: '',
    address: '',
    sharepoint_folder_url: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    max_users: 10,
    subscription_start: new Date().toISOString().split('T')[0],
    subscription_end: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_users' ? parseInt(value) || 10 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/corporate-clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create corporate client');
      }

      toast({
        title: 'Success',
        description: `${formData.name} has been created successfully`,
      });

      setFormData({
        name: '',
        company_registration_number: '',
        industry: '',
        address: '',
        sharepoint_folder_url: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        max_users: 10,
        subscription_start: new Date().toISOString().split('T')[0],
        subscription_end: '',
        notes: ''
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create corporate client',
        variant: 'destructive'
      });
      console.error('Error creating corporate client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Corporate Client</DialogTitle>
          <DialogDescription>
            Add a new corporate client to the system. They will receive a unique access token.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Acme Corp Ltd."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number
                </label>
                <Input
                  type="text"
                  name="company_registration_number"
                  value={formData.company_registration_number}
                  onChange={handleChange}
                  placeholder="e.g., 2024/123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <Input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g., Technology"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, city, country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SharePoint Folder URL
              </label>
              <Input
                type="url"
                name="sharepoint_folder_url"
                value={formData.sharepoint_folder_url}
                onChange={handleChange}
                placeholder="https://yourorganization.sharepoint.com/sites/corporate/Shared%20Documents"
              />
              <p className="text-xs text-gray-600 mt-1">
                Provide the Microsoft SharePoint folder URL where clients will upload documents
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Person Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <Input
                    type="text"
                    name="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={handleChange}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <Input
                    type="email"
                    name="contact_person_email"
                    value={formData.contact_person_email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <Input
                  type="tel"
                  name="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={handleChange}
                  placeholder="+27 (0)10 123 4567"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Subscription Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Users
                  </label>
                  <Input
                    type="number"
                    name="max_users"
                    value={formData.max_users}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription End Date
                  </label>
                  <Input
                    type="date"
                    name="subscription_end"
                    value={formData.subscription_end}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes or special requirements"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Once created, the corporate client will receive a unique access token and URL for their dashboard. This cannot be changed later.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Corporate Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
