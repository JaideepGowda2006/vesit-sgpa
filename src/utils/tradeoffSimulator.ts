import type {
  CourseAssessment,
  CourseCalculationResult,
  LetterGrade,
} from '../types/grading';
import { calculateCourseResult, getGradeFromPercentage } from './gradingEngine';

export type AutofillStrategy = 'balanced' | 'lab_biased';

export interface UnfilledCourseSimulation {
  courseId: string;
  courseCode: string;
  courseName: string;
  category: 'TH' | 'TPO';
  credits: number;
  minPassingMarks: number;
  maxMarks: number;
  simulatedMarks: number;
  simulatedGrade: LetterGrade;
  simulatedGradePoint: number;
  simulatedCxG: number;
  // Component-level ESE calculation (if MT & CA known)
  knownInternalMarks: number;
  maxInternalMarks: number;
  hasEmptyESE: boolean;
  eseNeededForGradeO?: number;
  eseNeededForGradeA?: number;
  eseNeededForGradeB?: number;
  eseNeededForPassing?: number;
}

export interface TradeoffOtherCourseImpact {
  reqGP: number;
  isBreached: boolean;
  isSafe: boolean;
  badgeText: string;
  recommendedGrade: LetterGrade;
}

export interface TradeoffSimulationResult {
  simulations: UnfilledCourseSimulation[];
  totalSimulatedSGPI: number;
  targetSGPI: number;
  totalRegisteredCredits: number;
  securedPointsFromFilled: number;
  simulatedPointsFromUnfilled: number;
  targetPointsNeeded: number;
  currentPointsTotal: number;
  deficitFromTarget: number;
  isTargetMet: boolean;
  otherCoursesImpact: Map<string, TradeoffOtherCourseImpact>;
}

/**
 * Calculates exact ESE needed out of 60 when MT and CA are known
 */
export function calculateESENeeded(
  course: CourseAssessment,
  targetPercentage: number
): number | null {
  if (course.category !== 'TH' || !course.ese?.enabled) return null;

  const mt = course.midTest?.obtained ?? 0;
  const ca = course.ca?.obtained ?? 0;
  const internalTotal = mt + ca; // out of 40
  const maxCourse = 100;
  const minPassingESE = course.ese.min; // typically 24/60

  const totalNeeded = Math.ceil(maxCourse * (targetPercentage / 100));
  const rawESENeeded = totalNeeded - internalTotal;

  // Must at least clear the mandatory individual head minimum (24/60)
  const finalNeeded = Math.max(minPassingESE, rawESENeeded);

  if (finalNeeded > course.ese.max) {
    return null; // Mathematically impossible even with full 60/60 in ESE
  }

  return finalNeeded;
}

/**
 * Initializes simulation entries for all unfilled / pending courses
 */
export function initializeSimulationEntries(
  courses: CourseAssessment[],
  courseResults: Map<string, CourseCalculationResult>,
  defaultStrategy: AutofillStrategy = 'balanced',
  targetSGPI: number = 9.0
): UnfilledCourseSimulation[] {
  const unfilledCourses = courses.filter((c) => {
    const res = courseResults.get(c.id);
    return c.isPending || !res?.isFullyFilled;
  });

  return unfilledCourses.map((course) => {
    const calc = calculateCourseResult({ ...course, isPending: false });
    const maxMarks = calc.totalMax || (course.category === 'TH' ? 100 : 50);
    const minPassing = Math.ceil(maxMarks * 0.4);

    // Initial default marks:
    let initialRatio = 0.82; // Grade O default
    if (defaultStrategy === 'lab_biased') {
      initialRatio = course.category === 'TPO' ? 0.88 : 0.76;
    } else {
      initialRatio = targetSGPI >= 9.0 ? 0.84 : targetSGPI >= 8.0 ? 0.76 : 0.72;
    }

    const simulatedMarks = Math.round(maxMarks * initialRatio);
    const pct = (simulatedMarks / maxMarks) * 100;
    const gradeInfo = getGradeFromPercentage(pct);

    // Check if MT & CA are filled but ESE is empty
    const hasKnownInternals =
      course.category === 'TH' &&
      course.midTest?.obtained !== null &&
      course.ca?.obtained !== null &&
      course.ese?.obtained === null;

    const knownInternal = (course.midTest?.obtained ?? 0) + (course.ca?.obtained ?? 0);

    return {
      courseId: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      category: course.category,
      credits: course.credits,
      minPassingMarks: minPassing,
      maxMarks,
      simulatedMarks,
      simulatedGrade: gradeInfo.letter,
      simulatedGradePoint: gradeInfo.point,
      simulatedCxG: course.credits * gradeInfo.point,
      knownInternalMarks: knownInternal,
      maxInternalMarks: 40,
      hasEmptyESE: hasKnownInternals,
      eseNeededForGradeO: hasKnownInternals ? calculateESENeeded(course, 80) ?? undefined : undefined,
      eseNeededForGradeA: hasKnownInternals ? calculateESENeeded(course, 75) ?? undefined : undefined,
      eseNeededForGradeB: hasKnownInternals ? calculateESENeeded(course, 70) ?? undefined : undefined,
      eseNeededForPassing: hasKnownInternals ? calculateESENeeded(course, 40) ?? undefined : undefined,
    };
  });
}

