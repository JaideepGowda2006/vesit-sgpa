import type {
  CourseAssessment,
  CourseCalculationResult,
  OverallCalculationResult,
  LetterGrade,
} from '../types/grading';
import { calculateCourseResult, calculateOverallResults } from './gradingEngine';
import {
  generateRoadmapAnalysis,
  type RoadmapPlan,
} from './roadmapPlanner';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  planAction?: RoadmapPlan;
  quickReplies?: string[];
}

/**
 * Normalizes course names and creates common acronyms/aliases
 * e.g., "Analysis of Algorithms" -> ["aoa", "algorithms", "algo"]
 */
function getCourseAliases(course: CourseAssessment): string[] {
  const aliases: string[] = [
    course.courseCode.toLowerCase(),
    course.courseName.toLowerCase(),
  ];

  const nameWords = course.courseName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => !['and', '&', 'of', 'for', 'in', 'the', 'to', 'lab', 'theory'].includes(w));

  // Generate Acronym from initial letters (e.g., Analysis of Algorithms -> aoa)
  if (nameWords.length >= 2) {
    const acronym = nameWords.map((w) => w[0]).join('');
    aliases.push(acronym);
  }

  // Common engineering short forms
  const lower = course.courseName.toLowerCase();
  if (lower.includes('algorithm')) aliases.push('aoa', 'algo', 'algorithms');
  if (lower.includes('mining') || lower.includes('business intelligence')) aliases.push('dmb', 'bi', 'mining', 'data mining');
  if (lower.includes('cloud')) aliases.push('cc', 'cloud');
  if (lower.includes('network')) aliases.push('cn', 'network', 'networks');
  if (lower.includes('operating system')) aliases.push('os');
  if (lower.includes('full stack') || lower.includes('web')) aliases.push('fsd', 'web', 'web dev');
  if (lower.includes('mini project')) aliases.push('mp', 'project');
  if (lower.includes('database') || lower.includes('dbms')) aliases.push('dbms', 'db');
  if (lower.includes('artificial') || lower.includes('intelligence')) aliases.push('ai');
  if (lower.includes('machine learning')) aliases.push('ml');
  if (lower.includes('security') || lower.includes('cyber')) aliases.push('security', 'cyber');

  return aliases;
}

/**
 * Searches for a course mentioned in user input
 */
function matchCourseInQuery(query: string, courses: CourseAssessment[]): CourseAssessment | undefined {
  const q = query.toLowerCase();

  // 1. Direct course code match
  for (const c of courses) {
    if (q.includes(c.courseCode.toLowerCase())) {
      return c;
    }
  }

  // 2. Acronym or alias match with word boundaries
  for (const c of courses) {
    const aliases = getCourseAliases(c);
    for (const alias of aliases) {
      if (alias.length >= 2) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(q)) {
          return c;
        }
      }
    }
  }

  // 3. Substring match on course name words
  for (const c of courses) {
    const words = c.courseName.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    for (const word of words) {
      if (q.includes(word)) {
        return c;
      }
    }
  }

  return undefined;
}

/**
 * Extracts a target numeric value from query (e.g. "hit 9.5" -> 9.5, "score 40" -> 40)
 */
function extractNumberFromQuery(query: string): number | null {
  // Look for decimals like 9.25 or 9.5
  const decimalMatch = query.match(/\b([4-9]\.\d{1,2}|10(\.0{1,2})?)\b/);
  if (decimalMatch) {
    return parseFloat(decimalMatch[1]);
  }

  // Look for marks like 40, 25, 55, 60
  const marksMatch = query.match(/\b(\d{1,3})\b/);
  if (marksMatch) {
    return parseInt(marksMatch[1], 10);
  }

  return null;
}

/**
 * Main GradeBot Response Generator - runs 100% locally in browser memory
 */
