import type {
  CourseAssessment,
  CourseCalculationResult,
  LetterGrade,
} from '../types/grading';
import { calculateCourseResult } from './gradingEngine';

export interface ESENeededAnalysis {
  knownInternalMarks: number;
  eseMax: number;
  eseMinPass: number;
  neededForGrade: number;
  isPassingCutoffConstrained: boolean;
  isUnattainableForGrade: boolean;
  displayText: string;
}

export interface RoadmapCourseItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  category: 'TH' | 'TPO';
  credits: number;
  totalMax: number;
  targetGrade: LetterGrade;
  targetGradePoint: number;
  minMarksNeeded: number;
  eseAnalysis?: ESENeededAnalysis;
  suggestedMarks: {
    mt?: number | null;
    ca?: number | null;
    ese?: number | null;
    tw?: number | null;
    pr?: number | null;
    direct?: number | null;
    total: number;
  };
}

export interface RoadmapPlan {
  id: 'balanced' | 'realistic';
  title: string;
  badge: string;
  description: string;
  summarySentence: string;
  gradeCounts: { grade: LetterGrade; count: number; credits: number }[];
  achievableSGPI: number;
  items: RoadmapCourseItem[];
}

export interface RoadmapAnalysis {
  targetSGPI: number;
  totalRegisteredCredits: number;
  currentSecuredCredits: number;
  unfilledCredits: number;
  unfilledCount: number;
  currentSecuredPoints: number;
  deficitPoints: number;
  maxPossibleSGPI: number;
  minPossibleSGPI: number;
  status: 'unreachable' | 'secured' | 'achievable' | 'all-filled';
  statusMessage: string;
  summaryTitle: string;
  summarySubtitle: string;
  plans: RoadmapPlan[];
}

/**
 * Returns minimum total marks needed out of totalMax for a given letter grade.
 * Autonomous MU scale:
 * O: >= 80%
 * A: >= 75%
 * B: >= 70%
 * C: >= 60%
 * D: >= 50%
 * E: >= 45%
 * P: >= 40%
 */
export function getMinMarksForGrade(totalMax: number, grade: LetterGrade): number {
  let minPct = 80;
  switch (grade) {
    case 'O':
      minPct = 80;
      break;
    case 'A':
      minPct = 75;
      break;
    case 'B':
      minPct = 70;
      break;
    case 'C':
      minPct = 60;
      break;
    case 'D':
      minPct = 50;
      break;
    case 'E':
      minPct = 45;
      break;
    case 'P':
      minPct = 40;
      break;
    default:
      minPct = 80;
  }
  return Math.ceil(totalMax * (minPct / 100));
}

export function getGradePointFromLetter(grade: LetterGrade): number {
  switch (grade) {
    case 'O':
      return 10;
    case 'A':
      return 9;
    case 'B':
      return 8;
    case 'C':
      return 7;
    case 'D':
      return 6;
    case 'E':
      return 5;
    case 'P':
      return 4;
    default:
      return 0;
  }
}

export function getLetterFromGradePoint(gp: number): LetterGrade {
  if (gp >= 10) return 'O';
  if (gp >= 9) return 'A';
  if (gp >= 8) return 'B';
  if (gp >= 7) return 'C';
  if (gp >= 6) return 'D';
  if (gp >= 5) return 'E';
  return 'P';
}

/**
 * Calculates exact ESE mark needed out of 60 if MT and CA are known.
 */
