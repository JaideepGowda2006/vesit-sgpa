import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Terminal,
  ChevronDown,
  ChevronUp,
  X,
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
    const mockGradeCard = new File(['mock grade card content'], 'VESIT_Autonomous_Grade_Card.png', {
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
    <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            Scheme & Syllabus Scanner
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Upload screenshots of Exam & Teaching Schemes to auto-extract and separate Theory and Lab rows.
          </p>
        </div>

        {/* Demo Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateMultiDocMatch}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
            <span>Demo Sem V Scheme</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateGradeCardMatch}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] transition disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-[#0071e3] dark:text-[#2997ff]" />
            <span>Demo Sem IV Card</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 sm:p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#0071e3] bg-[#0071e3]/5'
            : 'border-black/[0.1] dark:border-white/[0.12] hover:border-[#0071e3]/60 bg-[#f5f5f7]/50 dark:bg-[#2c2c2e]/30'
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

        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.12] flex items-center justify-center shadow-sm">
            <UploadCloud className="w-5 h-5 text-[#0071e3] dark:text-[#2997ff]" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              Drop scheme screenshots here, or <span className="text-[#0071e3] dark:text-[#2997ff]">browse</span>
            </p>
            <p className="text-xs text-[#86868b] mt-0.5">
              Supports Exam Scheme (Marks) and Teaching Scheme (Credits) PNG, JPG, or PDF
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded File Chips */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#86868b] font-medium">Uploaded:</span>
            {uploadedFiles.map((f, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08]"
              >
                <FileText className="w-3.5 h-3.5 text-[#0071e3]" />
                <span className="font-mono text-[11px]">{f.name}</span>
              </span>
            ))}
          </div>

          <button
            onClick={clearUploads}
            className="text-xs text-[#86868b] hover:text-rose-500 transition flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
      )}

      {/* OCR Progress / Logs */}
      {(isProcessing || ocrLogs.length > 0) && (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[#f5f5f7] dark:bg-[#2c2c2e]/60 overflow-hidden text-xs">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#0071e3]" />
              <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                Extraction Log
              </span>
              {isProcessing && (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#0071e3]">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Processing...
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowLogDetails(!showLogDetails)}
              className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition flex items-center gap-1 text-[11px]"
            >
              {showLogDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showLogDetails && (
            <div className="p-3 max-h-48 overflow-y-auto space-y-1 font-mono text-[11px] text-[#86868b]">
              {ocrLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="select-none text-[10px] text-[#86868b]">{log.timestamp}</span>
                  <span className="text-[#1d1d1f] dark:text-[#f5f5f7]">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result Status */}
      {lastMatchResult && !isProcessing && (
        <div>
          {lastMatchResult.missingCreditsWarning ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Parsed with standard university credit weights (Theory: 3-4 Cr, Labs: 1-2 Cr). You can edit any credit cell below.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
                Matched Successfully: {lastMatchResult.totalCredits} Total Credits, {lastMatchResult.totalCourses} Courses Loaded.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
