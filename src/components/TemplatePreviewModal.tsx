import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { substituteVariables, getVariableLabel } from '@/utils/templateVariables';
import { Download, Copy } from 'lucide-react';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    name: string;
    content: string;
    variables: string[];
  } | null;
}

export default function TemplatePreviewModal({ isOpen, onClose, template }: TemplatePreviewModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (template) {
      const initialValues: Record<string, string> = {};
      template.variables.forEach(v => {
        if (v === 'currentDate') {
          initialValues[v] = new Date().toLocaleDateString('en-ZA');
        } else {
          initialValues[v] = '';
        }
      });
      setVariableValues(initialValues);
    }
  }, [template]);

  useEffect(() => {
    if (template) {
      setPreview(substituteVariables(template.content, variableValues));
    }
  }, [template, variableValues]);

  const handleCopy = () => {
    navigator.clipboard.writeText(preview);
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template?.name || 'document'}.txt`;
    a.click();
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Document: {template.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Fill in Variables</h3>
            {template.variables.map(variable => (
              <div key={variable}>
                <Label htmlFor={variable}>{getVariableLabel(variable)}</Label>
                {variable.includes('Description') || variable.includes('Reason') || variable.includes('Purpose') ? (
                  <Textarea
                    id={variable}
                    value={variableValues[variable] || ''}
                    onChange={(e) => setVariableValues({ ...variableValues, [variable]: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={variable}
                    type={variable.includes('Date') ? 'date' : 'text'}
                    value={variableValues[variable] || ''}
                    onChange={(e) => setVariableValues({ ...variableValues, [variable]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Preview</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <div className="border rounded p-4 bg-white min-h-[500px] whitespace-pre-wrap font-serif text-sm">
              {preview}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