/**
 * Performs real-time linked trade-off recalculation when any slider moves
 */
export function calculateTradeoffSimulation(
  simulations: UnfilledCourseSimulation[],
  courses: CourseAssessment[],
  courseResults: Map<string, CourseCalculationResult>,
  targetSGPI: number
): TradeoffSimulationResult {
  let totalRegisteredCredits = 0;
  let securedPointsFromFilled = 0;

  for (const c of courses) {
    totalRegisteredCredits += c.credits;
    const res = courseResults.get(c.id);
    if (res && res.isFullyFilled && !c.isPending) {
      securedPointsFromFilled += res.cxg;
    }
  }

  const targetPointsNeeded = totalRegisteredCredits * targetSGPI;

  let simulatedPointsFromUnfilled = 0;
  for (const sim of simulations) {
    simulatedPointsFromUnfilled += sim.simulatedCxG;
  }

  const currentPointsTotal = securedPointsFromFilled + simulatedPointsFromUnfilled;
  const totalSimulatedSGPI =
    totalRegisteredCredits > 0
      ? Math.round((currentPointsTotal / totalRegisteredCredits) * 100) / 100
      : 0;

  const deficitFromTarget = targetPointsNeeded - currentPointsTotal;
  const isTargetMet = totalSimulatedSGPI >= targetSGPI;

  // Calculate the impact of each course's current position on ALL OTHER unfilled courses
  const otherCoursesImpact = new Map<string, TradeoffOtherCourseImpact>();

  for (const sim of simulations) {
    const pointsWithoutThisCourse = currentPointsTotal - sim.simulatedCxG;
    const pointsStillNeeded = targetPointsNeeded - pointsWithoutThisCourse;
    const otherCredits = simulations
      .filter((s) => s.courseId !== sim.courseId)
      .reduce((acc, curr) => acc + curr.credits, 0);

    if (otherCredits <= 0) {
      // Only 1 unfilled course exists in the whole semester
      const neededGP = pointsStillNeeded / sim.credits;
      const isBreached = neededGP > 10.0;
      const isSafe = neededGP <= 4.0;
      otherCoursesImpact.set(sim.courseId, {
        reqGP: Math.round(neededGP * 100) / 100,
        isBreached,
        isSafe,
        badgeText: isBreached
          ? 'Target impossible on this subject alone'
          : isSafe
          ? 'Target secured: Any passing grade will clear target'
          : `Requires GP of ${neededGP.toFixed(2)} to meet target`,
        recommendedGrade: neededGP > 9.0 ? 'O' : neededGP > 8.0 ? 'A' : neededGP > 7.0 ? 'B' : 'C',
      });
      continue;
    }

    const rawReqGP = pointsStillNeeded / otherCredits;
    const reqGP = Math.round(rawReqGP * 100) / 100;
    const isBreached = reqGP > 10.0;
    const isSafe = reqGP <= 4.0;

    let recommendedGrade: LetterGrade = 'O';
    if (reqGP > 9.0) recommendedGrade = 'O';
    else if (reqGP > 8.0) recommendedGrade = 'A';
    else if (reqGP > 7.0) recommendedGrade = 'B';
    else if (reqGP > 6.0) recommendedGrade = 'C';
    else if (reqGP > 5.0) recommendedGrade = 'D';
    else if (reqGP > 4.0) recommendedGrade = 'P';
    else recommendedGrade = 'P';

    let badgeText = '';
    if (isBreached) {
      badgeText = `Target Breach: Leaves other subjects needing ${reqGP.toFixed(2)} GP (> 10.0 max)`;
    } else if (isSafe) {
      badgeText = `Leaves other subjects safe (Only need passing cutoffs ≤ 4.0 GP)`;
    } else {
      badgeText = `Leaves other subjects requiring avg ${reqGP.toFixed(2)} GP (Grade ${recommendedGrade})`;
    }

    otherCoursesImpact.set(sim.courseId, {
      reqGP,
      isBreached,
      isSafe,
      badgeText,
      recommendedGrade,
    });
  }

  return {
    simulations,
    totalSimulatedSGPI,
    targetSGPI,
    totalRegisteredCredits,
    securedPointsFromFilled,
    simulatedPointsFromUnfilled,
    targetPointsNeeded,
    currentPointsTotal,
    deficitFromTarget,
    isTargetMet,
    otherCoursesImpact,
  };
}

/**
 * Smart Autofill Generator: Fills unfilled courses according to selected strategy
 */