export function calculateESENeededForCourse(
  course: CourseAssessment,
  targetGrade: LetterGrade
): ESENeededAnalysis | undefined {
  if (course.category !== 'TH' || !course.ese?.enabled) {
    return undefined;
  }

  const hasMt = course.midTest?.enabled && course.midTest.obtained !== null;
  const hasCa = course.ca?.enabled && course.ca.obtained !== null;

  // We analyze ESE when either MT or CA or both are already evaluated
  if (!hasMt && !hasCa) {
    return undefined;
  }

  const knownInternalMarks = (course.midTest?.obtained || 0) + (course.ca?.obtained || 0);
  const totalMax = (course.midTest?.max || 20) + (course.ca?.max || 20) + (course.ese?.max || 60);
  const targetTotal = getMinMarksForGrade(totalMax, targetGrade);
  const eseMax = course.ese.max || 60;
  const eseMinPass = course.ese.min || 24;

  const rawNeeded = targetTotal - knownInternalMarks;

  if (rawNeeded > eseMax) {
    return {
      knownInternalMarks,
      eseMax,
      eseMinPass,
      neededForGrade: rawNeeded,
      isPassingCutoffConstrained: false,
      isUnattainableForGrade: true,
      displayText: `Requires > ${eseMax}/${eseMax} in ESE for Grade ${targetGrade}`,
    };
  }

  if (rawNeeded < eseMinPass) {
    return {
      knownInternalMarks,
      eseMax,
      eseMinPass,
      neededForGrade: eseMinPass,
      isPassingCutoffConstrained: true,
      isUnattainableForGrade: false,
      displayText: `Need ≥ ${eseMinPass}/${eseMax} in ESE (Passing cutoff is ${eseMinPass})`,
    };
  }

  return {
    knownInternalMarks,
    eseMax,
    eseMinPass,
    neededForGrade: rawNeeded,
    isPassingCutoffConstrained: false,
    isUnattainableForGrade: false,
    displayText: `Need ≥ ${rawNeeded}/${eseMax} in ESE for Grade ${targetGrade}`,
  };
}

/**
 * Builds realistic head breakdown marks to hit minMarksNeeded for a course.
 * Preserves already entered known marks and only fills missing heads.
 */
export function buildSuggestedHeadsForCourse(
  course: CourseAssessment,
  targetGrade: LetterGrade
): {
  mt?: number | null;
  ca?: number | null;
  ese?: number | null;
  tw?: number | null;
  pr?: number | null;
  direct?: number | null;
  total: number;
} {
  const calc = calculateCourseResult({ ...course, isPending: false });
  const totalMax = calc.totalMax || (course.category === 'TH' ? 100 : 50);
  const minTargetMarks = getMinMarksForGrade(totalMax, targetGrade);

  if (course.isDirectOverall && course.directOverall?.enabled) {
    return {
      direct: Math.min(course.directOverall.max, Math.max(course.directOverall.min, minTargetMarks)),
      total: minTargetMarks,
    };
  }

  if (course.category === 'TH') {
    const knownMt = course.midTest?.obtained;
    const knownCa = course.ca?.obtained;
    const knownEse = course.ese?.obtained;

    let mtVal = knownMt;
    let caVal = knownCa;
    let eseVal = knownEse;

    // Proportion ratios for clean round numbers: MT 20%, CA 20%, ESE 60%
    const ratio = minTargetMarks / totalMax;

    if (mtVal === null || mtVal === undefined) {
      const suggested = Math.round(20 * ratio);
      mtVal = Math.min(20, Math.max(8, suggested));
    }

    if (caVal === null || caVal === undefined) {
      const suggested = Math.round(20 * ratio);
      caVal = Math.min(20, Math.max(8, suggested));
    }

    if (eseVal === null || eseVal === undefined) {
      // Balance exact remaining needed to hit target
      const currentInternal = (mtVal || 0) + (caVal || 0);
      const neededEse = minTargetMarks - currentInternal;
      eseVal = Math.min(60, Math.max(24, neededEse));
    }

    const total = (mtVal || 0) + (caVal || 0) + (eseVal || 0);
    return {
      mt: mtVal,
      ca: caVal,
      ese: eseVal,
      total,
    };
  }

  // Lab / Practical (category 'TPO')
  const knownTw = course.termWork?.obtained;
  const knownPr = course.prOral?.obtained;
  const twMax = course.termWork?.max || 25;
  const twMin = course.termWork?.min || 10;
  const prMax = course.prOral?.max || 25;
  const prMin = course.prOral?.min || 10;

  let twVal = knownTw;
  let prVal = knownPr;

  const ratio = minTargetMarks / totalMax;

  if (twVal === null || twVal === undefined) {
    twVal = Math.min(twMax, Math.max(twMin, Math.round(twMax * ratio)));
  }

  if (prVal === null || prVal === undefined) {
    const remainingNeeded = minTargetMarks - (twVal || 0);
    prVal = Math.min(prMax, Math.max(prMin, Math.max(Math.round(prMax * ratio), remainingNeeded)));
  }

  const total = (twVal || 0) + (prVal || 0);
  return {
    tw: twVal,
    pr: prVal,
    total,
  };
}

