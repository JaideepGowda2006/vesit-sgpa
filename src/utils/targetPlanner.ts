import type {
  CourseAssessment,
  CourseCalculationResult,
  LetterGrade,
  TargetPlannerAnalysis,
} from '../types/grading';
import { calculateCourseResult } from './gradingEngine';

export function analyzeTargetSGPI(
  courses: CourseAssessment[],
  courseResults: Map<string, CourseCalculationResult>,
  targetSGPI: number
): TargetPlannerAnalysis {
  let totalRegisteredCredits = 0;
  let currentSecuredPoints = 0;
  let currentSecuredCredits = 0;
  let unfilledCredits = 0;

  for (const course of courses) {
    totalRegisteredCredits += course.credits;
    const result = courseResults.get(course.id);

    if (result && result.isFullyFilled) {
      currentSecuredCredits += course.credits;
      currentSecuredPoints += result.cxg;
    } else {
      unfilledCredits += course.credits;
    }
  }

  const totalPointsNeededForTarget = totalRegisteredCredits * targetSGPI;
  const deficitPoints = totalPointsNeededForTarget - currentSecuredPoints;

  const maxPossiblePoints = currentSecuredPoints + unfilledCredits * 10;
  const maxPossibleSGPI =
    totalRegisteredCredits > 0
      ? Math.round((maxPossiblePoints / totalRegisteredCredits) * 100) / 100
      : 10;

  const minPossiblePoints = currentSecuredPoints + unfilledCredits * 4;
  const minPossibleSGPI =
    totalRegisteredCredits > 0
      ? Math.round((minPossiblePoints / totalRegisteredCredits) * 100) / 100
      : 0;

  if (unfilledCredits === 0) {
    const currentSGPI =
      currentSecuredCredits > 0
        ? Math.round((currentSecuredPoints / currentSecuredCredits) * 100) / 100
        : 0;
    return {
      targetSGPI,
      currentSecuredPoints,
      currentSecuredCredits,
      totalRegisteredCredits,
      unfilledCredits: 0,
      totalPointsNeededForTarget,
      deficitPoints: 0,
      requiredAverageGP: 0,
      status: 'all-filled',
      statusMessage: `All courses evaluated! Final SGPI: ${currentSGPI.toFixed(2)}.`,
      maxPossibleSGPI,
      minPossibleSGPI,
      recommendedLetterGrade: 'O',
    };
  }

  const rawReqGP = deficitPoints / unfilledCredits;
  const requiredAverageGP = Math.round(rawReqGP * 100) / 100;

  let status: 'unattainable' | 'secured' | 'achievable';
  let statusMessage = '';
  let recommendedLetterGrade: LetterGrade = 'O';

  if (requiredAverageGP > 10.0) {
    status = 'unattainable';
    statusMessage = `Target unreachable. Maximum possible SGPA with your current scores is ${maxPossibleSGPI.toFixed(2)}.`;
    recommendedLetterGrade = 'O';
  } else if (requiredAverageGP <= 4.0) {
    status = 'secured';
    statusMessage = `Target Secured! Just clear minimum passing cutoffs in remaining courses to achieve ${targetSGPI.toFixed(2)} SGPA.`;
    recommendedLetterGrade = 'P';
  } else {
    status = 'achievable';
    if (requiredAverageGP > 9.0) {
      recommendedLetterGrade = 'O';
      statusMessage = `Aim for Grade O (≥80%) across pending subjects to hit your target.`;
    } else if (requiredAverageGP > 8.0) {
      recommendedLetterGrade = 'A';
      statusMessage = `Aim for Grade A (≥75%) across pending subjects to hit your target.`;
    } else if (requiredAverageGP > 7.0) {
      recommendedLetterGrade = 'B';
      statusMessage = `Aim for Grade B (≥70%) across pending subjects to hit your target.`;
    } else if (requiredAverageGP > 6.0) {
      recommendedLetterGrade = 'C';
      statusMessage = `Aim for Grade C (≥60%) across pending subjects to hit your target.`;
    } else if (requiredAverageGP > 5.0) {
      recommendedLetterGrade = 'D';
      statusMessage = `Aim for Grade D (≥50%) across pending subjects to hit your target.`;
    } else {
      recommendedLetterGrade = 'E';
      statusMessage = `Aim for Grade E (≥45%) across pending subjects to hit your target.`;
    }
  }

  return {
    targetSGPI,
    currentSecuredPoints,
    currentSecuredCredits,
    totalRegisteredCredits,
    unfilledCredits,
    totalPointsNeededForTarget,
    deficitPoints: Math.round(deficitPoints * 100) / 100,
    requiredAverageGP,
    status,
    statusMessage,
    maxPossibleSGPI,
    minPossibleSGPI,
    recommendedLetterGrade,
  };
}

