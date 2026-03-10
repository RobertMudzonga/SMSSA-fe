import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, FileText, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import TemplateEditorModal from './TemplateEditorModal';
import TemplatePreviewModal from './TemplatePreviewModal';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  created_at: string;
}

export default function TemplateLibraryView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    try {
      const resp = await fetch('/api/templates');
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to load templates');
      setTemplates(json.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];

  const handleSaveTemplate = async (template: any) => {
    try {
      if (template.id) {
        const resp = await fetch(`/api/templates/${template.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: template.name,
            description: template.description,
            category: template.category,
            content: template.content,
            variables: template.variables
          })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error || 'Failed to update template');
        toast.success('Template updated successfully');
      } else {
        const resp = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: template.name,
            description: template.description,
            category: template.category,
            content: template.content,
            variables: template.variables
          })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error || 'Failed to create template');
        toast.success('Template created successfully');
      }

      loadTemplates();
      setIsEditorOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    // open confirmation dialog instead
    setDeletingTemplateId(id);
    setConfirmDeleteOpen(true);
  };

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const performDeleteTemplate = async () => {
    const id = deletingTemplateId;
    setConfirmDeleteOpen(false);
    setDeletingTemplateId(null);
    if (!id) return;
    try {
      const resp = await fetch(`/api/templates/${id}/deactivate`, { method: 'PATCH' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to delete template');
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const seedTemplates = async () => {
    try {
      const resp = await fetch('/api/templates/seed', { method: 'POST' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to seed templates');
      toast.success('Sample templates added successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error seeding templates:', error);
      toast.error('Failed to seed templates');
    }
  };

  if (loading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Document Template Library</h1>
          <p className="text-gray-600">Create and manage reusable document templates</p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button onClick={seedTemplates} variant="outline">
              Load Sample Templates
            </Button>
          )}
          <Button onClick={() => { setEditingTemplate(null); setIsEditorOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <Badge variant="secondary">{template.category}</Badge>
              </div>
            </div>
            <h3 className="font-semibold mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {template.variables.slice(0, 3).map(v => (
                <span key={v} className="text-xs bg-gray-100 px-2 py-1 rounded">{v}</span>
              ))}
              {template.variables.length > 3 && (
                <span className="text-xs text-gray-500">+{template.variables.length - 3} more</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setPreviewTemplate(template); setIsPreviewOpen(true); }}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Generate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEditingTemplate(template); setIsEditorOpen(true); }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteTemplate(template.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <TemplateEditorModal isOpen={isEditorOpen} template={editingTemplate} onClose={() => setIsEditorOpen(false)} onSave={handleSaveTemplate} />
      <TemplatePreviewModal isOpen={isPreviewOpen} template={previewTemplate} onClose={() => setIsPreviewOpen(false)} />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete this template? This action will hide it from the library.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={performDeleteTemplate}>Delete</button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No templates found</p>
        </div>
      )}
      
    </div>
  );
}
