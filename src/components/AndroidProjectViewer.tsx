import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import { Check, Copy, Download, FileCode2, FolderOpen } from 'lucide-react';

const rawAndroidFiles = import.meta.glob('/android-app/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function AndroidProjectViewer() {
  const files = useMemo(() => {
    return Object.entries(rawAndroidFiles)
      .map(([fullPath, content]) => ({
        path: fullPath.replace(/^\/android-app\//, ''),
        content,
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }, []);

  const [selectedPath, setSelectedPath] = useState<string>(
    () =>
      files.find((f) => f.path.endsWith('RepairRepository.kt'))?.path ??
      files[0]?.path ??
      ''
  );
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const selectedFile = files.find((f) => f.path === selectedPath) ?? files[0];

  const handleCopy = async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      files.forEach((file) => {
        zip.file(`RepairServiceAndroidApp/${file.path}`, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'RepairServiceAndroidApp.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Android Studio Project (Kotlin + Jetpack Compose)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Complete MVVM codebase wired to the same Firebase project, Firestore collections, and
            security rules.
          </p>
        </div>

        <button
          type="button"
          disabled={isZipping || files.length === 0}
          onClick={handleDownloadZip}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Preparing ZIP...' : 'Download Android Project (.zip)'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-2xl overflow-hidden min-h-[540px]">
        <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 p-4 overflow-y-auto max-h-[560px]">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 px-2 pb-3 border-b border-slate-200 mb-2">
            <FolderOpen className="w-4 h-4 text-slate-500" />
            <span>android-app ({files.length} files)</span>
          </div>
          <ul className="space-y-1">
            {files.map((file) => {
              const active = file.path === selectedFile?.path;
              return (
                <li key={file.path}>
                  <button
                    type="button"
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    <span className="truncate">{file.path}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="lg:col-span-8 flex flex-col min-w-0">
          {selectedFile ? (
            <>
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-4 bg-white">
                <span className="font-mono text-xs text-slate-700 truncate">
                  {selectedFile.path}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy File</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-800 bg-slate-50/40 overflow-auto max-h-[510px] leading-relaxed">
                <code>{selectedFile.content}</code>
              </pre>
            </>
          ) : (
            <div className="p-8 text-sm text-slate-500">Select a file to inspect source code.</div>
          )}
        </div>
      </div>
    </section>
  );
}
