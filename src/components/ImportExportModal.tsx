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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center">
              <FileJson className="w-4 h-4 text-[#0071e3] dark:text-[#2997ff]" />
            </div>
            <h3 className="text-base font-semibold tracking-tight">
              Backup & Portability
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.1] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-4">
          <div className="inline-flex w-full p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.1]">
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition ${
                activeTab === 'import'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                  : 'text-[#86868b]'
              }`}
            >
              Import JSON
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                  : 'text-[#86868b]'
              }`}
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'import' ? (
            <div className="space-y-3">
              <p className="text-xs text-[#86868b]">
                Select a previously exported <code className="text-[#1d1d1f] dark:text-[#f5f5f7]">.json</code> file to restore your workspace.
              </p>

              <label className="block p-5 border-2 border-dashed border-black/[0.1] dark:border-white/[0.15] hover:border-[#0071e3] rounded-2xl text-center cursor-pointer bg-[#f5f5f7]/50 dark:bg-[#2c2c2e]/40 transition">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-[#0071e3] dark:text-[#2997ff] mx-auto mb-1" />
                <span className="font-semibold block text-xs">
                  Choose JSON File
                </span>
                <span className="text-[10px] text-[#86868b]">or drag and drop</span>
              </label>

              <div>
                <label className="block text-[#86868b] font-medium mb-1">
                  Or Paste JSON Text:
                </label>
                <textarea
                  rows={5}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"semesterId": "vesit_sgpa_sem4", ...}'
                  className="w-full p-2.5 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.12] rounded-xl font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
              </div>

              {jsonInput && (
                <button
                  type="button"
                  onClick={() => validateAndImport(jsonInput)}
                  className="w-full py-2.5 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-sm"
                >
                  Load Pasted Data
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#86868b]">
                Export all your courses, entered marks, and target settings into a JSON backup file.
              </p>

              <div className="p-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#86868b]">Courses:</span>
                  <span className="font-semibold">{courses.length} Rows</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#86868b]">Target SGPA:</span>
                  <span className="font-semibold">{targetSGPI.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadExport}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup (.json)</span>
              </button>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
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
        </div>
      </div>
    </div>
  );
};