/**
 * Generates discrete whole-grade roadmap plans for unfilled subjects.
 */
export function generateRoadmapAnalysis(
  courses: CourseAssessment[],
  courseResults: Map<string, CourseCalculationResult>,
  targetSGPI: number
): RoadmapAnalysis {
  let totalRegisteredCredits = 0;
  let currentSecuredPoints = 0;
  let currentSecuredCredits = 0;

  const unfilledCourses: CourseAssessment[] = [];

  for (const course of courses) {
    totalRegisteredCredits += course.credits;
    const res = courseResults.get(course.id);
    if (res && res.isFullyFilled && !course.isPending) {
      currentSecuredCredits += course.credits;
      currentSecuredPoints += res.cxg;
    } else {
      unfilledCourses.push(course);
    }
  }

  const unfilledCredits = totalRegisteredCredits - currentSecuredCredits;
  const unfilledCount = unfilledCourses.length;

  const totalPointsNeeded = totalRegisteredCredits * targetSGPI;
  const deficitPoints = Math.max(0, totalPointsNeeded - currentSecuredPoints);

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

  // Case 1: All courses are already filled
  if (unfilledCredits === 0) {
    const currentSGPI =
      totalRegisteredCredits > 0
        ? Math.round((currentSecuredPoints / totalRegisteredCredits) * 100) / 100
        : 0;
    return {
      targetSGPI,
      totalRegisteredCredits,
      currentSecuredCredits,
      unfilledCredits: 0,
      unfilledCount: 0,
      currentSecuredPoints,
      deficitPoints: 0,
      maxPossibleSGPI,
      minPossibleSGPI,
      status: 'all-filled',
      statusMessage: `All subjects evaluated! Final SGPI: ${currentSGPI.toFixed(2)}.`,
      summaryTitle: 'All Subjects Evaluated',
      summarySubtitle: `Your final calculated SGPI is ${currentSGPI.toFixed(2)} / 10.00.`,
      plans: [],
    };
  }

  // Case 2: Target is mathematically unreachable
  if (deficitPoints > unfilledCredits * 10) {
    return {
      targetSGPI,
      totalRegisteredCredits,
      currentSecuredCredits,
      unfilledCredits,
      unfilledCount,
      currentSecuredPoints,
      deficitPoints,
      maxPossibleSGPI,
      minPossibleSGPI,
      status: 'unreachable',
      statusMessage: `Target unreachable. Maximum possible SGPI with your current scores is ${maxPossibleSGPI.toFixed(2)}.`,
      summaryTitle: 'Target Unreachable',
      summarySubtitle: `Target unreachable. Maximum possible SGPI with your current scores is ${maxPossibleSGPI.toFixed(2)}.`,
      plans: [],
    };
  }

  // Case 3: Target is already secured just by passing
  if (deficitPoints <= unfilledCredits * 4) {
    const buildPassingPlan = (id: 'balanced' | 'realistic', title: string): RoadmapPlan => {
      const items: RoadmapCourseItem[] = unfilledCourses.map((c) => {
        const calc = calculateCourseResult({ ...c, isPending: false });
        const totalMax = calc.totalMax || (c.category === 'TH' ? 100 : 50);
        return {
          courseId: c.id,
          courseCode: c.courseCode,
          courseName: c.courseName,
          category: c.category,
          credits: c.credits,
          totalMax,
          targetGrade: 'P',
          targetGradePoint: 4,
          minMarksNeeded: getMinMarksForGrade(totalMax, 'P'),
          eseAnalysis: calculateESENeededForCourse(c, 'P'),
          suggestedMarks: buildSuggestedHeadsForCourse(c, 'P'),
        };
      });

      return {
        id,
        title,
        badge: 'Safe Target',
        description: 'Just clear minimum passing cutoffs in all remaining subjects.',
        summarySentence: `Pass all ${unfilledCount} pending subjects with Grade P (≥40%) to secure your target.`,
        gradeCounts: [{ grade: 'P', count: unfilledCount, credits: unfilledCredits }],
        achievableSGPI: Math.round(((currentSecuredPoints + unfilledCredits * 4) / totalRegisteredCredits) * 100) / 100,
        items,
      };
    };

    return {
      targetSGPI,
      totalRegisteredCredits,
      currentSecuredCredits,
      unfilledCredits,
      unfilledCount,
      currentSecuredPoints,
      deficitPoints,
      maxPossibleSGPI,
      minPossibleSGPI,
      status: 'secured',
      statusMessage: `Target Secured! Clearing minimum passing cutoffs (40%) in remaining courses guarantees ≥ ${targetSGPI.toFixed(2)} SGPA.`,
      summaryTitle: `Target Already Secured (≥ ${targetSGPI.toFixed(2)})`,
      summarySubtitle: `You only need passing marks (Grade P / 40%) in the ${unfilledCredits} remaining credits.`,
      plans: [
        buildPassingPlan('balanced', 'Balanced Passing Plan'),
        buildPassingPlan('realistic', 'Realistic Passing Plan'),
      ],
    };
  }

  // Case 4: Target is Achievable - compute discrete whole-grade distributions
  // -------------------------------------------------------------------------

  // --- Plan 1: Balanced Plan (Even Distribution) ---
  // Assign whole letter grades {10, 9, 8, 7, 6, 5, 4} as evenly as possible
  const balancedAssignments = distributeWholeGradesEvenly(unfilledCourses, deficitPoints);
  const balancedPlan = createPlanFromAssignments(
    'balanced',
    'Balanced Plan',
    'Even Distribution',
    'Distributes target grades as evenly as possible across all pending courses.',
    unfilledCourses,
    balancedAssignments,
    currentSecuredPoints,
    totalRegisteredCredits
  );

  // --- Plan 2: Realistic Plan (Lab-Boosted) ---
  // Autonomous labs (TW/PR) usually score high (Grade O / 80%+).
  // Lock labs to Grade O, which relieves theory exam pressure.
  const realisticAssignments = distributeWholeGradesLabBiased(unfilledCourses, deficitPoints);
  const realisticPlan = createPlanFromAssignments(
    'realistic',
    'Realistic Plan',
    'Lab Boosted',
    'Sets college labs (TW/PR) to Grade O, significantly reducing required Theory exam marks.',
    unfilledCourses,
    realisticAssignments,
    currentSecuredPoints,
    totalRegisteredCredits
  );

  return {
    targetSGPI,
    totalRegisteredCredits,
    currentSecuredCredits,
    unfilledCredits,
    unfilledCount,
    currentSecuredPoints,
    deficitPoints,
    maxPossibleSGPI,
    minPossibleSGPI,
    status: 'achievable',
    statusMessage: `To hit your target of ${targetSGPI.toFixed(2)} SGPA with ${unfilledCredits} credits remaining:`,
    summaryTitle: `To hit your target of ${targetSGPI.toFixed(2)} SGPA with ${unfilledCredits} credits remaining:`,
    summarySubtitle: balancedPlan.summarySentence,
    plans: [balancedPlan, realisticPlan],
  };
}

