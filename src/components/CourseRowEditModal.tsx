import React, { useState, useEffect } from 'react';
import type { CourseAssessment, CourseType, AssessmentCategory } from '../types/grading';
import { X, Check, BookOpen, ShieldCheck, FlaskConical } from 'lucide-react';

interface CourseRowEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: CourseAssessment) => void;
  initialCourse: CourseAssessment | null;
}

export const CourseRowEditModal: React.FC<CourseRowEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCourse,
}) => {
  const [formData, setFormData] = useState<CourseAssessment>({
    id: '',
    courseCode: '',
    courseName: '',
    courseType: 'PCC',
    category: 'TH',
    credits: 3,
    midTest: { enabled: true, max: 20, min: 8, obtained: null, title: 'Mid Test' },
    ca: { enabled: true, max: 20, min: 8, obtained: null, title: 'Continuous Assessment' },
    ese: { enabled: true, max: 60, min: 24, obtained: null, title: 'End Sem Exam' },
    termWork: { enabled: false, max: 0, min: 0, obtained: null, title: 'Term Work' },
    prOral: { enabled: false, max: 0, min: 0, obtained: null, title: 'Pract & Oral' },
    isPending: true,
  });

  useEffect(() => {
    if (initialCourse) {
      setFormData(JSON.parse(JSON.stringify(initialCourse)));
    } else {
      setFormData({
        id: 'c_' + Math.random().toString(36).substring(7),
        courseCode: '26ITPC5' + Math.floor(Math.random() * 9 + 1),
        courseName: 'New Subject (Theory)',
        courseType: 'PCC',
        category: 'TH',
        credits: 3,
        midTest: { enabled: true, max: 20, min: 8, obtained: null, title: 'Mid Test' },
        ca: { enabled: true, max: 20, min: 8, obtained: null, title: 'Continuous Assessment' },
        ese: { enabled: true, max: 60, min: 24, obtained: null, title: 'End Sem Exam' },
        termWork: { enabled: false, max: 0, min: 0, obtained: null, title: 'Term Work' },
        prOral: { enabled: false, max: 0, min: 0, obtained: null, title: 'Pract & Oral' },
        isPending: true,
      });
    }
  }, [initialCourse, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: AssessmentCategory) => {
    if (newCat === 'TH') {
      setFormData((prev) => ({
        ...prev,
        category: 'TH',
        credits: prev.credits === 1 ? 3 : prev.credits,
        midTest: { enabled: true, max: 20, min: 8, obtained: prev.midTest?.obtained ?? null, title: 'Mid Test' },
        ca: { enabled: true, max: 20, min: 8, obtained: prev.ca?.obtained ?? null, title: 'Continuous Assessment' },
        ese: { enabled: true, max: 60, min: 24, obtained: prev.ese?.obtained ?? null, title: 'End Sem Exam' },
        termWork: { enabled: false, max: 0, min: 0, obtained: null, title: 'Term Work' },
        prOral: { enabled: false, max: 0, min: 0, obtained: null, title: 'Pract & Oral' },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        category: 'TPO',
        credits: prev.credits === 3 ? 1 : prev.credits,
        midTest: { enabled: false, max: 0, min: 0, obtained: null, title: 'Mid Test' },
        ca: { enabled: false, max: 0, min: 0, obtained: null, title: 'Continuous Assessment' },
        ese: { enabled: false, max: 0, min: 0, obtained: null, title: 'End Sem Exam' },
        termWork: { enabled: true, max: 25, min: 10, obtained: prev.termWork?.obtained ?? null, title: 'Term Work' },
        prOral: { enabled: true, max: 25, min: 10, obtained: prev.prOral?.obtained ?? null, title: 'Pract & Oral' },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseCode.trim() || !formData.courseName.trim()) return;
    onSave(formData);
    onClose();
  };

  const courseTypes: CourseType[] = ['PCC', 'PEC', 'OE', 'MDM', 'TPO', 'TH', 'VS', 'OTHER'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {initialCourse ? 'Edit Course Row' : 'Add New Independent Evaluation Row'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure Theory (TH: 3 Cr / 100M) vs Lab (TPO: 1 Cr / 50M or 2 Cr / 75M)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs">
          {/* Category Toggle: Theory (TH) vs Lab (TPO) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-slate-200 block text-xs">Evaluation Category:</span>
              <span className="text-[11px] text-slate-400">
                In Mumbai University grade cards, Theory and Labs are separate rows with independent credits.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => handleCategoryChange('TH')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
                  formData.category === 'TH'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Theory (TH)</span>
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('TPO')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
                  formData.category === 'TPO'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Lab / TW (TPO)</span>
              </button>
            </div>
          </div>

          {/* Basic Course Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                placeholder="e.g. 26ITPC51"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Course Type</label>
              <select
                value={formData.courseType}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value as CourseType })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {courseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Row Credits (C) *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-bold focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              placeholder={formData.category === 'TH' ? 'e.g. Analysis of Algorithms (Theory)' : 'e.g. Analysis of Algorithms Lab'}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Assessment Heads Configuration */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Assessment Component Heads & Minimum Passing Marks
              </span>
              <span className="text-[11px] text-slate-400">Checked for Head of Failure (F)</span>
            </div>

            {/* Mid Test (MT) */}
            {formData.category === 'TH' && (
              <>
                <div className="grid grid-cols-4 items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer col-span-1">
                    <input
                      type="checkbox"
                      checked={formData.midTest?.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          midTest: { ...formData.midTest, enabled: e.target.checked },
                        })
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span className="font-medium text-slate-300">Mid Test (MT)</span>
                  </label>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Max Mark:</span>
                    <input
                      type="number"
                      disabled={!formData.midTest?.enabled}
                      value={formData.midTest?.max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          midTest: { ...formData.midTest, max: parseInt(e.target.value, 10) || 20 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Min Pass (≥8):</span>
                    <input
                      type="number"
                      disabled={!formData.midTest?.enabled}
                      value={formData.midTest?.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          midTest: { ...formData.midTest, min: parseInt(e.target.value, 10) || 8 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Obtained:</span>
                    <input
                      type="number"
                      disabled={!formData.midTest?.enabled}
                      value={formData.midTest?.obtained ?? ''}
                      placeholder="Pending"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          midTest: {
                            ...formData.midTest,
                            obtained: e.target.value === '' ? null : parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-indigo-300 font-bold text-xs"
                    />
                  </div>
                </div>

                {/* CA */}
                <div className="grid grid-cols-4 items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer col-span-1">
                    <input
                      type="checkbox"
                      checked={formData.ca?.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ca: { ...formData.ca, enabled: e.target.checked },
                        })
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span className="font-medium text-slate-300">Continuous (CA)</span>
                  </label>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Max Mark:</span>
                    <input
                      type="number"
                      disabled={!formData.ca?.enabled}
                      value={formData.ca?.max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ca: { ...formData.ca, max: parseInt(e.target.value, 10) || 20 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Min Pass (≥8):</span>
                    <input
                      type="number"
                      disabled={!formData.ca?.enabled}
                      value={formData.ca?.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ca: { ...formData.ca, min: parseInt(e.target.value, 10) || 8 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Obtained:</span>
                    <input
                      type="number"
                      disabled={!formData.ca?.enabled}
                      value={formData.ca?.obtained ?? ''}
                      placeholder="Pending"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ca: {
                            ...formData.ca,
                            obtained: e.target.value === '' ? null : parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-indigo-300 font-bold text-xs"
                    />
                  </div>
                </div>

                {/* ESE Theory */}
                <div className="grid grid-cols-4 items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer col-span-1">
                    <input
                      type="checkbox"
                      checked={formData.ese?.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ese: { ...formData.ese, enabled: e.target.checked },
                        })
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span className="font-medium text-slate-300">End Sem Exam</span>
                  </label>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Max (60 or 100):</span>
                    <input
                      type="number"
                      disabled={!formData.ese?.enabled}
                      value={formData.ese?.max}
                      onChange={(e) => {
                        const maxVal = parseInt(e.target.value, 10) || 60;
                        setFormData({
                          ...formData,
                          ese: {
                            ...formData.ese,
                            max: maxVal,
                            min: maxVal === 100 ? 40 : 24,
                          },
                        });
                      }}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Min Pass (≥24):</span>
                    <input
                      type="number"
                      disabled={!formData.ese?.enabled}
                      value={formData.ese?.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ese: { ...formData.ese, min: parseInt(e.target.value, 10) || 24 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Obtained:</span>
                    <input
                      type="number"
                      disabled={!formData.ese?.enabled}
                      value={formData.ese?.obtained ?? ''}
                      placeholder="Pending"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ese: {
                            ...formData.ese,
                            obtained: e.target.value === '' ? null : parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-indigo-300 font-bold text-xs"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Term Work & Practical (TPO) */}
            {formData.category === 'TPO' && (
              <>
                {/* Term Work (TW) */}
                <div className="grid grid-cols-4 items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer col-span-1">
                    <input
                      type="checkbox"
                      checked={formData.termWork?.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          termWork: { ...formData.termWork, enabled: e.target.checked },
                        })
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span className="font-medium text-slate-300">Term Work (TW)</span>
                  </label>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Max (25 or 50):</span>
                    <input
                      type="number"
                      disabled={!formData.termWork?.enabled}
                      value={formData.termWork?.max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          termWork: { ...formData.termWork, max: parseInt(e.target.value, 10) || 25 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Min Pass (≥10):</span>
                    <input
                      type="number"
                      disabled={!formData.termWork?.enabled}
                      value={formData.termWork?.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          termWork: { ...formData.termWork, min: parseInt(e.target.value, 10) || 10 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Obtained:</span>
                    <input
                      type="number"
                      disabled={!formData.termWork?.enabled}
                      value={formData.termWork?.obtained ?? ''}
                      placeholder="Pending"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          termWork: {
                            ...formData.termWork,
                            obtained: e.target.value === '' ? null : parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-indigo-300 font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Pract / Oral */}
                <div className="grid grid-cols-4 items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer col-span-1">
                    <input
                      type="checkbox"
                      checked={formData.prOral?.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prOral: { ...formData.prOral, enabled: e.target.checked },
                        })
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span className="font-medium text-slate-300">Pract & Oral</span>
                  </label>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Max Mark:</span>
                    <input
                      type="number"
                      disabled={!formData.prOral?.enabled}
                      value={formData.prOral?.max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prOral: { ...formData.prOral, max: parseInt(e.target.value, 10) || 25 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Min Pass (≥10):</span>
                    <input
                      type="number"
                      disabled={!formData.prOral?.enabled}
                      value={formData.prOral?.min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prOral: { ...formData.prOral, min: parseInt(e.target.value, 10) || 10 },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Obtained:</span>
                    <input
                      type="number"
                      disabled={!formData.prOral?.enabled}
                      value={formData.prOral?.obtained ?? ''}
                      placeholder="Pending"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prOral: {
                            ...formData.prOral,
                            obtained: e.target.value === '' ? null : parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-indigo-300 font-bold text-xs"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pending Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200 block">
                Mark Subject as Pending / Target Simulation Needed
              </span>
              <span className="text-[11px] text-slate-400">
                Subject will be dynamically planned based on your Target SGPA
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isPending}
              onChange={(e) => setFormData({ ...formData, isPending: e.target.checked })}
              className="w-4 h-4 rounded accent-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Course Row</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
