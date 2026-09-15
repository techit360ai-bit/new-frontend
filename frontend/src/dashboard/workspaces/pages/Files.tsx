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
      return <FolderOpen className="w-5 h-5 text-[#20C997]" />;
    }
    switch (item.fileType) {
      case 'image':
        return <Image className="w-5 h-5 text-purple-500" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-[#20C997]" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors">
      {/* Page Header */}
      <div className="bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Files
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
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
            className="flex items-center gap-2 px-4 py-2 bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold rounded-xl text-sm shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="p-6">
        <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-sm border border-black/[0.06] dark:border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/[0.02] dark:bg-white/5 border-b border-black/[0.06] dark:border-white/10">
              <tr className="text-left text-sm text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-6 font-semibold">Name</th>
                <th className="py-3.5 px-6 font-semibold">Size</th>
                <th className="py-3.5 px-6 font-semibold">Modified</th>
                <th className="py-3.5 px-6 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="py-6 px-6 text-sm text-slate-500 dark:text-slate-400" colSpan={4}>Loading live files...</td></tr>
              )}
              {!loading && error && (
                <tr><td className="py-6 px-6 text-sm text-red-600 dark:text-red-400" colSpan={4}>Live files could not be loaded: {error}</td></tr>
              )}
              {!loading && !error && files.length === 0 && (
                <tr><td className="py-6 px-6 text-sm text-slate-500 dark:text-slate-400" colSpan={4}>No live files are recorded yet.</td></tr>
              )}
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-black/[0.04] dark:border-white/5 last:border-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <span className="font-medium text-slate-900 dark:text-white">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                    {file.size || '—'}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                    {file.modified}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {file.type === 'file' && (
                        <button className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && files.length > 0 && (
          <div className="mt-6 bg-white dark:bg-[#111111] rounded-2xl shadow-sm border border-black/[0.06] dark:border-white/10 p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">Storage Records</h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">{files.filter((file) => file.type === 'file').length} files recorded</span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#20C997] rounded-full" style={{ width: `${Math.min(100, files.length * 10)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