/**
 * Distributes whole grade points evenly across courses such that sum(credits * GP) >= deficit.
 */
function distributeWholeGradesEvenly(
  courses: CourseAssessment[],
  deficitPoints: number
): Map<string, LetterGrade> {
  const result = new Map<string, number>();

  // Start all courses at minimum passing GP = 4 (Grade P)
  for (const c of courses) {
    result.set(c.id, 4);
  }

  let currentPoints = courses.reduce((sum, c) => sum + c.credits * 4, 0);

  // Sort: higher credits first (theory 3/4 credits elevated before 1-credit labs)
  const sorted = [...courses].sort((a, b) => {
    if (b.credits !== a.credits) return b.credits - a.credits;
    if (a.category !== b.category) return a.category === 'TH' ? -1 : 1;
    return a.courseCode.localeCompare(b.courseCode);
  });

  // Incrementally step up all grades level by level (4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10)
  for (let level = 4; level < 10; level++) {
    if (currentPoints >= deficitPoints) break;

    for (const c of sorted) {
      if (currentPoints >= deficitPoints) break;
      const currentGP = result.get(c.id) || 4;
      if (currentGP === level) {
        result.set(c.id, level + 1);
        currentPoints += c.credits;
      }
    }
  }

  const finalMap = new Map<string, LetterGrade>();
  for (const c of courses) {
    const gp = result.get(c.id) || 4;
    finalMap.set(c.id, getLetterFromGradePoint(gp));
  }
  return finalMap;
}

