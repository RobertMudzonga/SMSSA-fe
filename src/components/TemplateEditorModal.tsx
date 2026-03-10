import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { extractVariables } from '@/utils/templateVariables';

interface Template {
  id?: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
}

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Template) => void;
  template?: Template | null;
}

const categories = [
  'Motivation Letters',
  'Support Letters',
  'Employment Letters',
  'Consent Letters',
  'General Letters'
];

export default function TemplateEditorModal({ isOpen, onClose, onSave, template }: TemplateEditorModalProps) {
  const [formData, setFormData] = useState<Template>({
    name: '',
    description: '',
    category: 'Motivation Letters',
    content: '',
    variables: []
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'Motivation Letters',
        content: '',
        variables: []
      });
    }
  }, [template, isOpen]);

  const handleContentChange = (content: string) => {
    const variables = extractVariables(content);
    setFormData({ ...formData, content, variables });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="content">Template Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={15}
              className="font-mono text-sm"
              placeholder="Use {{variableName}} for dynamic content"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use double curly braces for variables: {`{{clientName}}, {{date}}, etc.`}
            </p>
          </div>
          {formData.variables.length > 0 && (
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm font-medium mb-2">Detected Variables:</p>
              <div className="flex flex-wrap gap-2">
                {formData.variables.map(v => (
                  <span key={v} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Template</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
