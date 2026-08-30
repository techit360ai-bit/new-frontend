import { FileText, FolderOpen, Image, FileCode, Download, MoreVertical, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { fetchDomainFiles, createDomainFile, type DomainFileItem } from '@/lib/api/files';

export function Files() {
  const [files, setFiles] = useState<DomainFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    for (const file of Array.from(selectedFiles)) {
      try {
        const sizeLabel = file.size < 1024 ? `${file.size} B`
          : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        const created = await createDomainFile({
          name: file.name,
          type: 'file',
          size: sizeLabel,
          sizeBytes: file.size,
        });
        setFiles((prev) => [created, ...prev]);
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchDomainFiles()
      .then((rows) => {
        if (!alive) return;
        setFiles(rows);
      })
      .catch((err) => {
        if (!alive) return;
        setFiles([]);
        setError(err instanceof Error ? err.message : 'Live files are unavailable.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const getFileIcon = (item: DomainFileItem) => {
    if (item.type === 'folder') {
      return <FolderOpen className="w-5 h-5 text-brand-primary" />;
    }
    switch (item.fileType) {
      case 'image':
        return <Image className="w-5 h-5 text-status-pending" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-status-success" />;
      default:
        return <FileText className="w-5 h-5 text-text-muted" />;
    }
  };

  return (
    <div className="h-full bg-background-primary">
      {/* Page Header */}
      <div className="bg-surface-primary border-b border-border-default px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Files
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Manage and organize your project files
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => { void handleFileUpload(e); }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Files</span>
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="p-6">
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-default overflow-hidden">
          <table className="w-full">
            <thead className="bg-background-primary border-b border-border-default">
              <tr className="text-left text-sm text-text-muted">
                <th className="py-3 px-6 font-medium">Name</th>
                <th className="py-3 px-6 font-medium">Size</th>
                <th className="py-3 px-6 font-medium">Modified</th>
                <th className="py-3 px-6 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="py-6 px-6 text-sm text-text-muted" colSpan={4}>Loading live files...</td></tr>
              )}
              {!loading && error && (
                <tr><td className="py-6 px-6 text-sm text-status-error" colSpan={4}>Live files could not be loaded: {error}</td></tr>
              )}
              {!loading && !error && files.length === 0 && (
                <tr><td className="py-6 px-6 text-sm text-text-muted" colSpan={4}>No live files are recorded yet.</td></tr>
              )}
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-background-primary transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-text-muted">
                    {file.size || '—'}
                  </td>
                  <td className="py-4 px-6 text-sm text-text-muted">
                    {file.modified}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {file.type === 'file' && (
                        <button className="p-2 hover:bg-surface-secondary rounded transition-colors">
                          <Download className="w-4 h-4 text-text-muted" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-surface-secondary rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && files.length > 0 && (
          <div className="mt-6 bg-surface-primary rounded-xl shadow-sm border border-border-default p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Storage Records</h3>
              <span className="text-sm text-text-muted">{files.filter((file) => file.type === 'file').length} files recorded</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary rounded-full" style={{ width: `${Math.min(100, files.length * 10)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
