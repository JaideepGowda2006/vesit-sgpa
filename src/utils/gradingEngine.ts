import type {
  CourseAssessment,
  CourseCalculationResult,
  HeadFailureInfo,
  LetterGrade,
  OverallCalculationResult,
} from '../types/grading';

export const GRADE_THRESHOLDS: {
  minPercentage: number;
  letter: LetterGrade;
  point: number;
  description: string;
}[] = [
  { minPercentage: 80.0, letter: 'O', point: 10, description: 'Outstanding' },
  { minPercentage: 75.0, letter: 'A', point: 9, description: 'Excellent' },
  { minPercentage: 70.0, letter: 'B', point: 8, description: 'Very Good' },
  { minPercentage: 60.0, letter: 'C', point: 7, description: 'Good' },
  { minPercentage: 50.0, letter: 'D', point: 6, description: 'Fair' },
  { minPercentage: 45.0, letter: 'E', point: 5, description: 'Average' },
  { minPercentage: 40.0, letter: 'P', point: 4, description: 'Pass' },
  { minPercentage: 0.0, letter: 'F', point: 0, description: 'Fail' },
];

export function getGradeFromPercentage(percentage: number): {
  letter: LetterGrade;
  point: number;
  description: string;
} {
  const rounded = Math.round(percentage * 100) / 100;
  for (const bracket of GRADE_THRESHOLDS) {
    if (rounded >= bracket.minPercentage) {
      return bracket;
    }
  }
  return { letter: 'F', point: 0, description: 'Fail' };
}

export function getMinPassingMarkForHead(maxMark: number): number {
  if (maxMark === 60) return 24;
  if (maxMark === 100) return 40;
  if (maxMark === 20) return 8;
  if (maxMark === 25) return 10;
  if (maxMark === 50) return 20;
  // Default 40% rule
  return Math.ceil(maxMark * 0.4);
}

/**
 * Calculates a single course's assessment outcomes:
 * Checks individual head passing criteria, total percentage, letter grade, and credits.
 */
export function calculateCourseResult(course: CourseAssessment): CourseCalculationResult {
  const failedHeads: HeadFailureInfo[] = [];
  let totalMax = 0;
  let totalObtained = 0;
  let hasAnyMark = false;
  let allEnabledFilled = true;

  // Direct overall mode (e.g. NPTEL / MOOC course)
  if (course.isDirectOverall && course.directOverall?.enabled) {
    totalMax = course.directOverall.max;
    if (course.directOverall.obtained !== null && course.directOverall.obtained !== undefined) {
      hasAnyMark = true;
      totalObtained = course.directOverall.obtained;
      if (course.directOverall.obtained < course.directOverall.min) {
        failedHeads.push({
          headName: course.directOverall.title || 'Overall Assessment',
          obtained: course.directOverall.obtained,
          minRequired: course.directOverall.min,
          max: course.directOverall.max,
        });
      }
    } else {
      allEnabledFilled = false;
    }
  } else {
    // Check all 5 standard assessment heads: MT, CA, ESE, TW, PR/OR
    const headsToCheck = [
      { key: 'MT', comp: course.midTest },
      { key: 'CA', comp: course.ca },
      { key: 'ESE', comp: course.ese },
      { key: 'TW', comp: course.termWork },
      { key: 'PR/OR', comp: course.prOral },
    ];

    for (const { key, comp } of headsToCheck) {
      if (comp && comp.enabled) {
        totalMax += comp.max;
        if (comp.obtained !== null && comp.obtained !== undefined) {
          hasAnyMark = true;
          totalObtained += comp.obtained;

          // Validate minimum passing head requirement
          const minRequired = comp.min || getMinPassingMarkForHead(comp.max);
          if (comp.obtained < minRequired) {
            failedHeads.push({
              headName: `${comp.title || key}`,
              obtained: comp.obtained,
              minRequired,
              max: comp.max,
            });
          }
        } else {
          allEnabledFilled = false;
        }
      }
    }
  }

  const isFullyFilled = allEnabledFilled && hasAnyMark && !course.isPending;
  const isPartiallyFilled = hasAnyMark && !isFullyFilled;

  if (!hasAnyMark || course.isPending) {
    return {
      courseId: course.id,
      totalMax,
      totalObtained: null,
      percentage: null,
      letterGrade: 'P',
      gradePoint: 0,
      creditsEarned: 0,
      cxg: 0,
      hasFailedHead: false,
      failedHeads: [],
      isFullyFilled: false,
      isPartiallyFilled: false,
    };
  }

  const hasFailedHead = failedHeads.length > 0;
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const gradeInfo = getGradeFromPercentage(percentage);

  // CRITICAL RULE: If any mandatory head failed, the grade is F, Grade Point = 0, Earned Credits = 0
  if (hasFailedHead || gradeInfo.letter === 'F') {
    return {
      courseId: course.id,
      totalMax,
      totalObtained,
      percentage,
      letterGrade: 'F',
      gradePoint: 0,
      creditsEarned: 0,
      cxg: 0,
      hasFailedHead,
      failedHeads,
      isFullyFilled,
      isPartiallyFilled,
    };
  }

  const gradePoint = gradeInfo.point;
  const creditsEarned = course.credits;
  const cxg = creditsEarned * gradePoint;

  return {
    courseId: course.id,
    totalMax,
    totalObtained,
    percentage,
    letterGrade: gradeInfo.letter,
    gradePoint,
    creditsEarned,
    cxg,
    hasFailedHead: false,
    failedHeads: [],
    isFullyFilled,
    isPartiallyFilled,
  };
}

