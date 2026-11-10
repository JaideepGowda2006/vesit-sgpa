import React, { useState, useEffect } from 'react';
import type { CourseAssessment, CourseType, AssessmentCategory } from '../types/grading';
import { X } from 'lucide-react';

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
        midTest: { enabled: true, max: 20, min: 8, obtained: null, title: 'Mid Test' },
        ca: { enabled: true, max: 20, min: 8, obtained: null, title: 'Continuous Assessment' },
        ese: { enabled: true, max: 60, min: 24, obtained: null, title: 'End Sem Exam' },
        termWork: { enabled: false, max: 0, min: 0, obtained: null, title: 'Term Work' },
        prOral: { enabled: false, max: 0, min: 0, obtained: null, title: 'Pract & Oral' },
        isDirectOverall: false,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        category: 'TPO',
        credits: prev.credits === 3 ? 1 : prev.credits,
        midTest: { enabled: false, max: 0, min: 0, obtained: null, title: 'Mid Test' },
        ca: { enabled: false, max: 0, min: 0, obtained: null, title: 'Continuous Assessment' },
        ese: { enabled: false, max: 0, min: 0, obtained: null, title: 'End Sem Exam' },
        termWork: { enabled: true, max: 25, min: 10, obtained: null, title: 'Term Work' },
        prOral: { enabled: true, max: 25, min: 10, obtained: null, title: 'Pract & Oral' },
        isDirectOverall: false,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const courseTypes: CourseType[] = ['PCC', 'PEC', 'OE', 'MDM', 'TPO', 'TH', 'VS', 'OTHER'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.12] rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/[0.08] sticky top-0 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur z-10">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
              {initialCourse ? 'Edit Subject' : 'Add Subject'}
            </h3>
            <p className="text-xs text-[#86868b]">
              Configure credits and passing criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.05] dark:hover:bg-white/[0.1] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Category Toggle: Theory (TH) vs Lab (TPO) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f5f5f7] dark:bg-[#2c2c2e]">
            <span className="font-semibold text-xs">Category:</span>
            <div className="inline-flex p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.1]">
              <button
                type="button"
                onClick={() => handleCategoryChange('TH')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  formData.category === 'TH'
                    ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                    : 'text-[#86868b]'
                }`}
              >
                Theory (3 Cr)
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('TPO')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  formData.category === 'TPO'
                    ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                    : 'text-[#86868b]'
                }`}
              >
                Lab / Pract (1 Cr)
              </button>
            </div>
          </div>

          {/* Basic Course Info */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[#86868b] font-medium mb-1">Code</label>
              <input
                type="text"
                required
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                placeholder="26ITPC51"
                className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.12] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>

            <div>
              <label className="block text-[#86868b] font-medium mb-1">Type</label>
              <select
                value={formData.courseType}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value as CourseType })}
                className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.12] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              >
                {courseTypes.map((type) => (
                  <option key={type} value={type} className="bg-white dark:bg-[#1c1c1e]">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#86868b] font-medium mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.12] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] font-bold focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#86868b] font-medium mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              placeholder="e.g. Operating System"
              className="w-full px-3 py-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.12] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>

          {/* Assessment Heads Configuration */}
          <div className="rounded-2xl p-3.5 bg-[#f5f5f7] dark:bg-[#2c2c2e] space-y-2.5">
            <span className="font-semibold text-xs block text-[#1d1d1f] dark:text-[#f5f5f7]">
              Component Heads (Passing Thresholds)
            </span>

            {formData.category === 'TH' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#1c1c1e]">
                  <span>Mid Test (MT)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#86868b]">Min 8 / Max 20</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#1c1c1e]">
                  <span>Continuous Assessment (CA)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#86868b]">Min 8 / Max 20</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#1c1c1e]">
                  <span>End Sem Exam (ESE)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#86868b]">Min 24 / Max 60</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#1c1c1e]">
                  <span>Term Work (TW)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#86868b]">Min 10 / Max 25</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#1c1c1e]">
                  <span>Practical / Oral</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#86868b]">Min 10 / Max 25</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full text-xs font-semibold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm transition"
            >
              Save Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
