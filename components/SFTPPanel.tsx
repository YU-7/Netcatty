
import React, { useState, useEffect, useRef } from 'react';
import { RemoteFile, Host } from '../types';
import { Folder, FileText, Download, Upload, ArrowUp, RefreshCw, HardDrive, Trash2, File, Loader2, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Input } from './ui/input';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';

interface SFTPPanelProps {
  host: Host;
  credentials: {
    username: string;
    hostname: string;
    port?: number;
    password?: string;
    privateKey?: string;
  };
  isVisible: boolean;
  onClose: () => void;
}

const SFTPPanel: React.FC<SFTPPanelProps> = ({ host, credentials, isVisible, onClose }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<RemoteFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sftpIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const ensureSftp = async () => {
    if (sftpIdRef.current) return sftpIdRef.current;
    if (!window.nebula?.openSftp) throw new Error("SFTP bridge unavailable");
    const sftpId = await window.nebula.openSftp({
      sessionId: `sftp-${host.id}`,
      ...credentials,
    });
    sftpIdRef.current = sftpId;
    return sftpId;
  };

  const loadFiles = async (path: string) => {
    try {
      setError(null);
      const sftpId = await ensureSftp();
      setLoading(true);
      const list = await window.nebula.listSftp(sftpId, path);
      setFiles(list);
    } catch (e) {
      console.error("Failed to load files", e);
      setError(e instanceof Error ? e.message : 'Failed to load directory');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const closeSftp = async () => {
    if (sftpIdRef.current && window.nebula?.closeSftp) {
      try { await window.nebula.closeSftp(sftpIdRef.current); } catch {}
    }
    sftpIdRef.current = null;
  };

  useEffect(() => {
    return () => {
      closeSftp();
    };
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  useEffect(() => {
    if (isVisible) {
      if (!initializedRef.current) {
        initializedRef.current = true;
        setCurrentPath('/');
      }
      loadFiles(currentPath);
    } else {
      closeSftp();
    }
  }, [isVisible, currentPath]);

  const handleUp = () => {
    if (currentPath === '/') return;
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parent);
  };

  const handleDownload = async (file: RemoteFile) => {
    try {
      const sftpId = await ensureSftp();
      const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      setLoading(true);
      const content = await window.nebula.readSftp(sftpId, fullPath);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const sftpId = await ensureSftp();
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        await window.nebula.writeSftp(sftpId, fullPath, content);
        await loadFiles(currentPath);
      };
      reader.readAsText(file);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = async () => {
    await closeSftp();
    onClose();
  };

  const handleCreateFolder = async () => {
    try {
      const folderName = prompt("New folder name?");
      if (!folderName) return;
      const sftpId = await ensureSftp();
      const fullPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
      await window.nebula.mkdirSftp(sftpId, fullPath);
      await loadFiles(currentPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create folder');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="h-full flex flex-col glass-panel border-l border-border/70 w-full max-w-md bg-background/95">
      {/* Header */}
        <div className="h-10 border-b border-border/70 flex items-center px-4 bg-gradient-to-r from-primary/5 to-transparent justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
             <HardDrive size={14} className="text-primary" /> SFTP
          </div>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => loadFiles(currentPath)}>
                <RefreshCw size={12} className={cn(loading && "animate-spin")} />
             </Button>
             <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleClose}>
                <ArrowUp className="rotate-90" size={14} />
             </Button>
          </div>
        </div>

      {/* Toolbar & Breadcrumbs */}
      <div className="p-3 border-b border-border space-y-3 bg-muted/10">
        <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={handleUp} disabled={currentPath === '/'}>
                <ArrowUp size={14} />
            </Button>
            <Input 
                value={currentPath} 
                onChange={(e) => setCurrentPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadFiles(currentPath)}
                className="h-7 text-xs font-mono bg-background"
            />
        </div>
        {error && <div className="text-[10px] text-destructive">{error}</div>}
        <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs w-full" onClick={() => inputRef.current?.click()}>
                <Upload size={12} className="mr-2" /> Upload
            </Button>
            <input type="file" className="hidden" ref={inputRef} onChange={handleFileSelect} />
        </div>
      </div>

      {/* File List */}
      <div 
        className={cn(
            "flex-1 overflow-y-auto p-2 relative flex flex-col",
            dragActive && "bg-primary/5 ring-2 ring-inset ring-primary"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {dragActive && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-background/90 p-4 rounded-lg shadow-lg border border-primary text-primary font-medium">
                    Drop to upload
                 </div>
             </div>
        )}

        <ContextMenu>
          <ContextMenuTrigger className="flex-1 flex flex-col">
            <div className="space-y-0.5 relative flex-1 flex flex-col">
             {loading && (
               <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
               </div>
             )}

             {files.length === 0 && !loading && (
                 <div className="text-center text-xs text-muted-foreground py-10">
                    <Folder className="mx-auto mb-2 opacity-50" size={32} />
                    Empty Directory
                 </div>
             )}
             
             {!loading && files.map((file, idx) => (
                 <ContextMenu key={idx}>
                   <ContextMenuTrigger>
                     <div 
                        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 group text-xs cursor-pointer select-none transition-colors"
                        onClick={() => file.type === 'directory' && handleNavigate(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`)}
                     >
                         <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("shrink-0", file.type === 'directory' ? "text-blue-400" : "text-muted-foreground")}>
                                {file.type === 'directory' ? <Folder size={16} fill="currentColor" fillOpacity={0.2} /> : <FileText size={16} />}
                            </div>
                            <div className="truncate">
                                <div className="font-medium truncate">{file.name}</div>
                                <div className="text-[10px] text-muted-foreground opacity-70 flex gap-2">
                                    <span>{file.size}</span>
                                    <span>•</span>
                                    <span>{file.lastModified}</span>
                                </div>
                            </div>
                         </div>
                         
                         <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            {file.type === 'file' && (
                                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(file)} title="Download">
                                    <Download size={12} />
                                 </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" title="Delete">
                                 <Trash2 size={12} />
                            </Button>
                         </div>
                     </div>
                   </ContextMenuTrigger>
                   <ContextMenuContent>
                     {file.type === 'directory' && (
                       <ContextMenuItem onClick={() => handleNavigate(currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`)}>
                         Open
                       </ContextMenuItem>
                     )}
                     {file.type === 'file' && (
                       <ContextMenuItem onClick={() => handleDownload(file)}>
                         Download
                       </ContextMenuItem>
                     )}
                   </ContextMenuContent>
                 </ContextMenu>
             ))}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={handleCreateFolder}>
              <Plus className="h-4 w-4 mr-2" /> New folder
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      
      {/* Footer Status */}
      <div className="h-6 bg-muted/30 border-t border-border flex items-center px-3 text-[10px] text-muted-foreground justify-between shrink-0">
         <span>{files.length} items</span>
         <span>{loading ? "Syncing..." : "Ready"}</span>
      </div>
    </div>
  );
};

export default SFTPPanel;