export function processGradeBotQuery(
  rawQuery: string,
  courses: CourseAssessment[],
  courseResults: Map<string, CourseCalculationResult>,
  targetSGPI: number,
  overall: OverallCalculationResult
): {
  text: string;
  planAction?: RoadmapPlan;
  quickReplies?: string[];
} {
  const query = rawQuery.trim().toLowerCase();
  const analysis = generateRoadmapAnalysis(courses, courseResults, targetSGPI);
  const matchedCourse = matchCourseInQuery(query, courses);

  // Intent 1: "What-If" score simulation for a specific course or End Sem
  const isWhatIf =
    query.includes('what if') ||
    query.includes('suppose') ||
    query.includes('if i get') ||
    query.includes('if i score') ||
    query.includes('what happens if');

  if (isWhatIf) {
    const proposedNumber = extractNumberFromQuery(query);

    if (matchedCourse && proposedNumber !== null) {
      return handleCourseWhatIfSimulation(
        matchedCourse,
        proposedNumber,
        query,
        courses,
        courseResults,
        targetSGPI
      );
    }

    if (query.includes('low') || query.includes('ese') || query.includes('end sem')) {
      return handleLowEndSemAdvice();
    }
  }

  // Intent 2: Head Failure, Passing criteria & Cutoffs
  if (
    query.includes('pass') ||
    query.includes('cutoff') ||
    query.includes('minimum') ||
    query.includes('kt') ||
    query.includes('failed head') ||
    query.includes('f grade')
  ) {
    return {
      text: `### 📋 Autonomous Passing & Minimum Cutoff Rules

In the autonomous Mumbai University evaluation scheme, **each exam head must be cleared independently**:

* **Theory Courses (Total 100 Marks)**:
  * **Mid Test (IA)**: Min **8 / 20** marks
  * **Continuous Assessment (CA)**: Min **8 / 20** marks
  * **End Sem Exam (ESE)**: Min **24 / 60** marks *(or 40/100 for Open Electives)*
  * **Total Passing**: Min **40% (40/100)** for Grade P.

* **Labs & Term Work (Total 50 Marks)**:
  * **Term Work (TW)**: Min **10 / 25** marks *(or 20/50 for standalone labs)*
  * **Practical & Oral (PR/OR)**: Min **10 / 25** marks
  * **Total Passing**: Min **40% (20/50)** for Grade P.

> ⚠️ **The Mandatory Cutoff Rule**: Even if your internal marks are 20/20, scoring **< 24 in End Sem Theory** or **< 10 in Term Work/Oral** triggers an **immediate Failed Head (Grade F / 0 GP)**!`,
      quickReplies: [
        'How do I hit my target SGPA?',
        'Can I still get 9.0+ SGPA?',
        'Which unfilled subjects give the easiest boost?',
      ],
    };
  }

  // Intent 3: Highest Possible SGPA & Reachability
  if (
    query.includes('max') ||
    query.includes('highest') ||
    query.includes('ceiling') ||
    query.includes('can i still get') ||
    query.includes('is it possible')
  ) {
    const specifiedTarget = extractNumberFromQuery(query);
    const targetToCheck = specifiedTarget && specifiedTarget <= 10.0 && specifiedTarget >= 4.0 ? specifiedTarget : targetSGPI;

    if (analysis.maxPossibleSGPI < targetToCheck) {
      return {
        text: `### ⚠️ Target Analysis: ${targetToCheck.toFixed(2)} SGPA

* **Current Secured SGPA**: **${overall.currentSGPI > 0 ? overall.currentSGPI.toFixed(2) : '--'}**
* **Theoretical Maximum Ceiling**: **${analysis.maxPossibleSGPI.toFixed(2)}** (assuming Grade O / 10 GP in every single pending course).

With your currently recorded marks, **${targetToCheck.toFixed(2)} is mathematically unreachable** because the highest achievable score is **${analysis.maxPossibleSGPI.toFixed(2)}**.

💡 **Recommendation**: Adjust your target to **${analysis.maxPossibleSGPI.toFixed(2)}** or below to plan realistic marks.`,
        quickReplies: [
          `How do I hit ${analysis.maxPossibleSGPI.toFixed(2)}?`,
          'How do I hit my target SGPA?',
          'Which unfilled subjects give the easiest boost?',
        ],
      };
    }

    const deficit = Math.max(0, analysis.deficitPoints);
    return {
      text: `### 🎯 Target SGPA Feasibility: ${targetToCheck.toFixed(2)}

* **Status**: **Fully Achievable!** ✅
* **Maximum Possible Ceiling**: **${analysis.maxPossibleSGPI.toFixed(2)}**
* **Remaining Unfilled Credits**: **${analysis.unfilledCredits} Credits**
* **Points Needed**: You need approximately **${deficit.toFixed(0)} Grade Points** from remaining subjects to secure your target.

Click below to see the exact marks breakdown to hit this goal!`,
      quickReplies: [
        'How do I hit my target SGPA?',
        'What if I score low in End Sem?',
        'Which unfilled subjects give the easiest boost?',
      ],
    };
  }

  // Intent 4: Easiest Boost & Strategy
  if (
    query.includes('boost') ||
    query.includes('easy') ||
    query.includes('focus') ||
    query.includes('where should i') ||
    query.includes('tips')
  ) {
    const labCount = courses.filter((c) => c.category === 'TPO' && (c.isPending || !courseResults.get(c.id)?.isFullyFilled)).length;
    const theoryCount = courses.filter((c) => c.category === 'TH' && (c.isPending || !courseResults.get(c.id)?.isFullyFilled)).length;

    return {
      text: `### 🚀 Smart Strategy: Where to Get the Easiest Boost

1. **Bank 10 GP in All Labs (${labCount} pending)**:
   * Term Work and Oral exams are internally assessed. Scoring **≥ 21/25** in TW and PR guarantees **Grade O (10 GP)**.
   * High lab scores take massive pressure off theory subjects!

2. **Capitalize on Mid Test & CA**:
   * Scoring **18+/20** in internal assessments drops the needed End Sem score from **48/60** down to **38/60** for Grade O!

3. **High-Credit Theory Courses (${theoryCount} pending)**:
   * Theory subjects carry **3 or 4 Credits** each. Bumping a 3-credit course from Grade B (8) to Grade O (10) adds **+6 grade points** straight to your semester total.`,
      quickReplies: [
        'How do I hit my target SGPA?',
        'What if I score low in End Sem?',
        'Can I still get 9.0+ SGPA?',
      ],
    };
  }

  // Intent 5: Target Strategy & Autofill Roadmap
  if (
    query.includes('target') ||
    query.includes('strategy') ||
    query.includes('plan') ||
    query.includes('marks do i need') ||
    query.includes('how do i') ||
    query.includes('how to') ||
    query.includes('autofill')
  ) {
    const plan = analysis.plans.find((p) => p.id === 'realistic') || analysis.plans[0];

    if (!plan || analysis.status === 'unreachable') {
      return {
        text: `### ⚠️ Target Unreachable

Your target of **${targetSGPI.toFixed(2)} SGPA** requires more points than mathematically possible with the remaining **${analysis.unfilledCredits} credits**.

* **Maximum Possible SGPA**: **${analysis.maxPossibleSGPI.toFixed(2)}**
* **Currently Secured**: **${overall.currentSGPI > 0 ? overall.currentSGPI.toFixed(2) : '0.00'}**

Try adjusting your target SGPA in the top bar to **${analysis.maxPossibleSGPI.toFixed(2)}** or below!`,
        quickReplies: [
          'Can I still get 9.0+ SGPA?',
          'What if I score low in End Sem?',
          'Which unfilled subjects give the easiest boost?',
        ],
      };
    }

    if (analysis.status === 'secured') {
      return {
        text: `### 🎉 Target Already Secured!

You have already secured enough credits and grade points. To guarantee **≥ ${targetSGPI.toFixed(2)} SGPA**, you only need to clear the minimum passing thresholds (**Grade P / 40%**) in all remaining courses!`,
        quickReplies: [
          'Can I still get 9.0+ SGPA?',
          'What if I score low in End Sem?',
          'Which unfilled subjects give the easiest boost?',
        ],
      };
    }

    // Concrete items breakdown
    const bullets = plan.items
      .map((it) => {
        const eseInfo = it.eseAnalysis ? ` • *Need ≥ ${it.eseAnalysis.neededForGrade}/${it.eseAnalysis.eseMax} in End Sem*` : '';
        return `* **${it.courseName}** (${it.category === 'TH' ? 'Theory' : 'Lab'} • ${it.credits} Cr): Aim **Grade ${it.targetGrade}** (≥ ${it.minMarksNeeded}/${it.totalMax})${eseInfo}`;
      })
      .join('\n');

    return {
      text: `### 🎯 Target Blueprint for ${targetSGPI.toFixed(2)} SGPA

**Summary**: ${plan.summarySentence}
**Projected SGPA**: **${plan.achievableSGPI.toFixed(2)} / 10.00**

${bullets}

Click below to apply these exact minimum marks into your workspace:`,
      planAction: plan,
      quickReplies: [
        'What if I score low in End Sem?',
        'Which unfilled subjects give the easiest boost?',
        'Can I still get 9.0+ SGPA?',
      ],
    };
  }

  // Intent 6: General Current Status & Progress
  if (query.includes('status') || query.includes('progress') || query.includes('how am i')) {
    return {
      text: `### 📊 Live Academic Overview

* **Current Estimated SGPA**: **${overall.currentSGPI > 0 ? overall.currentSGPI.toFixed(2) : '--'} / 10.00**
* **Target SGPA Goal**: **${targetSGPI.toFixed(2)}**
* **Maximum Possible Ceiling**: **${analysis.maxPossibleSGPI.toFixed(2)}**
* **Unfilled Credits**: **${analysis.unfilledCredits} Credits** (${analysis.unfilledCount} subjects pending)
* **Status**: ${
        overall.hasAnyFailedCourse
          ? '⚠️ You have at least one course below the passing threshold.'
          : overall.currentSGPI >= targetSGPI && overall.currentSGPI > 0
          ? '🌟 Target achieved!'
          : 'In progress.'
      }`,
      quickReplies: [
        'How do I hit my target SGPA?',
        'What if I score low in End Sem?',
        'Which unfilled subjects give the easiest boost?',
      ],
    };
  }

  // Fallback: Helpful Guide
  return {
    text: `👋 **Hi! I'm GradeBot, your local academic advisor.**

I analyze your live marks sheet directly in your browser. Ask me anything about your grades:

* *"How do I hit my target SGPA?"*
* *"What if I get 40 in ${courses[0]?.courseName || 'AoA'}?"*
* *"What if I score low in End Sem?"*
* *"What are the passing cutoffs for Theory and Labs?"*
* *"Can I still get 9.0+ SGPA?"*
* *"Which unfilled subjects give the easiest boost?"*`,
    quickReplies: [
      'How do I hit my target SGPA?',
      'What if I score low in End Sem?',
      'Which unfilled subjects give the easiest boost?',
      'Can I still get 9.0+ SGPA?',
    ],
  };
}

