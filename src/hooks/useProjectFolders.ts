import { useState, useEffect, useCallback } from 'react';

export default function useProjectFolders() {
  const [projects, setProjects] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [folderDocuments, setFolderDocuments] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        let msg = `Failed to load projects: ${res.status}`;
        try { const t = await res.text(); msg = t || msg; } catch(e){}
        throw new Error(msg);
      }
      const json = await res.json();
      setProjects(json || []);
      if (json.length > 0) {
        const pid = String(json[0].project_id);
        setSelectedProjectId(pid);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err?.message || String(err));
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchFoldersForProject = useCallback(async (projectId?: string) => {
    if (!projectId) {
      setFolders([]);
      setSelectedFolderId(null);
      setFolderDocuments([]);
      return;
    }
    setLoadingFolders(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/folders/project/${projectId}`);
      if (!res.ok) {
        // try to parse a helpful message
        let msg = `Failed to load folders: ${res.status}`;
        try { const j = await res.text(); msg = j || msg; } catch(e){}
        throw new Error(msg);
      }
      const json = await res.json();
      setFolders(json || []);
      if (json.length > 0) {
        const id = json[0].folder_id;
        setSelectedFolderId(id);
      } else {
        setSelectedFolderId(null);
        setFolderDocuments([]);
      }
    } catch (err: any) {
      console.error('Error fetching folders:', err);
      setError(err?.message || String(err));
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const fetchDocsForFolder = useCallback(async (folderId?: number | null) => {
    if (!folderId) {
      setFolderDocuments([]);
      return;
    }
    setLoadingDocs(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/folders/${folderId}/documents`);
      if (!res.ok) throw new Error(`Failed to load folder documents: ${res.status}`);
      const json = await res.json();
      setFolderDocuments(json || []);
    } catch (err: any) {
      console.error('Error fetching folder documents:', err);
      setError(err?.message || String(err));
      setFolderDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  // When selectedProjectId changes, fetch folders
  useEffect(() => {
    if (selectedProjectId) fetchFoldersForProject(selectedProjectId);
  }, [selectedProjectId, fetchFoldersForProject]);

  // When selectedFolderId changes, fetch docs
  useEffect(() => {
    if (selectedFolderId) fetchDocsForFolder(selectedFolderId);
    else setFolderDocuments([]);
  }, [selectedFolderId, fetchDocsForFolder]);

  // initial load
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    folders,
    folderDocuments,
    selectedProjectId,
    setSelectedProjectId,
    selectedFolderId,
    setSelectedFolderId,
    fetchFoldersForProject,
    fetchDocsForFolder,
    setFolderDocuments,
    loadingProjects,
    loadingFolders,
    loadingDocs,
    error
  };
}