/**
 * Distributes whole grade points by setting Labs to Grade O (10 GP) and solving remaining for Theory.
 */
function distributeWholeGradesLabBiased(
  courses: CourseAssessment[],
  deficitPoints: number
): Map<string, LetterGrade> {
  const result = new Map<string, number>();

  const labs = courses.filter((c) => c.category === 'TPO');
  const theory = courses.filter((c) => c.category === 'TH');

  // If there are no labs, fall back to balanced
  if (labs.length === 0) {
    return distributeWholeGradesEvenly(courses, deficitPoints);
  }

  // 1. Assign all labs Grade O (10 GP)
  let labPoints = 0;
  for (const l of labs) {
    result.set(l.id, 10);
    labPoints += l.credits * 10;
  }

  // 2. Solve deficit for theory
  const remainingDeficit = Math.max(
    theory.reduce((s, c) => s + c.credits * 4, 0),
    deficitPoints - labPoints
  );

  // If there is no theory, labs already carry everything
  if (theory.length === 0) {
    const finalMap = new Map<string, LetterGrade>();
    for (const c of courses) {
      finalMap.set(c.id, 'O');
    }
    return finalMap;
  }

  // Start theory at Grade P (4 GP)
  for (const t of theory) {
    result.set(t.id, 4);
  }
  let currentTheoryPoints = theory.reduce((sum, c) => sum + c.credits * 4, 0);

  // Sort theory by credits descending
  const sortedTheory = [...theory].sort((a, b) => b.credits - a.credits);

  for (let level = 4; level < 10; level++) {
    if (currentTheoryPoints >= remainingDeficit) break;

    for (const t of sortedTheory) {
      if (currentTheoryPoints >= remainingDeficit) break;
      const currentGP = result.get(t.id) || 4;
      if (currentGP === level) {
        result.set(t.id, level + 1);
        currentTheoryPoints += t.credits;
      }
    }
  }

  const finalMap = new Map<string, LetterGrade>();
  for (const c of courses) {
    const gp = result.get(c.id) || 4;
    finalMap.set(c.id, getLetterFromGradePoint(gp));
  }
  return finalMap;
}

/**
 * Assembles a complete RoadmapPlan with discrete grade counts and readable summary sentences.
 */
function createPlanFromAssignments(
  id: 'balanced' | 'realistic',
  title: string,
  badge: string,
  description: string,
  courses: CourseAssessment[],
  assignments: Map<string, LetterGrade>,
  currentSecuredPoints: number,
  totalRegisteredCredits: number
): RoadmapPlan {
  const countsMap = new Map<LetterGrade, { count: number; credits: number }>();
  let totalPlanPoints = currentSecuredPoints;

  const items: RoadmapCourseItem[] = courses.map((course) => {
    const grade = assignments.get(course.id) || 'O';
    const gp = getGradePointFromLetter(grade);
    totalPlanPoints += course.credits * gp;

    const existing = countsMap.get(grade) || { count: 0, credits: 0 };
    countsMap.set(grade, {
      count: existing.count + 1,
      credits: existing.credits + course.credits,
    });

    const calc = calculateCourseResult({ ...course, isPending: false });
    const totalMax = calc.totalMax || (course.category === 'TH' ? 100 : 50);

    return {
      courseId: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      category: course.category,
      credits: course.credits,
      totalMax,
      targetGrade: grade,
      targetGradePoint: gp,
      minMarksNeeded: getMinMarksForGrade(totalMax, grade),
      eseAnalysis: calculateESENeededForCourse(course, grade),
      suggestedMarks: buildSuggestedHeadsForCourse(course, grade),
    };
  });

  // Build grade counts list in descending order of grade (O, A, B, C, D, E, P)
  const order: LetterGrade[] = ['O', 'A', 'B', 'C', 'D', 'E', 'P'];
  const gradeCounts: { grade: LetterGrade; count: number; credits: number }[] = [];
  for (const g of order) {
    const data = countsMap.get(g);
    if (data && data.count > 0) {
      gradeCounts.push({ grade: g, count: data.count, credits: data.credits });
    }
  }

  // Build simple human summary sentence
  // e.g. "You need 5 subjects with Grade O and 2 subjects with Grade A."
  const summaryParts = gradeCounts.map(
    (gc) => `${gc.count} ${gc.count === 1 ? 'subject' : 'subjects'} with Grade ${gc.grade}`
  );
  let summarySentence = '';
  if (summaryParts.length === 1) {
    summarySentence = `You need ${summaryParts[0]}.`;
  } else if (summaryParts.length === 2) {
    summarySentence = `You need ${summaryParts[0]} and ${summaryParts[1]}.`;
  } else {
    summarySentence = `You need ${summaryParts.slice(0, -1).join(', ')}, and ${summaryParts[summaryParts.length - 1]}.`;
  }

  const achievableSGPI =
    totalRegisteredCredits > 0
      ? Math.round((totalPlanPoints / totalRegisteredCredits) * 100) / 100
      : 10;

  return {
    id,
    title,
    badge,
    description,
    summarySentence,
    gradeCounts,
    achievableSGPI,
    items,
  };
}

