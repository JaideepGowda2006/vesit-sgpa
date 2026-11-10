export type CourseType = 'PCC' | 'PEC' | 'OE' | 'MDM' | 'TPO' | 'TH' | 'VS' | 'OTHER';

export type AssessmentCategory = 'TH' | 'TPO'; // Theory vs Term Work / Practical / Oral

export type LetterGrade = 'O' | 'A' | 'B' | 'C' | 'D' | 'E' | 'P' | 'F';

export interface HeadComponent {
  enabled: boolean;
  max: number;
  min: number;
  obtained: number | null; // null represents pending / unfilled
  title: string;
}

export interface CourseAssessment {
  id: string;
  courseCode: string;
  courseName: string;
  courseType: CourseType;
  category: AssessmentCategory; // 'TH' or 'TPO'
  credits: number; // Row credits (e.g., 3 for Theory, 1 for Lab, 2 for Standalone Lab, 4 for OE)
  theoryCredits?: number;
  practicalCredits?: number;
  tutorialCredits?: number;
  contactHours?: {
    th?: number;
    pr?: number;
    tu?: number;
  };
  
  // Assessment Heads
  midTest: HeadComponent;  // MT (typically max 20, min 8 for TH)
  ca: HeadComponent;       // CA (typically max 20, min 8 for TH)
  ese: HeadComponent;      // ESE (typically max 60, min 24 or max 100, min 40 for TH)
  termWork: HeadComponent; // TW (typically max 25, min 10 or max 50, min 20 for TPO)
  prOral: HeadComponent;   // PR/OR (typically max 25, min 10 for TPO)
  
  // Overall custom override if course is simple (e.g. MOOC 100)
  isDirectOverall?: boolean;
  directOverall?: HeadComponent;
  
  isPending?: boolean; // Whether the student hasn't taken or received grades yet
  notes?: string;
  parentCourseCode?: string; // Optional link to relate Theory and Lab of same course
}

export interface HeadFailureInfo {
  headName: string;
  obtained: number;
  minRequired: number;
  max: number;
}

export interface CourseCalculationResult {
  courseId: string;
  totalMax: number;
  totalObtained: number | null; // null if pending
  percentage: number | null;
  letterGrade: LetterGrade;
  gradePoint: number;
  creditsEarned: number;
  cxg: number; // Credits * Grade Point
  hasFailedHead: boolean;
  failedHeads: HeadFailureInfo[];
  isFullyFilled: boolean;
  isPartiallyFilled: boolean;
  aimGrade?: LetterGrade;
  aimGradePoint?: number;
  aimTotalMarks?: number;
  aimMarksRemaining?: number;
}

export interface OverallCalculationResult {
  totalRegisteredCredits: number;
  totalEarnedCredits: number;
  totalMaxMarks: number;
  totalObtainedMarks: number;
  overallPercentage: number;
  currentSGPI: number; // Semester Grade Performance Index
  hasAnyFailedCourse: boolean;
  totalFailedCredits: number;
  filledCoursesCount: number;
  pendingCoursesCount: number;
  totalCoursesCount: number;
}

export interface TargetPlannerAnalysis {
  targetSGPI: number;
  currentSecuredPoints: number; // sum of C*G for filled
  currentSecuredCredits: number;
  totalRegisteredCredits: number;
  unfilledCredits: number;
  totalPointsNeededForTarget: number; // totalCredits * targetSGPI
  deficitPoints: number; // totalPointsNeededForTarget - currentSecuredPoints
  requiredAverageGP: number; // deficitPoints / unfilledCredits
  status: 'unattainable' | 'secured' | 'achievable' | 'all-filled';
  statusMessage: string;
  maxPossibleSGPI: number; // If all remaining get 10.0 GP
  minPossibleSGPI: number; // If all remaining get 4.0 GP
  recommendedLetterGrade: LetterGrade;
}

export interface ExtractedDocument {
  id: string;
  fileName: string;
  docType: 'exam_scheme' | 'teaching_scheme' | 'grade_card' | 'mixed';
  detectedSemester?: string;
  detectedBatch?: string;
  timestamp: string;
  rawCoursesFound: number;
  extractedDetails: string[];
}