/**
 * Handles course-specific "What-If" score simulations
 */
function handleCourseWhatIfSimulation(
  course: CourseAssessment,
  proposedScore: number,
  query: string,
  courses: CourseAssessment[],
  courseResults: Map<string, CourseCalculationResult>,
  targetSGPI: number
): {
  text: string;
  quickReplies?: string[];
} {
  const isTheory = course.category === 'TH';
  const calc = calculateCourseResult({ ...course, isPending: false });
  const totalMax = calc.totalMax || (isTheory ? 100 : 50);

  // Check if query was specifically asking about ESE (out of 60)
  const isEseSpecific = query.includes('ese') || query.includes('end sem');

  if (isEseSpecific && isTheory) {
    const eseMin = course.ese?.min || 24;
    const eseMax = course.ese?.max || 60;
    const clampedEse = Math.min(eseMax, Math.max(0, proposedScore));

    if (clampedEse < eseMin) {
      return {
        text: `### ⚠️ Warning: Mandatory Cutoff Breach!

If you score **${clampedEse}/${eseMax} in End Sem for ${course.courseName}**:
* **Passing Minimum**: Min **${eseMin}/${eseMax}** is strictly mandatory.
* **Result**: **Failed Head (Grade F / 0 Grade Points)**. Even if your Mid Test and CA are 20/20, scoring below 24 in ESE results in an immediate **KT (Fail)**!`,
        quickReplies: [
          `What if I get 24 in ${course.courseCode}?`,
          'What are the passing marks?',
          'How do I hit my target SGPA?',
        ],
      };
    }

    const currentMt = course.midTest?.obtained ?? 16;
    const currentCa = course.ca?.obtained ?? 16;
    const simulatedTotal = currentMt + currentCa + clampedEse;
    const simulatedPct = (simulatedTotal / totalMax) * 100;
    const grade = getGradeLetter(simulatedPct);
    const gp = getGradePoint(grade);

    // Simulate new overall SGPA with this score
    const simulatedCourse: CourseAssessment = {
      ...course,
      isPending: false,
      midTest: { ...course.midTest, obtained: currentMt },
      ca: { ...course.ca, obtained: currentCa },
      ese: { ...course.ese, obtained: clampedEse },
    };

    const simResults = new Map(courseResults);
    simResults.set(course.id, calculateCourseResult(simulatedCourse));
    const simOverall = calculateOverallResults(courses, simResults);

    return {
      text: `### 🧪 What-If Simulation: ${course.courseName} ESE = ${clampedEse}/${eseMax}

* **Internal Assessment**: MT (${currentMt}/20) + CA (${currentCa}/20) = ${currentMt + currentCa}/40
* **Simulated End Sem**: **${clampedEse}/${eseMax}** (Passed ✅)
* **Total Marks**: **${simulatedTotal}/${totalMax}** (${simulatedPct.toFixed(1)}%)
* **Resulting Course Grade**: **Grade ${grade} (${gp} GP)**
* **Estimated Semester SGPA**: **${simOverall.currentSGPI.toFixed(2)} / 10.00**

${
  simOverall.currentSGPI < targetSGPI
    ? `💡 To still reach your target of **${targetSGPI.toFixed(2)}**, your other remaining courses will need to score slightly higher to compensate.`
    : `🎉 Great! This keeps you comfortably on track for your target of **${targetSGPI.toFixed(2)} SGPA**.`
}`,
      quickReplies: [
        'How do I hit my target SGPA?',
        'Can I still get 9.0+ SGPA?',
        'Which unfilled subjects give the easiest boost?',
      ],
    };
  }

  // Course total simulation
  const clampedTotal = Math.min(totalMax, Math.max(0, proposedScore));
  const minPass = Math.ceil(totalMax * 0.4);

  if (clampedTotal < minPass) {
    return {
      text: `### ⚠️ What-If: Scoring ${clampedTotal}/${totalMax} in ${course.courseName}

Scoring **${clampedTotal}/${totalMax} (< 40%)** is below the overall passing threshold of **${minPass} marks**. This results in **Grade F (0 GP / KT)** for this subject!`,
      quickReplies: [
        `What if I get ${minPass} in ${course.courseCode}?`,
        'What are the passing marks?',
        'How do I hit my target SGPA?',
      ],
    };
  }

  const pct = (clampedTotal / totalMax) * 100;
  const grade = getGradeLetter(pct);
  const gp = getGradePoint(grade);

  return {
    text: `### 🧪 What-If Simulation: ${course.courseName} = ${clampedTotal}/${totalMax}

* **Total Marks**: **${clampedTotal}/${totalMax}** (${pct.toFixed(1)}%)
* **Resulting Course Grade**: **Grade ${grade} (${gp} Grade Points)**
* **Credits**: **${course.credits} Credits** → Yields **${course.credits * gp} Points**

${
  gp >= 9
    ? `🌟 Excellent score! Grade ${grade} boosts your GPA significantly.`
    : `💡 Grade ${grade} gives you solid passing points. To hit your target of **${targetSGPI.toFixed(2)}**, make sure to aim for Grade O in your practicals and labs!`
}`,
    quickReplies: [
      'How do I hit my target SGPA?',
      'Can I still get 9.0+ SGPA?',
      'Which unfilled subjects give the easiest boost?',
    ],
  };
}

