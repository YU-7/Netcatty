
import React, { useState } from 'react';
import { Snippet } from '../types';
import { FileCode, Plus, Trash2, Edit2, Play, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface SnippetsManagerProps {
  snippets: Snippet[];
  onSave: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
}

const SnippetsManager: React.FC<SnippetsManagerProps> = ({ snippets, onSave, onDelete }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Partial<Snippet>>({
    label: '',
    command: '',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleEdit = (snippet?: Snippet) => {
    if (snippet) {
      setEditingSnippet(snippet);
    } else {
      setEditingSnippet({ label: '', command: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingSnippet.label && editingSnippet.command) {
      onSave({
        id: editingSnippet.id || crypto.randomUUID(),
        label: editingSnippet.label,
        command: editingSnippet.command,
        tags: editingSnippet.tags || []
      });
      setIsDialogOpen(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">Snippets Library</h2>
            <p className="text-muted-foreground">Save commonly used commands and scripts.</p>
        </div>
        <Button onClick={() => handleEdit()}>
            <Plus size={16} className="mr-2" /> New Snippet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {snippets.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileCode size={48} className="mb-4 opacity-50" />
                <p>No snippets found. Create one to automate tasks.</p>
            </div>
        )}
        
        {snippets.map((snippet) => (
          <Card key={snippet.id} className="group relative hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-accent-foreground">
                          <FileCode size={16} />
                      </div>
                      <CardTitle className="text-sm font-medium">{snippet.label}</CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(snippet)}>
                          <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(snippet.id)}>
                          <Trash2 size={14} />
                      </Button>
                  </div>
               </div>
            </CardHeader>
            <CardContent>
                <div className="relative bg-muted rounded-md p-3 font-mono text-xs text-muted-foreground h-24 overflow-hidden mb-2 group-hover:text-foreground transition-colors">
                    <pre className="whitespace-pre-wrap break-all line-clamp-4">{snippet.command}</pre>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent" />
                    
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="absolute bottom-1 right-1 h-6 w-6 shadow-sm"
                        onClick={() => handleCopy(snippet.id, snippet.command)}
                    >
                        {copiedId === snippet.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </Button>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editingSnippet.id ? 'Edit Snippet' : 'New Snippet'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>Label</Label>
                <Input 
                    placeholder="e.g. Update System, Check Disk Usage" 
                    value={editingSnippet.label}
                    onChange={e => setEditingSnippet({...editingSnippet, label: e.target.value})}
                />
            </div>
            
            <div className="grid gap-2">
                <Label>Command / Script</Label>
                <Textarea 
                    placeholder="#!/bin/bash..."
                    className="h-48 font-mono text-xs"
                    value={editingSnippet.command}
                    onChange={e => setEditingSnippet({...editingSnippet, command: e.target.value})}
                />
                <p className="text-[10px] text-muted-foreground">Multi-line commands are supported.</p>
            </div>
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Snippet</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default SnippetsManager;
