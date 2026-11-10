import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Terminal,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import type { OCRStepLog, ParseResult } from '../utils/documentMatcher';
import { processUploadedDocuments } from '../utils/documentMatcher';

interface DocumentUploadSectionProps {
  onParseComplete: (result: ParseResult) => void;
  onLoadPreset: (presetId: string) => void;
  currentSchemeName: string;
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  onParseComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [ocrLogs, setOcrLogs] = useState<OCRStepLog[]>([]);
  const [showLogDetails, setShowLogDetails] = useState(true);
  const [lastMatchResult, setLastMatchResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleProcessFiles(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await handleProcessFiles(files);
    }
  };

  const handleProcessFiles = async (files: File[]) => {
    setUploadedFiles(files);
    setIsProcessing(true);
    setOcrLogs([]);
    setLastMatchResult(null);

    try {
      const result = await processUploadedDocuments(files, (log) => {
        setOcrLogs((prev) => [...prev, log]);
      });
      setLastMatchResult(result);
      onParseComplete(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateMultiDocMatch = async () => {
    const mockExamFile = new File(['mock exam content'], 'Semester_V_Exam_Scheme.png', {
      type: 'image/png',
    });
    const mockTeachingFile = new File(['mock teaching content'], 'Semester_V_Teaching_Scheme.png', {
      type: 'image/png',
    });
    await handleProcessFiles([mockExamFile, mockTeachingFile]);
  };

  const handleSimulateGradeCardMatch = async () => {
    const mockGradeCard = new File(['mock grade card content'], 'VESIT_Sem_IV_Grade_Card.png', {
      type: 'image/png',
    });
    await handleProcessFiles([mockGradeCard]);
  };

  const clearUploads = () => {
    setUploadedFiles([]);
    setOcrLogs([]);
    setLastMatchResult(null);
  };

  return (
    <section className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden shadow-sm dark:shadow-xl transition-colors">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header and instruction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold">
              OCR
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Multi-Document Scheme Parser
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Upload screenshots of your <strong className="text-slate-800 dark:text-slate-300">Exam Scheme</strong> and <strong className="text-slate-800 dark:text-slate-300">Teaching/Credit Scheme</strong>. The engine matches course codes and splits Theory vs Lab rows according to Mumbai University regulations.
          </p>
        </div>

        {/* Quick presets & action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateMultiDocMatch}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>⚡ Demo Merge (Sem V Scheme)</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateGradeCardMatch}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>⚡ Demo Grade Card (Sem IV)</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.005]'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-slate-50/50 dark:bg-slate-950/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-inner">
            <UploadCloud className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 transition" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Upload Course & Exam Scheme Screenshots (e.g. image_2.png, image_3.png)
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Drag & drop files or <span className="text-indigo-600 dark:text-indigo-400 underline font-semibold">browse computer</span> (PNG, JPG, WebP, PDF)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <Layers className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Exam Scheme (Marks)
            </span>
            <span>+</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <FileCheck className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Teaching Scheme (Credits)
            </span>
            <span>=</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Auto Cross-Referenced Table
            </span>
          </div>
        </div>
      </div>

      {/* Uploaded Files Chips & Controls */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Uploaded Documents:</span>
            {uploadedFiles.map((f, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-mono text-[11px] font-medium">{f.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearUploads}
              className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Active OCR Processing / Visual Loading Terminal */}
      {(isProcessing || ocrLogs.length > 0) && (
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950/90 overflow-hidden text-xs font-mono shadow-md">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 dark:bg-slate-900 border-b border-slate-700 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-slate-200 text-xs">
                Multi-Document OCR & Cross-Referencing Logs
              </span>
              {isProcessing && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 animate-pulse">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Cross-referencing...
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowLogDetails(!showLogDetails)}
              className="text-slate-400 hover:text-slate-200 transition flex items-center gap-1 text-[11px]"
            >
              {showLogDetails ? (
                <>
                  <span>Hide Logs</span> <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>Show Logs ({ocrLogs.length})</span> <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          </div>

          {/* Terminal Body */}
          {showLogDetails && (
            <div className="p-3.5 max-h-52 overflow-y-auto space-y-1.5 scrollbar-thin bg-slate-950 text-slate-200">
              {ocrLogs.map((log) => {
                let badgeClass = 'text-slate-400 bg-slate-800';
                let icon = '•';

                if (log.type === 'ocr') {
                  badgeClass = 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
                  icon = 'OCR';
                } else if (log.type === 'match') {
                  badgeClass = 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20';
                  icon = 'MATCH';
                } else if (log.type === 'success') {
                  badgeClass = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
                  icon = 'DONE';
                } else if (log.type === 'warning') {
                  badgeClass = 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
                  icon = 'WARN';
                }

                return (
                  <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-slate-500 text-[10px] select-none pt-0.5">
                      {log.timestamp}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase select-none ${badgeClass}`}
                    >
                      {icon}
                    </span>
                    <span className="text-slate-300 text-[11px] flex-1">{log.message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Match Result Banner / Alert if missing components */}
      {lastMatchResult && !isProcessing && (
        <div className="mt-4">
          {lastMatchResult.missingCreditsWarning ? (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                  Exam Scheme Processed with Fallback Credits
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                  Standard credit weights were assigned (4 credits for full courses, 2 for labs). Upload the Teaching Scheme screenshot to auto-resolve exact credits, or click any Credit cell to edit.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    Match Successful ({lastMatchResult.totalCredits} Total Credits, {lastMatchResult.totalCourses} Courses Detected)!
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mt-0.5">
                    Merged Course Codes, Theory/Internal Heads (MT 20, CA 20, ESE 60), Term Work, and Credit Distributions into editable live table.
                  </p>
                </div>
              </div>

              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-500/30 whitespace-nowrap">
                {lastMatchResult.detectedSemester} ({lastMatchResult.detectedBatch})
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
