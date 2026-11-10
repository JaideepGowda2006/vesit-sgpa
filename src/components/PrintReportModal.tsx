import React, { useRef, useState } from 'react';
import type {
  CourseAssessment,
  CourseCalculationResult,
  OverallCalculationResult,
  TargetPlannerAnalysis,
} from '../types/grading';
import { Printer, Download, X, Award } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseAssessment[];
  courseResults: Map<string, CourseCalculationResult>;
  overall: OverallCalculationResult;
  analysis: TargetPlannerAnalysis;
  currentSchemeName: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  courses,
  courseResults,
  overall,
  analysis,
  currentSchemeName,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [candidateName, setCandidateName] = useState('STUDENT CANDIDATE');
  const [seatNumber, setSeatNumber] = useState('SEAT-XXXX');
  const [prnNumber, setPrnNumber] = useState('PRN-XXXXXXXXXXXX');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const data = {
      scheme: currentSchemeName,
      generatedDate: new Date().toISOString(),
      targetSGPI: analysis.targetSGPI,
      calculatedSGPI: overall.currentSGPI,
      totalCredits: overall.totalRegisteredCredits,
      earnedCredits: overall.totalEarnedCredits,
      totalMarksObtained: overall.totalObtainedMarks,
      totalMaxMarks: overall.totalMaxMarks,
      percentage: overall.overallPercentage,
      status: overall.hasAnyFailedCourse ? 'FAILED' : 'SUCCESSFUL',
      rows: courses.map((c) => {
        const res = courseResults.get(c.id);
        return {
          code: c.courseCode,
          name: c.courseName,
          category: c.category,
          credits: c.credits,
          obtainedMarks: res?.totalObtained,
          maxMarks: res?.totalMax,
          grade: res?.letterGrade,
          gradePoint: res?.gradePoint,
          cxg: res?.cxg,
          failedHeads: res?.failedHeads,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SGPA_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-thin">
        {/* Modal Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10 no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Mock Grade Card & University Result Report
              </h3>
              <p className="text-xs text-slate-400">
                High-fidelity preview formatted with independent Theory (TH) & Lab (TPO) rows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Download structured JSON report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Grade Card Content */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 bg-white text-slate-900 font-sans print:p-0 print:m-0"
        >
          {/* Institute Header */}
          <div className="text-center border-b-2 border-red-800 pb-4 mb-4">
            <p className="text-xs font-serif font-bold text-red-900 tracking-wider uppercase">
              VIVEKANAND EDUCATION SOCIETY'S
            </p>
            <h1 className="text-xl sm:text-2xl font-serif font-extrabold text-red-950 uppercase tracking-tight">
              INSTITUTE OF TECHNOLOGY
            </h1>
            <p className="text-xs text-slate-700 font-medium">
              An Autonomous Institute Affiliated to University of Mumbai
            </p>
            <p className="text-[11px] text-slate-600">
              Chembur, Mumbai - 400 074
            </p>
            <div className="mt-2 inline-block px-4 py-0.5 border border-red-900/40 text-red-900 font-serif font-bold text-sm tracking-widest uppercase">
              GRADE CARD
            </div>
          </div>

          {/* Student & Examination Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border border-slate-300 p-3 mb-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">NAME:</span>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 font-mono text-xs uppercase focus:outline-none focus:border-indigo-600 flex-1 py-0.5 print:border-none"
                  placeholder="STUDENT / CANDIDATE NAME"
                />
              </div>
              <p className="mt-1">
                <span className="font-semibold text-slate-700">EXAMINATION:</span> {currentSchemeName.toUpperCase()}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-700">HELD IN:</span> ACADEMIC EXAMINATION
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">SEAT NUMBER:</span>
                <input
                  type="text"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  className="bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 font-mono text-xs uppercase focus:outline-none focus:border-indigo-600 flex-1 py-0.5 print:border-none"
                  placeholder="SEAT NO (OPTIONAL)"
                />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-semibold text-slate-700">PRN / ERN:</span>
                <input
                  type="text"
                  value={prnNumber}
                  onChange={(e) => setPrnNumber(e.target.value)}
                  className="bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 font-mono text-xs uppercase focus:outline-none focus:border-indigo-600 flex-1 py-0.5 print:border-none"
                  placeholder="PRN / ERN (OPTIONAL)"
                />
              </div>
              <p className="mt-1">
                <span className="font-semibold text-slate-700">BRANCH:</span> INFORMATION TECHNOLOGY
              </p>
            </div>
          </div>

          {/* Table of Assessment Results (Authentic format from Image 1) */}
          <div className="border border-slate-400 overflow-hidden mb-4">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400 text-center">
                  <th className="border-r border-slate-400 p-1.5 text-left min-w-[85px]">COURSE CODE</th>
                  <th className="border-r border-slate-400 p-1.5 text-left min-w-[170px]">COURSE TITLE</th>
                  <th className="border-r border-slate-400 p-1.5 min-w-[70px]">COURSE CREDITS</th>
                  <th className="border-r border-slate-400 p-1.5 min-w-[65px]">ESE / TW</th>
                  <th className="border-r border-slate-400 p-1.5 min-w-[65px]">MT / PR</th>
                  <th className="border-r border-slate-400 p-1.5 min-w-[65px]">CA / ORAL</th>
                  <th className="border-r border-slate-400 p-1.5 min-w-[70px]">OVERALL</th>
                  <th className="border-r border-slate-400 p-1.5 min-w-[50px]">CR EARN (C)</th>
                  <th className="border-r border-slate-400 p-1.5 min-w-[50px]">GRADE (G)</th>
                  <th className="p-1.5 min-w-[50px]">CXG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {courses.map((c) => {
                  const res = courseResults.get(c.id);
                  const isPending = c.isPending || !res?.isFullyFilled;
                  const hasFailedHead = res?.hasFailedHead || false;
                  const isTheory = c.category === 'TH';

                  return (
                    <tr key={c.id} className="text-center hover:bg-slate-50">
                      <td className="border-r border-slate-300 p-1.5 text-left font-mono font-semibold">
                        {c.courseCode}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 text-left font-medium">
                        {c.courseName}
                        {hasFailedHead && (
                          <span className="block text-[10px] text-red-600 font-bold">
                            * Head of Failure: {res?.failedHeads.map(f => f.headName).join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-bold font-mono">
                        {c.credits} <span className="text-[10px] font-normal text-slate-600">({c.category})</span>
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-mono">
                        {isTheory
                          ? c.ese?.enabled && c.ese.obtained !== null
                            ? `${c.ese.obtained}/${c.ese.max}`
                            : '--'
                          : c.termWork?.enabled && c.termWork.obtained !== null
                          ? `${c.termWork.obtained}/${c.termWork.max}`
                          : '--'}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-mono">
                        {isTheory
                          ? c.midTest?.enabled && c.midTest.obtained !== null
                            ? `${c.midTest.obtained}/${c.midTest.max}`
                            : '--'
                          : c.prOral?.enabled && c.prOral.obtained !== null
                          ? `${c.prOral.obtained}/${c.prOral.max}`
                          : '--'}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-mono">
                        {isTheory && c.ca?.enabled && c.ca.obtained !== null
                          ? `${c.ca.obtained}/${c.ca.max}`
                          : '--'}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-mono font-bold">
                        {isPending
                          ? `_/${res?.totalMax || (isTheory ? 100 : 50)}`
                          : `${res?.totalObtained}/${res?.totalMax}`}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-mono">
                        {isPending ? '--' : res?.creditsEarned}
                      </td>
                      <td className="border-r border-slate-300 p-1.5 font-bold">
                        {isPending ? (
                          'PENDING'
                        ) : hasFailedHead ? (
                          <span className="text-red-700 font-extrabold">F*</span>
                        ) : (
                          `${res?.letterGrade} [${res?.gradePoint}]`
                        )}
                      </td>
                      <td className="p-1.5 font-mono font-bold">
                        {isPending ? '--' : res?.cxg}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-center">
                  <td colSpan={2} className="border-r border-slate-400 p-2 text-right uppercase">
                    TOTAL:
                  </td>
                  <td className="border-r border-slate-400 p-2 font-mono">
                    {overall.totalRegisteredCredits}
                  </td>
                  <td colSpan={4} className="border-r border-slate-400 p-2 text-slate-600 text-[10px]">
                    Evaluation of {overall.filledCoursesCount} of {overall.totalCoursesCount} independent heads
                  </td>
                  <td className="border-r border-slate-400 p-2 font-mono text-emerald-800">
                    {overall.totalEarnedCredits}
                  </td>
                  <td className="border-r border-slate-400 p-2">
                    --
                  </td>
                  <td className="p-2 font-mono text-indigo-900">
                    {analysis.currentSecuredPoints.toFixed(0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Results Summary Box */}
          <div className="border-2 border-slate-800 p-3 bg-slate-50 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-900">
            <div>
              <span className="text-slate-600 mr-1">REMARK:</span>
              <span
                className={`uppercase tracking-wider ${
                  overall.hasAnyFailedCourse
                    ? 'text-red-700'
                    : overall.filledCoursesCount < overall.totalCoursesCount
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {overall.hasAnyFailedCourse
                  ? 'FAILED (HEAD OF FAILURE RE-EXAM REQUIRED)'
                  : overall.filledCoursesCount < overall.totalCoursesCount
                  ? 'PROVISIONAL / TARGET IN SIMULATION'
                  : 'SUCCESSFUL'}
              </span>
            </div>

            <div>
              <span className="text-slate-600 mr-1">SGPI / SGPA:</span>
              <span className="text-lg font-serif text-indigo-900">
                {overall.currentSGPI > 0 ? overall.currentSGPI.toFixed(2) : '--'}
              </span>
            </div>

            <div>
              <span className="text-slate-600 mr-1">MARKS OBTAINED & (%):</span>
              <span className="font-mono">
                {overall.totalObtainedMarks} / {overall.totalMaxMarks} = (
                {overall.overallPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Target Reverse Plan Summary */}
          {analysis.unfilledCredits > 0 && (
            <div className="mt-4 p-3 border border-indigo-200 bg-indigo-50/50 rounded text-xs text-indigo-950">
              <span className="font-bold block text-indigo-900 uppercase tracking-wider text-[11px] mb-1">
                Target GPA Reverse Plan Simulation:
              </span>
              <p>
                Target SGPA: <strong>{analysis.targetSGPI.toFixed(2)}</strong> • Deficit Points Needed:{' '}
                <strong>{analysis.deficitPoints.toFixed(1)}</strong> across{' '}
                <strong>{analysis.unfilledCredits}</strong> pending credits • Required Avg Grade Point:{' '}
                <strong>{analysis.requiredAverageGP.toFixed(2)} / 10.00</strong> (Aim Grade:{' '}
                <strong>{analysis.recommendedLetterGrade}</strong>).
              </p>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-8 pt-6 flex justify-between items-end text-xs text-slate-600">
            <div>
              <p>Result Declared On: {new Date().toLocaleDateString('en-GB')}</p>
              <div className="w-24 h-12 border-b border-dashed border-slate-400 mt-2 flex items-center justify-center text-[10px] text-slate-400">
                [VESIT Seal]
              </div>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-slate-800 pb-1 mb-1 font-serif italic text-slate-800">
                Dr. J. M. Nair
              </div>
              <p className="font-semibold text-slate-800 uppercase">PRINCIPAL</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end gap-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Grade Card</span>
          </button>
        </div>
      </div>
    </div>
  );
};