/**
 * Returns mark estimation for a course based on a target letter grade
 */
export function getTargetMarksForCourse(
  course: CourseAssessment,
  targetGrade: LetterGrade
): {
  totalTargetMarks: number;
  targetPercentage: number;
  suggestedHeads: {
    mt?: number;
    ca?: number;
    ese?: number;
    tw?: number;
    pr?: number;
    direct?: number;
  };
} {
  const calc = calculateCourseResult({ ...course, isPending: false });
  const totalMax = calc.totalMax;

  let targetPercentage = 80;
  switch (targetGrade) {
    case 'O':
      targetPercentage = 84;
      break;
    case 'A':
      targetPercentage = 77;
      break;
    case 'B':
      targetPercentage = 72;
      break;
    case 'C':
      targetPercentage = 64;
      break;
    case 'D':
      targetPercentage = 54;
      break;
    case 'E':
      targetPercentage = 47;
      break;
    case 'P':
      targetPercentage = 42;
      break;
    default:
      targetPercentage = 84;
  }

  const ratio = targetPercentage / 100;
  const totalTargetMarks = Math.ceil(totalMax * ratio);

  const suggestedHeads: {
    mt?: number;
    ca?: number;
    ese?: number;
    tw?: number;
    pr?: number;
    direct?: number;
  } = {};

  if (course.isDirectOverall && course.directOverall?.enabled) {
    suggestedHeads.direct = Math.min(course.directOverall.max, Math.max(course.directOverall.min, Math.round(course.directOverall.max * ratio)));
  } else {
    // Theory Components
    if (course.midTest?.enabled) {
      suggestedHeads.mt = Math.min(course.midTest.max, Math.max(course.midTest.min, Math.round(course.midTest.max * ratio)));
    }
    if (course.ca?.enabled) {
      suggestedHeads.ca = Math.min(course.ca.max, Math.max(course.ca.min, Math.round(course.ca.max * ratio)));
    }
    if (course.ese?.enabled) {
      suggestedHeads.ese = Math.min(course.ese.max, Math.max(course.ese.min, Math.round(course.ese.max * ratio)));
    }

    // Practical / Term Work Components
    if (course.termWork?.enabled) {
      suggestedHeads.tw = Math.min(course.termWork.max, Math.max(course.termWork.min, Math.round(course.termWork.max * ratio)));
    }
    if (course.prOral?.enabled) {
      suggestedHeads.pr = Math.min(course.prOral.max, Math.max(course.prOral.min, Math.round(course.prOral.max * ratio)));
    }
  }

  return {
    totalTargetMarks,
    targetPercentage,
    suggestedHeads,
  };
}

/**
 * Returns exact badge and text for row-level target guidance
 */
export function getAimBadgeDetails(
  course: CourseAssessment,
  analysis: TargetPlannerAnalysis
): {
  status: 'unattainable' | 'safe' | 'target';
  badgeText: string;
  marksText: string;
  minMarksNeeded: number;
  totalMax: number;
} {
  const calc = calculateCourseResult({ ...course, isPending: false });
  const totalMax = calc.totalMax || (course.category === 'TH' ? 100 : 50);

  if (analysis.status === 'unattainable') {
    return {
      status: 'unattainable',
      badgeText: `Unreachable (Max ${analysis.maxPossibleSGPI.toFixed(2)})`,
      marksText: `Max score is ${totalMax}/${totalMax}`,
      minMarksNeeded: Math.ceil(totalMax * 0.80),
      totalMax,
    };
  }

  if (analysis.status === 'secured') {
    const minPassMarks = Math.ceil(totalMax * 0.40);
    return {
      status: 'safe',
      badgeText: `Target Safe (Grade P)`,
      marksText: `Min ${minPassMarks}/${totalMax} to clear cutoffs`,
      minMarksNeeded: minPassMarks,
      totalMax,
    };
  }

  const grade = analysis.recommendedLetterGrade;
  let minPct = 80;
  if (grade === 'O') minPct = 80;
  else if (grade === 'A') minPct = 75;
  else if (grade === 'B') minPct = 70;
  else if (grade === 'C') minPct = 60;
  else if (grade === 'D') minPct = 50;
  else if (grade === 'E') minPct = 45;
  else minPct = 40;

  const minMarksNeeded = Math.ceil(totalMax * (minPct / 100));

  return {
    status: 'target',
    badgeText: `Target: Grade ${grade} (Min ${minMarksNeeded}/${totalMax})`,
    marksText: `Min ${minMarksNeeded}/${totalMax}`,
    minMarksNeeded,
    totalMax,
  };
}
