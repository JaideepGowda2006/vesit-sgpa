import React from 'react';
import {
  X,
  BookOpen,
  FlaskConical,
  ShieldAlert,
  Award,
  Calculator,
} from 'lucide-react';
import { GRADE_THRESHOLDS } from '../utils/gradingEngine';

interface HowItWorksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksDrawer: React.FC<HowItWorksDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border-l border-black/[0.08] dark:border-white/[0.12] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between sticky top-0 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#0071e3] dark:text-[#2997ff]" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight">
                  Grading Rules & Architecture
                </h3>
                <p className="text-xs text-[#86868b]">
                  Autonomous Mumbai University / VESIT Scheme
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.1] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#86868b] leading-relaxed scrollbar-thin">
            {/* Section 1: Theory vs Lab Separation */}
            <div className="p-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] space-y-2 text-[#1d1d1f] dark:text-[#f5f5f7]">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <FlaskConical className="w-4 h-4 text-[#0071e3] dark:text-[#2997ff]" />
                <span>1. Separate Theory & Lab Rows</span>
              </div>
              <p className="text-xs text-[#86868b]">
                In Mumbai University grade cards, Theory and Practicals are never combined into a single mark. They are graded as independent rows with their own credits:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="font-bold text-[#0071e3] block">Theory (TH)</span>
                  <span>3 Credits • 100 Marks</span>
                  <span className="text-[10px] text-[#86868b] block mt-0.5">MT (20) + CA (20) + ESE (60)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="font-bold text-[#0071e3] block">Lab / TW (TPO)</span>
                  <span>1 Credit • 50 Marks</span>
                  <span className="text-[10px] text-[#86868b] block mt-0.5">TW (25) + Pract/Oral (25)</span>
                </div>
              </div>
            </div>

            {/* Section 2: Head of Failure */}
            <div className="p-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] space-y-2 text-[#1d1d1f] dark:text-[#f5f5f7]">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>2. Head-of-Failure Rules</span>
              </div>
              <p className="text-xs text-[#86868b]">
                Each component has a strict individual minimum passing threshold:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#1d1d1f] dark:text-[#f5f5f7]">
                <li><strong>Theory ESE:</strong> Min 24/60 (or 40/100)</li>
                <li><strong>Mid Test (MT):</strong> Min 8/20</li>
                <li><strong>Continuous Assessment (CA):</strong> Min 8/20</li>
                <li><strong>Term Work (TW):</strong> Min 10/25 (or 20/50)</li>
                <li><strong>Practical/Oral:</strong> Min 10/25</li>
              </ul>
              <p className="text-[11px] text-[#86868b]">
                Failing any individual head marks that specific row as Failed Head (Grade F, GP 0) without affecting other subjects.
              </p>
            </div>

            {/* Section 3: Official Grading Scale */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">
                <Award className="w-4 h-4 text-[#0071e3] dark:text-[#2997ff]" />
                <span>3. University Letter Grade Scale</span>
              </div>

              <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#86868b] font-medium border-b border-black/[0.06] dark:border-white/[0.08]">
                      <th className="p-2.5">Percentage</th>
                      <th className="p-2.5 text-center">Grade</th>
                      <th className="p-2.5 text-center">Point</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06] font-mono text-xs">
                    {GRADE_THRESHOLDS.map((row) => (
                      <tr key={row.letter} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="p-2 text-[#1d1d1f] dark:text-[#f5f5f7]">{row.minPercentage}% and above</td>
                        <td className="p-2 text-center font-bold text-[#0071e3] dark:text-[#2997ff]">{row.letter}</td>
                        <td className="p-2 text-center">{row.point}</td>
                        <td className="p-2 text-[#86868b] font-sans">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Formula */}
            <div className="p-4 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e] space-y-1.5 text-[#1d1d1f] dark:text-[#f5f5f7]">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Calculator className="w-4 h-4 text-[#0071e3] dark:text-[#2997ff]" />
                <span>4. SGPI Calculation Formula</span>
              </div>
              <p className="text-xs font-mono bg-white dark:bg-[#1c1c1e] p-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] text-center font-bold">
                SGPI = Σ (Credits × Grade Point) / Σ Total Credits
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
