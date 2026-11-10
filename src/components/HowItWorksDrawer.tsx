import React from 'react';
import {
  X,
  BookOpen,
  Layers,
  ShieldAlert,
  Award,
  Calculator,
  FlaskConical,
} from 'lucide-react';
import { GRADE_THRESHOLDS } from '../utils/gradingEngine';

interface HowItWorksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksDrawer: React.FC<HowItWorksDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  University Scheme & Planner Architecture
                </h3>
                <p className="text-xs text-slate-400">
                  VESIT (Autonomous) / Mumbai University R-2025 NEP Batch Guide
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed scrollbar-thin">
            {/* Section 1: Theory vs. Lab Split Architecture */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <FlaskConical className="w-4 h-4 text-indigo-400" />
                <span>1. Independent Theory (TH) & Lab (TPO) Evaluation</span>
              </div>
              <p className="text-slate-200 font-medium">
                In Mumbai University and VESIT Autonomous grade cards, Theory and Practicals are never combined into a single mark. They are graded as separate entries:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-indigo-500/30">
                  <span className="font-bold text-indigo-300 block mb-1">📘 Theory Row (TH):</span>
                  <ul className="space-y-0.5 text-slate-300">
                    <li>• Weight: <strong>3 Credits</strong></li>
                    <li>• Total: <strong>100 Marks</strong></li>
                    <li>• Mid Term (MT): 20 (Min 8)</li>
                    <li>• Continuous Assessment (CA): 20 (Min 8)</li>
                    <li>• End Sem Exam (ESE): 60 (Min 24)</li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/30">
                  <span className="font-bold text-cyan-300 block mb-1">🧪 Lab / TW Row (TPO):</span>
                  <ul className="space-y-0.5 text-slate-300">
                    <li>• Weight: <strong>1 Credit</strong> (or 2 for standalone)</li>
                    <li>• Total: <strong>50 Marks</strong> (or 75)</li>
                    <li>• Term Work (TW): 25 (Min 10)</li>
                    <li>• Practical / Oral (PR): 25 (Min 10)</li>
                  </ul>
                </div>
              </div>
              <p className="text-indigo-200 text-[11px]">
                Each row independently earns its own Letter Grade ($O, A, B, \dots$), Grade Point ($G$), and Credit Points ($C \times G$).
              </p>
            </div>

            {/* Section 2: Multi-Doc OCR & Cross-Referencing */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Layers className="w-4 h-4" />
                <span>2. Multi-Document OCR & Cross-Referencing Engine</span>
              </div>
              <p>
                In autonomous colleges, assessment heads and credit allocations are published in separate documents:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>
                  <strong className="text-slate-200">Examination Scheme:</strong> Outlines internal tests (MT 20), CA (20), ESE (60), TW (25), and PR (25).
                </li>
                <li>
                  <strong className="text-slate-200">Teaching Scheme:</strong> Outlines weekly contact hours and divides credits between Theory (3) and Practical (1).
                </li>
              </ul>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                The extraction engine normalizes course codes (e.g., <code className="text-white font-mono bg-indigo-950 px-1 py-0.5 rounded">26ITPC51</code>), extracts both schemes, and automatically generates two independent rows for each course containing practicals.
              </div>
            </div>

            {/* Section 3: Grading Matrix */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Award className="w-4 h-4" />
                <span>3. Official Letter Grade & Grade Point Scale</span>
              </div>
              <p>
                As published on the reverse of the VESIT Grade Card (Engineering Under Graduate scheme):
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="py-2 px-3">Percentage of Marks</th>
                      <th className="py-2 px-3 text-center">Letter Grade</th>
                      <th className="py-2 px-3 text-center">Grade Point (G)</th>
                      <th className="py-2 px-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {GRADE_THRESHOLDS.map((row) => (
                      <tr key={row.letter} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 text-slate-300">
                          {row.minPercentage > 0 ? `≥ ${row.minPercentage.toFixed(2)}%` : '< 40.00%'}
                        </td>
                        <td className="py-1.5 px-3 text-center font-bold text-indigo-300">
                          {row.letter}
                        </td>
                        <td className="py-1.5 px-3 text-center font-bold text-slate-100">
                          {row.point}
                        </td>
                        <td className="py-1.5 px-3 text-slate-400 font-sans">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Head of Failure (F-Head) Rule */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>4. Individual Head Minimums & Head of Failure (F-Head)</span>
              </div>
              <p className="text-rose-200">
                Every mandatory head must be cleared independently:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-slate-950/80 rounded border border-rose-500/20">
                  <span className="text-slate-400 block text-[10px]">ESE Theory (60):</span>
                  <span className="font-bold text-rose-300">Min 24 / 60</span>
                </div>
                <div className="p-2 bg-slate-950/80 rounded border border-rose-500/20">
                  <span className="text-slate-400 block text-[10px]">Mid Test MT (20):</span>
                  <span className="font-bold text-rose-300">Min 8 / 20</span>
                </div>
                <div className="p-2 bg-slate-950/80 rounded border border-rose-500/20">
                  <span className="text-slate-400 block text-[10px]">Continuous CA (20):</span>
                  <span className="font-bold text-rose-300">Min 8 / 20</span>
                </div>
                <div className="p-2 bg-slate-950/80 rounded border border-rose-500/20">
                  <span className="text-slate-400 block text-[10px]">Term Work TW (25):</span>
                  <span className="font-bold text-rose-300">Min 10 / 25</span>
                </div>
                <div className="p-2 bg-slate-950/80 rounded border border-rose-500/20">
                  <span className="text-slate-400 block text-[10px]">Pract / Oral (25):</span>
                  <span className="font-bold text-rose-300">Min 10 / 25</span>
                </div>
                <div className="p-2 bg-slate-950/80 rounded border border-rose-500/20">
                  <span className="text-slate-400 block text-[10px]">ESE Theory (100):</span>
                  <span className="font-bold text-rose-300">Min 40 / 100</span>
                </div>
              </div>
              <p className="text-rose-300 text-[11px] font-medium">
                ⚠️ Critical Rule: If a student scores less than 24 in ESE Theory, that specific Theory row gets <strong>Grade F, GP = 0, Earned Credits = 0</strong>. However, their Lab row remains unaffected and retains its full credits and Grade Point!
              </p>
            </div>

            {/* Section 5: Reverse Target GPA Mathematical Formulation */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Calculator className="w-4 h-4" />
                <span>5. Dynamic Reverse Target SGPA Planner Formulas</span>
              </div>
              <p>
                When some rows have known marks and others remain pending, the planner calculates the exact target requirements:
              </p>
              <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-slate-300 space-y-2 border border-slate-800">
                <p>
                  1. Target Total Points = Total Credits × Target SGPI
                </p>
                <p>
                  2. Points Scored = Σ(Row Credits × Grade Point)
                </p>
                <p>
                  3. Deficit Points Needed = Target Points - Points Scored
                </p>
                <p className="text-indigo-400 font-bold">
                  4. Required Average Grade Point = Deficit Points / Remaining Unfilled Credits
                </p>
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