export function generateSmartAutofillMarks(
  courses: CourseAssessment[],
  courseResults: Map<string, CourseCalculationResult>,
  targetSGPI: number,
  strategy: AutofillStrategy = 'balanced'
): CourseAssessment[] {
  let totalRegisteredCredits = 0;
  let securedPoints = 0;
  const unfilled: CourseAssessment[] = [];

  for (const c of courses) {
    totalRegisteredCredits += c.credits;
    const res = courseResults.get(c.id);
    if (res && res.isFullyFilled && !c.isPending) {
      securedPoints += res.cxg;
    } else {
      unfilled.push(c);
    }
  }

  if (unfilled.length === 0) return courses;

  const targetPoints = totalRegisteredCredits * targetSGPI;
  const deficit = Math.max(0, targetPoints - securedPoints);
  const unfilledCredits = unfilled.reduce((sum, c) => sum + c.credits, 0);

  // Strategy Calculation:
  const marksMap = new Map<string, { ratio: number; grade: LetterGrade }>();

  if (strategy === 'lab_biased') {
    // Bias Labs to Grade O (10 GP) or Grade A (9 GP) since scoring high in Term Work/PR is much more achievable
    const labCredits = unfilled
      .filter((c) => c.category === 'TPO')
      .reduce((sum, c) => sum + c.credits, 0);
    const theoryCredits = unfilledCredits - labCredits;

    const labPoints = labCredits * 10; // Assume 10 GP on labs
    const remainingDeficit = Math.max(0, deficit - labPoints);
    const reqTheoryGP = theoryCredits > 0 ? remainingDeficit / theoryCredits : 0;

    for (const c of unfilled) {
      if (c.category === 'TPO') {
        marksMap.set(c.id, { ratio: 0.88, grade: 'O' });
      } else {
        if (reqTheoryGP > 9.0) {
          marksMap.set(c.id, { ratio: 0.85, grade: 'O' });
        } else if (reqTheoryGP > 8.0) {
          marksMap.set(c.id, { ratio: 0.78, grade: 'A' });
        } else if (reqTheoryGP > 7.0) {
          marksMap.set(c.id, { ratio: 0.72, grade: 'B' });
        } else if (reqTheoryGP > 6.0) {
          marksMap.set(c.id, { ratio: 0.64, grade: 'C' });
        } else {
          marksMap.set(c.id, { ratio: 0.55, grade: 'D' });
        }
      }
    }
  } else {
    // Balanced: Uniform distribution based on average required GP
    const avgGP = deficit / unfilledCredits;
    let ratio = 0.84;
    let grade: LetterGrade = 'O';

    if (avgGP > 9.0) {
      ratio = 0.85;
      grade = 'O';
    } else if (avgGP > 8.0) {
      ratio = 0.78;
      grade = 'A';
    } else if (avgGP > 7.0) {
      ratio = 0.72;
      grade = 'B';
    } else if (avgGP > 6.0) {
      ratio = 0.65;
      grade = 'C';
    } else if (avgGP > 5.0) {
      ratio = 0.55;
      grade = 'D';
    } else {
      ratio = 0.45;
      grade = 'E';
    }

    for (const c of unfilled) {
      marksMap.set(c.id, { ratio, grade });
    }
  }

  // Apply calculated marks to unfilled courses
  return courses.map((course) => {
    const config = marksMap.get(course.id);
    if (!config) return course;

    const ratio = config.ratio;
    const updated: CourseAssessment = { ...course, isPending: false };

    if (updated.isDirectOverall && updated.directOverall?.enabled) {
      updated.directOverall = {
        ...updated.directOverall,
        obtained: Math.round(updated.directOverall.max * ratio),
      };
    } else {
      if (updated.midTest?.enabled) {
        // Keep known mark if user already entered it!
        const existing = updated.midTest.obtained;
        updated.midTest = {
          ...updated.midTest,
          obtained: existing !== null ? existing : Math.round(updated.midTest.max * ratio),
        };
      }
      if (updated.ca?.enabled) {
        const existing = updated.ca.obtained;
        updated.ca = {
          ...updated.ca,
          obtained: existing !== null ? existing : Math.round(updated.ca.max * ratio),
        };
      }
      if (updated.ese?.enabled) {
        // If MT and CA were already known, calculate exact needed ESE!
        const mt = updated.midTest?.obtained ?? 0;
        const ca = updated.ca?.obtained ?? 0;
        const neededForPct = Math.ceil(100 * ratio) - (mt + ca);
        const finalESE = Math.min(
          updated.ese.max,
          Math.max(updated.ese.min, neededForPct)
        );
        updated.ese = {
          ...updated.ese,
          obtained: finalESE,
        };
      }
      if (updated.termWork?.enabled) {
        const existing = updated.termWork.obtained;
        updated.termWork = {
          ...updated.termWork,
          obtained: existing !== null ? existing : Math.round(updated.termWork.max * ratio),
        };
      }
      if (updated.prOral?.enabled) {
        const existing = updated.prOral.obtained;
        updated.prOral = {
          ...updated.prOral,
          obtained: existing !== null ? existing : Math.round(updated.prOral.max * ratio),
        };
      }
    }

    return updated;
  });
}