/**
 * Advice on scoring low in End Sem exams
 */
function handleLowEndSemAdvice(): {
  text: string;
  quickReplies?: string[];
} {
  return {
    text: `### 🛡️ What Happens If You Score Low in End Sem?

1. **The Absolute Safe Floor**:
   * You **MUST score at least 24 / 60** in Theory End Sem exams.
   * Scoring even 23/60 causes an automatic **Failed Head (Grade F / KT)** regardless of internal scores.

2. **Impact on Grade**:
   * If you score **24–30 / 60** with good internals (34/40): Total = 58–64/100 (**Grade D or C, 6–7 GP**).
   * If you score **31–44 / 60** with good internals (34/40): Total = 65–78/100 (**Grade B or A, 8–9 GP**).

3. **How to Protect Your Target SGPA**:
   * Make sure you get **Grade O (10 GP)** in all your practicals/term work (easy 21–25/25).
   * This balances out any lower theory scores and keeps your SGPA comfortably around **8.50 – 9.20**!`,
    quickReplies: [
      'How do I hit my target SGPA?',
      'Which unfilled subjects give the easiest boost?',
      'What are the passing marks?',
    ],
  };
}

function getGradeLetter(pct: number): LetterGrade {
  if (pct >= 80) return 'O';
  if (pct >= 75) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 45) return 'E';
  if (pct >= 40) return 'P';
  return 'F';
}

function getGradePoint(grade: LetterGrade): number {
  switch (grade) {
    case 'O': return 10;
    case 'A': return 9;
    case 'B': return 8;
    case 'C': return 7;
    case 'D': return 6;
    case 'E': return 5;
    case 'P': return 4;
    default: return 0;
  }
}
