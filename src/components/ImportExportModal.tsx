import React, { useState } from 'react';
import { X, Upload, Download, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';
import { importWorkspaceJSON, exportWorkspaceJSON } from '../utils/storageManager';
import type { CourseAssessment } from '../types/grading';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSemesterId: string;
  courses: CourseAssessment[];
  targetSGPI: number;
  onImportSuccess: (importedCourses: CourseAssessment[], importedTarget: number, semesterId?: string) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  currentSemesterId,
  courses,
  targetSGPI,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(
    null
  );

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      validateAndImport(content);
    };
    reader.readAsText(file);
  };

  const validateAndImport = (contentToImport: string) => {
    setStatusMessage(null);
    const res = importWorkspaceJSON(contentToImport);
    if (!res.success || !res.data) {
      setStatusMessage({ text: res.error || 'Failed to import JSON.', type: 'error' });
      return;
    }

    onImportSuccess(res.data.courses, res.data.targetSGPI, res.data.semesterId);
    setStatusMessage({
      text: `Successfully imported ${res.data.courses.length} courses! Target SGPA: ${res.data.targetSGPI.toFixed(2)}`,
      type: 'success',
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDownloadExport = () => {
    const jsonStr = exportWorkspaceJSON(currentSemesterId, courses, targetSGPI);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VESIT_SGPA_${currentSemesterId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Workspace Backup & Portability (JSON)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 font-semibold text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'import'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2.5 font-semibold text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Current Workspace</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'import' ? (
            <div className="space-y-3">
              <p className="text-slate-400">
                Upload a previously saved <code className="text-slate-300">.json</code> workspace file or paste its raw contents below to load your exact scheme and marks.
              </p>

              <div>
                <label className="block p-3 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-center cursor-pointer bg-slate-950/40 hover:bg-slate-800/40 transition">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                  <span className="font-semibold text-slate-200 block text-xs">
                    Choose JSON File
                  </span>
                  <span className="text-[10px] text-slate-400">or drop here</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Or Paste JSON Text:
                </label>
                <textarea
                  rows={6}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"semesterId": "vesit_sgpa_sem5", "courses": [...]}'
                  className="w-full p-2.5 font-mono text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none scrollbar-thin"
                />
              </div>

              {statusMessage && (
                <div
                  className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold ${
                    statusMessage.type === 'error'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {statusMessage.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => validateAndImport(jsonInput)}
                disabled={!jsonInput.trim()}
                className="w-full py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition disabled:opacity-40"
              >
                Validate & Load into Active Workspace
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center">
                <Download className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-sm">
                  Export Active Workspace
                </h4>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Downloads all {courses.length} courses, component marks, and your Target SGPA ({targetSGPI.toFixed(2)}) as a portable JSON file.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-slate-400 max-h-36 overflow-y-auto">
                <pre>{exportWorkspaceJSON(currentSemesterId, courses, targetSGPI)}</pre>
              </div>

              <button
                type="button"
                onClick={handleDownloadExport}
                className="w-full py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition"
              >
                Download JSON Backup File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