/**
 * Applies a plan directly to courses, updating input fields with minimum target marks.
 */
export function applyRoadmapPlan(
  courses: CourseAssessment[],
  plan: RoadmapPlan
): CourseAssessment[] {
  const itemMap = new Map<string, RoadmapCourseItem>();
  for (const it of plan.items) {
    itemMap.set(it.courseId, it);
  }

  return courses.map((course) => {
    const planItem = itemMap.get(course.id);
    if (!planItem) return course;

    const updated: CourseAssessment = { ...course, isPending: false };
    const sm = planItem.suggestedMarks;

    if (updated.isDirectOverall && updated.directOverall?.enabled) {
      updated.directOverall = {
        ...updated.directOverall,
        obtained: sm.direct ?? planItem.minMarksNeeded,
      };
    } else {
      if (updated.midTest?.enabled) {
        updated.midTest = {
          ...updated.midTest,
          obtained: sm.mt ?? updated.midTest.obtained,
        };
      }
      if (updated.ca?.enabled) {
        updated.ca = {
          ...updated.ca,
          obtained: sm.ca ?? updated.ca.obtained,
        };
      }
      if (updated.ese?.enabled) {
        updated.ese = {
          ...updated.ese,
          obtained: sm.ese ?? updated.ese.obtained,
        };
      }
      if (updated.termWork?.enabled) {
        updated.termWork = {
          ...updated.termWork,
          obtained: sm.tw ?? updated.termWork.obtained,
        };
      }
      if (updated.prOral?.enabled) {
        updated.prOral = {
          ...updated.prOral,
          obtained: sm.pr ?? updated.prOral.obtained,
        };
      }
    }
    return updated;
  });
}

/**
 * Applies single course minimum target marks for a given target grade.
 */
export function applySingleCourseMinMarks(
  course: CourseAssessment,
  targetGrade: LetterGrade
): CourseAssessment {
  const sm = buildSuggestedHeadsForCourse(course, targetGrade);
  const updated: CourseAssessment = { ...course, isPending: false };

  if (updated.isDirectOverall && updated.directOverall?.enabled) {
    updated.directOverall = {
      ...updated.directOverall,
      obtained: sm.direct ?? getMinMarksForGrade(updated.directOverall.max, targetGrade),
    };
  } else {
    if (updated.midTest?.enabled) {
      updated.midTest = {
        ...updated.midTest,
        obtained: sm.mt ?? updated.midTest.obtained,
      };
    }
    if (updated.ca?.enabled) {
      updated.ca = {
        ...updated.ca,
        obtained: sm.ca ?? updated.ca.obtained,
      };
    }
    if (updated.ese?.enabled) {
      updated.ese = {
        ...updated.ese,
        obtained: sm.ese ?? updated.ese.obtained,
      };
    }
    if (updated.termWork?.enabled) {
      updated.termWork = {
        ...updated.termWork,
        obtained: sm.tw ?? updated.termWork.obtained,
      };
    }
    if (updated.prOral?.enabled) {
      updated.prOral = {
        ...updated.prOral,
        obtained: sm.pr ?? updated.prOral.obtained,
      };
    }
  }

  return updated;
}
