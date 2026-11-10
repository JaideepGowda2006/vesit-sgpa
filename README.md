# VESIT Autonomous SGPA Calculator, Reverse Target Planner & Scheme Parser

A production-ready, client-side React web application designed for students of **Vivekanand Education Society's Institute of Technology (VESIT)** and **University of Mumbai (MU Autonomous R-2025 / NEP Batch 2 Scheme)**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)

---

## ✨ Features

### 1. Isolated Semester Workspaces (Client-Side Privacy)
- **Top-Level Semester Selector**:
  - **Semester IV (Autonomous R-2025 IT)**: 11 separate rows (Theory & Labs split), 24 total credits, pre-populated with authentic VESIT Grade Card marks (SGPI: 9.58, 644/775 marks).
  - **Semester V (NEP Batch 2024–28 IT)**: 10 separate rows (5 Theory + 4 Labs + 1 MOOC), 22 total credits, 775 total marks.
  - **Custom / Upload from Screenshot**: Private workspace for user-defined schemes.
- **LocalStorage Isolation**:
  - Uses namespaced storage keys (`vesit_sgpa_sem4`, `vesit_sgpa_sem5`, `vesit_sgpa_custom`).
  - All edits (marks, credit weights, target SGPA) automatically persist in the browser with zero backend requirements.
- **Portability**:
  - Export workspace as JSON (`.json` file download).
  - Import JSON backup with validation and instant workspace loading.
  - Reset to university defaults with one click.

### 2. Multi-Document OCR & Cross-Referencing Extraction
- Drag-and-drop or upload multiple scheme screenshots for the same semester (e.g., *Examination Scheme* + *Teaching Scheme*).
- **Strict Theory & Lab Separation Rule**:
  - **Theory Row (`TH`)**: 3 Credits, 100 Marks (Mid Test 20, CA 20, End Sem Exam 60).
  - **Lab Row (`TPO`)**: 1 Credit, 50 Marks (Term Work 25, Practical/Oral 25).
  - **Standalone Lab (`TPO` - Full Stack Development)**: 2 Credits, 75 Marks (Term Work 50, Practical/Oral 25).
  - **MOOC / Self-study (`TH` - Open Elective NPTEL)**: 4 Credits, 100 Marks (ESE 100).
- Inline click-to-edit for any Course Code, Course Name, Credits, or Component Head marks.

### 3. Autonomous University Grading Engine
- **Minimum Passing Head Cutoffs**:
  - Theory ESE: $\ge 24 / 60$ (or $\ge 40 / 100$)
  - Theory IA: $\ge 8 / 20$ (Mid Test), $\ge 8 / 20$ (Continuous Assessment)
  - Term Work / Practicals: $\ge 10 / 25$ (or $\ge 20 / 50$)
- **Head of Failure (`F*`) Isolation**:
  - If any mandatory head falls below the cutoff, only that row is flagged with `Failed Head` (Grade F, GP = 0, Earned Credits = 0).
  - The corresponding Lab or Theory row remains completely unaffected and retains its earned credits and grade points.
- **Official Letter Grade Scale**:
  - $\ge 80.00\%$ $\rightarrow$ **Grade O** (GP: 10)
  - $75.00\% - 79.99\%$ $\rightarrow$ **Grade A** (GP: 9)
  - $70.00\% - 74.99\%$ $\rightarrow$ **Grade B** (GP: 8)
  - $60.00\% - 69.99\%$ $\rightarrow$ **Grade C** (GP: 7)
  - $50.00\% - 59.99\%$ $\rightarrow$ **Grade D** (GP: 6)
  - $45.00\% - 49.99\%$ $\rightarrow$ **Grade E** (GP: 5)
  - $40.00\% - 44.99\%$ $\rightarrow$ **Grade P** (GP: 4)
  - $< 40.00\%$ $\rightarrow$ **Grade F** (GP: 0)

### 4. Dynamic Reverse Target SGPA Solver
- Real-time deficit and required average grade point calculation:
  $$\text{Points Deficit} = (\text{Target SGPA} \times \text{Total Credits}) - \text{Earned Points}$$
  $$\text{Required Average GP} = \frac{\text{Deficit}}{\text{Remaining Unfilled Credits}}$$
- Uncompleted row badges show exact target thresholds:
  - **Achievable**: `Aim Grade A [9]` with exact marks needed (`≥ 75/100` for theory, `≥ 38/50` for lab).
  - **Target Safe**: `Target Safe (Just clear passing cutoffs)` when required GP $\le 4.0$.
  - **Unattainable**: `Unattainable (Requires > 10.0 GP)` when mathematically impossible.
- **Auto-Solve Target Marks**: Automatically distributes the exact balanced marks needed to reach the target SGPA, triggering celebration confetti when achieved!

### 5. High-Fidelity Mock Grade Card (Print / PDF)
- Modeled after the authentic VESIT Grade Card with student details, TH/TPO split, marks obtained, credits earned, grade points, and signature blocks.
- Optimized for printing and saving as PDF via `@media print`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/JaideepGowda2006/vesit-sgpa.git

# Navigate into the folder
cd vesit-sgpa

# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 📂 Project Structure

```
src/
├── types/
│   └── grading.ts          # Type definitions for courses, schemes, calculations
├── data/
│   └── sampleSchemes.ts    # Authentic Sem IV & Sem V schemes
├── utils/
│   ├── gradingEngine.ts    # Head-of-failure rules, grade mapping, SGPI calculation
│   ├── targetPlanner.ts    # Reverse Target SGPA solver & aim guidance
│   ├── documentMatcher.ts  # Multi-document OCR cross-referencing engine
│   └── storageManager.ts   # Namespaced localStorage isolation & JSON import/export
├── components/
│   ├── Header.tsx               # Brand banner, semester selector, import/export controls
│   ├── DocumentUploadSection.tsx# OCR upload zone, scanner log console
│   ├── TargetPlannerKPI.tsx     # Target solver slider, status banner, 4 KPI cards
│   ├── CoursesTable.tsx         # Responsive interactive assessment table
│   ├── CourseRowEditModal.tsx   # Add/Edit row modal with TH/TPO category toggle
│   ├── HowItWorksDrawer.tsx     # Slide-over university rules guide
│   ├── PrintReportModal.tsx     # Printable authentic VESIT Grade Card
│   └── ImportExportModal.tsx    # JSON workspace backup modal
├── App.tsx
├── index.css
└── main.tsx
```

---

## 📜 License
MIT License. Built for students and faculty of VESIT & Mumbai University.
