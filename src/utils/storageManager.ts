import type { CourseAssessment } from '../types/grading';
import { PRESET_SCHEMES } from '../data/sampleSchemes';

export const SEMESTER_OPTIONS = [
  {
    id: 'vesit_sgpa_sem4',
    presetKey: 'sem4-vesit-r2025',
    label: 'Semester IV (Autonomous R-2025 IT)',
    description: '11 course rows (Theory + Labs), 24 total credits, authentic VESIT Grade Card',
    defaultTarget: 9.58,
  },
  {
    id: 'vesit_sgpa_sem5',
    presetKey: 'sem5-nep-batch2',
    label: 'Semester V (NEP Batch 2024–28 IT)',
    description: '10 course rows (Theory & Lab split + Standalone Full Stack Lab), 22 total credits',
    defaultTarget: 9.50,
  },
  {
    id: 'vesit_sgpa_custom',
    presetKey: 'custom',
    label: 'Custom / Upload from Screenshot',
    description: 'User-defined syllabus or parsed screenshot schema',
    defaultTarget: 9.00,
  },
];

export interface StoredSemesterData {
  version: number;
  semesterId: string;
  semesterLabel: string;
  targetSGPI: number;
  courses: CourseAssessment[];
  lastUpdated: string;
}

export function loadSemesterData(semesterId: string): {
  courses: CourseAssessment[];
  targetSGPI: number;
} {
  try {
    const raw = localStorage.getItem(semesterId);
    if (raw) {
      const parsed: StoredSemesterData = JSON.parse(raw);
      if (Array.isArray(parsed.courses) && parsed.courses.length > 0) {
        return {
          courses: parsed.courses,
          targetSGPI: typeof parsed.targetSGPI === 'number' ? parsed.targetSGPI : 9.50,
        };
      }
    }
  } catch (err) {
    console.error(`Failed to load from localStorage key ${semesterId}`, err);
  }

  // Fallback to default preset
  const opt = SEMESTER_OPTIONS.find((o) => o.id === semesterId);
  if (opt?.presetKey === 'sem4-vesit-r2025') {
    return {
      courses: JSON.parse(JSON.stringify(PRESET_SCHEMES[1].courses)),
      targetSGPI: PRESET_SCHEMES[1].targetDefault,
    };
  } else if (opt?.presetKey === 'sem5-nep-batch2') {
    return {
      courses: JSON.parse(JSON.stringify(PRESET_SCHEMES[0].courses)),
      targetSGPI: PRESET_SCHEMES[0].targetDefault,
    };
  }

  return {
    courses: JSON.parse(JSON.stringify(PRESET_SCHEMES[0].courses)),
    targetSGPI: 9.50,
  };
}

export function saveSemesterData(
  semesterId: string,
  courses: CourseAssessment[],
  targetSGPI: number
): void {
  try {
    const opt = SEMESTER_OPTIONS.find((o) => o.id === semesterId);
    const data: StoredSemesterData = {
      version: 1,
      semesterId,
      semesterLabel: opt?.label || 'Custom Workspace',
      targetSGPI,
      courses,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(semesterId, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save to localStorage key ${semesterId}`, err);
  }
}

export function resetSemesterData(semesterId: string): {
  courses: CourseAssessment[];
  targetSGPI: number;
} {
  try {
    localStorage.removeItem(semesterId);
  } catch (err) {
    console.error(`Failed to clear localStorage key ${semesterId}`, err);
  }
  return loadSemesterData(semesterId);
}

export function exportWorkspaceJSON(
  semesterId: string,
  courses: CourseAssessment[],
  targetSGPI: number
): string {
  const opt = SEMESTER_OPTIONS.find((o) => o.id === semesterId);
  const data: StoredSemesterData = {
    version: 1,
    semesterId,
    semesterLabel: opt?.label || 'Custom Scheme',
    targetSGPI,
    courses,
    lastUpdated: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importWorkspaceJSON(
  jsonString: string
): {
  success: boolean;
  data?: StoredSemesterData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.courses || !Array.isArray(parsed.courses)) {
      return { success: false, error: 'Invalid JSON: Missing "courses" array.' };
    }
    return {
      success: true,
      data: {
        version: parsed.version || 1,
        semesterId: parsed.semesterId || 'vesit_sgpa_custom',
        semesterLabel: parsed.semesterLabel || 'Imported Workspace',
        targetSGPI: typeof parsed.targetSGPI === 'number' ? parsed.targetSGPI : 9.50,
        courses: parsed.courses,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (err) {
    return { success: false, error: 'Malformed JSON syntax. Please check file contents.' };
  }
}
