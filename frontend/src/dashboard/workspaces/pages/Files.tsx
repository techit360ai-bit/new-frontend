import { FileText, FolderOpen, Image, FileCode, Download, MoreVertical, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { fetchDomainFiles, type DomainFileItem } from '@/lib/api/files';

export function Files() {
  const [files, setFiles] = useState<DomainFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      return <FolderOpen className="w-5 h-5 text-[#2196F3]" />;
    }
    switch (item.fileType) {
      case 'image':
        return <Image className="w-5 h-5 text-purple-500" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Files
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and organize your project files
            </p>
          </div>
          <button onClick={() => toast('File uploads require a persisted upload endpoint.')} className="flex items-center gap-2 px-4 py-2 bg-[#2196F3] text-white rounded-lg hover:bg-[#2196F3]/90 transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Files</span>
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-sm text-gray-600">
                <th className="py-3 px-6 font-medium">Name</th>
                <th className="py-3 px-6 font-medium">Size</th>
                <th className="py-3 px-6 font-medium">Modified</th>
                <th className="py-3 px-6 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="py-6 px-6 text-sm text-gray-500" colSpan={4}>Loading live files...</td></tr>
              )}
              {!loading && error && (
                <tr><td className="py-6 px-6 text-sm text-red-600" colSpan={4}>Live files could not be loaded: {error}</td></tr>
              )}
              {!loading && !error && files.length === 0 && (
                <tr><td className="py-6 px-6 text-sm text-gray-500" colSpan={4}>No live files are recorded yet.</td></tr>
              )}
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {file.size || '—'}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {file.modified}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {file.type === 'file' && (
                        <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && files.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Storage Records</h3>
              <span className="text-sm text-gray-600">{files.filter((file) => file.type === 'file').length} files recorded</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#2196F3] rounded-full" style={{ width: `${Math.min(100, files.length * 10)}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