/**
 * Calculates overall SGPI, total credits, earned credits, and overall marks
 */
export function calculateOverallResults(
  courses: CourseAssessment[],
  courseResults: Map<string, CourseCalculationResult>
): OverallCalculationResult {
  let totalRegisteredCredits = 0;
  let totalEarnedCredits = 0;
  let totalMaxMarks = 0;
  let totalObtainedMarks = 0;
  let totalCxG = 0;
  let hasAnyFailedCourse = false;
  let totalFailedCredits = 0;
  let filledCoursesCount = 0;
  let pendingCoursesCount = 0;

  for (const course of courses) {
    totalRegisteredCredits += course.credits;
    const result = courseResults.get(course.id);

    if (result && result.isFullyFilled) {
      filledCoursesCount++;
      totalMaxMarks += result.totalMax;
      totalObtainedMarks += result.totalObtained ?? 0;
      totalCxG += result.cxg;

      if (result.letterGrade === 'F' || result.hasFailedHead) {
        hasAnyFailedCourse = true;
        totalFailedCredits += course.credits;
      } else {
        totalEarnedCredits += result.creditsEarned;
      }
    } else {
      pendingCoursesCount++;
      const calc = calculateCourseResult({ ...course, isPending: false });
      totalMaxMarks += calc.totalMax;
    }
  }

  const evaluatedCredits = filledCoursesCount > 0
    ? courses
        .filter((c) => {
          const res = courseResults.get(c.id);
          return res && res.isFullyFilled;
        })
        .reduce((sum, c) => sum + c.credits, 0)
    : 0;

  const currentSGPI = evaluatedCredits > 0 ? totalCxG / evaluatedCredits : 0;
  const overallPercentage = totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * 100 : 0;

  return {
    totalRegisteredCredits,
    totalEarnedCredits,
    totalMaxMarks,
    totalObtainedMarks,
    overallPercentage: Math.round(overallPercentage * 100) / 100,
    currentSGPI: Math.round(currentSGPI * 100) / 100,
    hasAnyFailedCourse,
    totalFailedCredits,
    filledCoursesCount,
    pendingCoursesCount,
    totalCoursesCount: courses.length,
  };
}
