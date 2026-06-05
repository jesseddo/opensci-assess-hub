import { unit81 } from "@/lib/ingested/unit-8.1";
import type { AssessmentSource } from "@/lib/assessment-source";
import type {
  AssessmentOpportunityType,
  LibraryOutputKind,
} from "@/lib/assessment-opportunity-types";
import type { AssessmentTypeSlug } from "@/lib/assessment-types";
import { assessmentTypeLabel, normalizeAssessmentType } from "@/lib/assessment-types";

export type PackageItemKind =
  | "student-handout"
  | "google-form"
  | "teacher-guide"
  | "answer-key"
  | "rubric"
  | "guidance-sheet";

export interface PackageItem {
  kind: PackageItemKind;
  label: string;
  fileName?: string;
  url?: string;
  available: boolean;
  unavailableReason?: string;
}

export interface Assessment {
  id: string;
  lesson: string;
  lessonTitle?: string;
  title: string;
  /** Controlled vocabulary slug — prefer this over raw typeLabel */
  assessmentType?: AssessmentTypeSlug;
  typeLabel: string;
  standards: string[];
  isSummative?: boolean;
  description: string;
  previewExcerpt?: string;
  /** Assessment opportunity (TE) vs standalone assessment document */
  source?: AssessmentSource;
  /** Internal ingest classifier only — not shown in UI */
  opportunityType?: AssessmentOpportunityType;
  /** What Eddo can ship for this row */
  libraryOutput?: LibraryOutputKind;
  /** Display title (table); same as title when ingested */
  shortTitle?: string;
  /** PE element code — detail / guidance only */
  peCode?: string;
  buildingTowards?: string;
  lookListenFor?: string;
  whatToDo?: string;
  package: PackageItem[];
}

export interface UnitLesson {
  lessonNum: number;
  /** Short scannable title for the unit table */
  shortTitle?: string;
  /** Full driving question from Teacher Edition */
  title: string;
  teacherEditionPath?: string | null;
  /** Suggested instructional days from Unit Overview Materials (OSE pacing, not a schedule) */
  expectedDays?: number;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessonCount?: number;
  /** Sum of suggested lesson days from Unit Overview Materials, when ingested */
  suggestedPacingDays?: number;
  lessons?: UnitLesson[];
  assessments: Assessment[];
}

export interface GradeLevel {
  id: string;
  label: string;
  group: "elementary" | "middle" | "high";
  units: Unit[];
}

type LegacyResources = ("doc" | "form" | "key")[];

interface AssessmentExtras {
  description?: string;
  previewExcerpt?: string;
  lessonTitle?: string;
  includeRubric?: boolean;
  includeGuide?: boolean;
}

function mockUrl(id: string, kind: PackageItemKind): string {
  return `https://docs.google.com/document/d/mock-${id}-${kind}/view`;
}

function buildPackage(
  id: string,
  resources: LegacyResources,
  opts: { rubric?: boolean; guide?: boolean } = {},
): PackageItem[] {
  const hasDoc = resources.includes("doc");
  const hasForm = resources.includes("form");
  const hasKey = resources.includes("key");
  const hasGuide = opts.guide !== false;
  const hasRubric = opts.rubric === true;

  return [
    {
      kind: "student-handout",
      label: "Student handout",
      fileName: `${id}-handout.doc`,
      url: mockUrl(id, "student-handout"),
      available: hasDoc,
      unavailableReason: "Not in library",
    },
    {
      kind: "google-form",
      label: "Google Form",
      fileName: `${id}-form`,
      url: mockUrl(id, "google-form"),
      available: hasForm,
      unavailableReason: "Not yet digitized",
    },
    {
      kind: "teacher-guide",
      label: "Teacher guide",
      fileName: `${id}-guide.doc`,
      url: mockUrl(id, "teacher-guide"),
      available: hasGuide && hasDoc,
      unavailableReason: "Not in library",
    },
    {
      kind: "answer-key",
      label: "Answer key (recommended)",
      fileName: `${id}-key.doc`,
      url: mockUrl(id, "answer-key"),
      available: hasKey,
      unavailableReason: "Not in library",
    },
    {
      kind: "rubric",
      label: "Rubric (recommended)",
      fileName: `${id}-rubric.doc`,
      url: mockUrl(id, "rubric"),
      available: hasRubric,
      unavailableReason: "Not applicable",
    },
  ];
}

function a(
  id: string,
  lesson: string,
  title: string,
  typeLabel: string,
  standards: string[],
  resources: LegacyResources = ["doc", "form", "key"],
  isSummative = false,
  extras: AssessmentExtras = {},
): Assessment {
  const includeRubric = extras.includeRubric ?? isSummative;
  const assessmentType = normalizeAssessmentType(typeLabel);
  return {
    id,
    lesson,
    lessonTitle: extras.lessonTitle,
    title,
    assessmentType,
    typeLabel: assessmentTypeLabel(assessmentType),
    standards,
    isSummative,
    description:
      extras.description ?? `OpenSciEd-recommended ${typeLabel.toLowerCase()} for ${lesson}.`,
    previewExcerpt: extras.previewExcerpt,
    package: buildPackage(id, resources, {
      rubric: includeRubric,
      guide: extras.includeGuide,
    }),
  };
}

const u = (
  id: string,
  title: string,
  description: string,
  assessments: Assessment[],
  lessonCount = 8,
): Unit => ({ id, title, description, lessonCount, assessments });

export function lessonNumber(label: string): number | null {
  const m = label.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

export const MOCK_WORKSPACES = [
  { id: "period-3", label: "8th Grade — Period 3" },
  { id: "plc-shared", label: "Science PLC — Shared" },
  { id: "period-5", label: "8th Grade — Period 5" },
] as const;

export const gradeLevels: GradeLevel[] = [
  {
    id: "k",
    label: "Kindergarten",
    group: "elementary",
    units: [
      u("K.1", "Weather & Sky", "Observe daily and seasonal weather patterns.", [
        a("k1-1", "Lesson 03", "Sunny vs. Cloudy Sort", "Formative Check", ["K-ESS2-1"]),
        a(
          "k1-2",
          "Final",
          "Weather Journal Review",
          "Summative",
          ["K-ESS2-1", "K-ESS3-2"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("K.2", "Pushes & Pulls", "Investigate how forces change motion.", [
        a("k2-1", "Lesson 02", "Ramp Investigation Check", "Formative", ["K-PS2-1"]),
        a(
          "k2-2",
          "Lesson 05",
          "Designing a Pull Toy",
          "Performance Task",
          ["K-PS2-2"],
          ["doc", "key"],
          false,
          {
            includeRubric: true,
          },
        ),
      ]),
      u("K.3", "Living Things", "Compare needs of plants and animals.", [
        a("k3-1", "Lesson 04", "What Living Things Need", "Formative", ["K-LS1-1"]),
      ]),
      u("K.4", "Our Earth", "Care for the world around us.", [
        a(
          "k4-1",
          "Final",
          "Caring for Earth Project",
          "Summative",
          ["K-ESS3-3"],
          ["doc", "key"],
          true,
        ),
      ]),
    ],
  },
  {
    id: "grade-1",
    label: "Grade 1",
    group: "elementary",
    units: [
      u("1.1", "Light & Sound", "How light and sound travel.", [
        a("11-1", "Lesson 04", "Sound Vibration Check", "Formative", ["1-PS4-1"]),
        a(
          "11-2",
          "Final",
          "Communicating with Light",
          "Summative",
          ["1-PS4-4"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("1.2", "Sky Patterns", "Day, night, and seasonal changes.", [
        a("12-1", "Lesson 03", "Sun Path Sketch", "Formative", ["1-ESS1-1"]),
      ]),
      u("1.3", "Plants & Animals", "Structures that help survival.", [
        a(
          "13-1",
          "Lesson 06",
          "Mimicking Nature",
          "Performance Task",
          ["1-LS1-1"],
          ["doc", "key"],
          false,
          {
            includeRubric: true,
          },
        ),
      ]),
      u("1.4", "Inheritance", "How offspring resemble parents.", [
        a("14-1", "Final", "Parent & Offspring Match", "Summative", ["1-LS3-1"], ["doc"], true),
      ]),
    ],
  },
  {
    id: "grade-2",
    label: "Grade 2",
    group: "elementary",
    units: [
      u("2.1", "Properties of Matter", "Classify materials by their properties.", [
        a("21-1", "Lesson 03", "Material Sort Check", "Formative", ["2-PS1-1"]),
        a(
          "21-2",
          "Final",
          "Designing with Materials",
          "Performance Task",
          ["2-PS1-2"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("2.2", "Changing Landforms", "How wind and water shape land.", [
        a("22-1", "Lesson 05", "Erosion Model Reflection", "Formative", ["2-ESS2-1"]),
      ]),
      u("2.3", "Ecosystems", "Plants, animals, and habitats.", [
        a("23-1", "Lesson 04", "Habitat Match-Up", "Formative", ["2-LS4-1"]),
      ]),
      u("2.4", "Water on Earth", "Where water is found and how it moves.", [
        a(
          "24-1",
          "Final",
          "Mapping Water Sources",
          "Summative",
          ["2-ESS2-3"],
          ["doc", "key"],
          true,
        ),
      ]),
    ],
  },
  {
    id: "grade-3",
    label: "Grade 3",
    group: "elementary",
    units: [
      u("3.1", "Forces & Interactions", "Balanced and unbalanced forces.", [
        a("31-1", "Lesson 04", "Magnet Investigation Check", "Formative", ["3-PS2-3"]),
        a(
          "31-2",
          "Final",
          "Designing a Force Solution",
          "Summative",
          ["3-PS2-1", "3-PS2-2"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("3.2", "Life Cycles", "Patterns in plant and animal life cycles.", [
        a("32-1", "Lesson 06", "Life Cycle Sequencing", "Formative", ["3-LS1-1"]),
      ]),
      u("3.3", "Weather & Climate", "Weather patterns and climate regions.", [
        a("33-1", "Lesson 05", "Weather Data Analysis", "Formative", ["3-ESS2-1"]),
        a(
          "33-2",
          "Final",
          "Severe Weather Solution",
          "Performance Task",
          ["3-ESS3-1"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("3.4", "Inheritance & Variation", "Traits and environmental influence.", [
        a("34-1", "Lesson 04", "Trait Variation Check", "Formative", ["3-LS3-1"]),
      ]),
    ],
  },
  {
    id: "grade-4",
    label: "Grade 4",
    group: "elementary",
    units: [
      u("4.1", "Energy Transfer", "Energy in collisions and circuits.", [
        a("41-1", "Lesson 05", "Energy Transfer Diagram", "Formative", ["4-PS3-2"]),
        a(
          "41-2",
          "Final",
          "Energy Conversion Device",
          "Performance Task",
          ["4-PS3-4"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("4.2", "Waves & Information", "Wave properties and signal transfer.", [
        a("42-1", "Lesson 04", "Wave Amplitude Check", "Formative", ["4-PS4-1"]),
      ]),
      u("4.3", "Earth's Features", "Rocks, fossils, and landform change.", [
        a("43-1", "Lesson 06", "Reading Rock Layers", "Formative", ["4-ESS1-1"]),
      ]),
      u("4.4", "Plant & Animal Structures", "Internal and external structures.", [
        a(
          "44-1",
          "Final",
          "Structure & Function Model",
          "Summative",
          ["4-LS1-1"],
          ["doc", "key"],
          true,
        ),
      ]),
    ],
  },
  {
    id: "grade-5",
    label: "Grade 5",
    group: "elementary",
    units: [
      u("5.1", "Matter & Its Interactions", "Conservation of matter.", [
        a("51-1", "Lesson 04", "Mass Before/After Check", "Formative", ["5-PS1-2"]),
        a(
          "51-2",
          "Final",
          "Mystery Substance Lab",
          "Performance Task",
          ["5-PS1-3"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("5.2", "Ecosystems", "Energy and matter in food webs.", [
        a("52-1", "Lesson 03", "Food Web Modeling", "Formative", ["5-LS2-1"]),
        a("52-2", "Lesson 07", "Decomposer Challenge", "Formative", ["5-LS2-1"]),
      ]),
      u("5.3", "Earth Systems", "Spheres of the Earth and their interactions.", [
        a(
          "53-1",
          "Final",
          "Sphere Interaction Map",
          "Summative",
          ["5-ESS2-1"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("5.4", "Space Systems", "Patterns of stars and the sun.", [
        a("54-1", "Lesson 05", "Apparent Brightness Check", "Formative", ["5-ESS1-1"]),
      ]),
    ],
  },
  {
    id: "grade-6",
    label: "Grade 6",
    group: "middle",
    units: [
      u("6.1", "One-Way Mirrors", "Light, vision, and information.", [
        a("61-1", "Lesson 04", "Light Path Diagram", "Formative", ["MS-PS4-2"]),
        a(
          "61-2",
          "Final",
          "Mirror System Design",
          "Performance Task",
          ["MS-PS4-2"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("6.2", "Thermal Energy", "Energy transfer in cup designs.", [
        a("62-1", "Lesson 06", "Insulation Investigation", "Formative", ["MS-PS3-3"]),
      ]),
      u("6.3", "Weather & Climate", "Patterns at multiple scales.", [
        a("63-1", "Lesson 08", "Storm System Analysis", "Formative", ["MS-ESS2-5"]),
      ]),
      u("6.4", "Cells & Systems", "How living systems function.", [
        a("64-1", "Final", "Body Systems Model", "Summative", ["MS-LS1-3"], ["doc", "key"], true),
      ]),
    ],
  },
  {
    id: "grade-7",
    label: "Grade 7",
    group: "middle",
    units: [
      u("7.1", "Chemical Reactions", "Matter transformation.", [
        a("71-1", "Lesson 04", "Comparing White Powders", "Formative", ["MS-PS1-2", "MS-PS1-5"]),
        a(
          "71-1b",
          "Lesson 04",
          "White Powders Progress Tracker",
          "Progress Tracker",
          ["MS-PS1-2"],
          ["doc", "key"],
        ),
        a(
          "71-2",
          "Lesson 09",
          "Mid-Unit Assessment",
          "Summative",
          ["MS-PS1-1"],
          ["doc", "key"],
          true,
        ),
        a(
          "71-3",
          "Final",
          "Flammability & Substance Change",
          "Performance Task",
          ["MS-PS1-2"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("7.2", "Metabolic Reactions", "Energy and matter in living systems.", [
        a("72-1", "Lesson 05", "Photosynthesis Check", "Formative", ["MS-LS1-6"]),
      ]),
      u("7.3", "Genetics & Heredity", "How traits are inherited.", [
        a("73-1", "Lesson 06", "Punnett Square Practice", "Formative", ["MS-LS3-2"]),
      ]),
      u("7.4", "Earth's Resources", "Human impact and sustainability.", [
        a(
          "74-1",
          "Final",
          "Resource Use Argument",
          "Summative",
          ["MS-ESS3-3"],
          ["doc", "key"],
          true,
        ),
      ]),
    ],
  },
  {
    id: "grade-8",
    label: "Grade 8",
    group: "middle",
    units: [
      unit81,
      u("8.2", "Sound Waves", "Energy and patterns of waves.", [
        a(
          "82-1",
          "Lesson 05",
          "Wave Property Check",
          "Formative",
          ["MS-PS4-1"],
          ["doc", "form", "key"],
        ),
        a(
          "82-2",
          "Final",
          "Designing a Sound Solution",
          "Performance Task",
          ["MS-PS4-2"],
          ["doc", "form", "key"],
          true,
        ),
      ]),
      u("8.3", "Forces at a Distance", "Magnetic and electric fields.", [
        a(
          "83-1",
          "Lesson 04",
          "Field Diagram Check",
          "Formative",
          ["MS-PS2-5"],
          ["doc", "form", "key"],
        ),
      ]),
      u("8.4", "Earth in Space", "Gravity and orbital motion.", [
        a(
          "84-1",
          "Lesson 06",
          "Seasons Modeling",
          "Formative",
          ["MS-ESS1-1"],
          ["doc", "form", "key"],
        ),
        a(
          "84-2",
          "Final",
          "Solar System Scale Model",
          "Summative",
          ["MS-ESS1-3"],
          ["doc", "form", "key"],
          true,
        ),
      ]),
    ],
  },
  {
    id: "biology",
    label: "Biology",
    group: "high",
    units: [
      u("B.1", "Ecosystem Dynamics", "Energy flow and matter cycling.", [
        a("b1-1", "Lesson 05", "Food Web Energy Model", "Formative", ["HS-LS2-3", "HS-LS2-4"]),
        a(
          "b1-2",
          "Final",
          "Carrying Capacity Argument",
          "Summative",
          ["HS-LS2-1"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("B.2", "Genetics & Heredity", "DNA, inheritance, and variation.", [
        a("b2-1", "Lesson 06", "Meiosis Mapping", "Formative", ["HS-LS3-2"]),
      ]),
      u("B.3", "Evolution", "Natural selection and common ancestry.", [
        a("b3-1", "Lesson 07", "Selection Pressure Lab", "Formative", ["HS-LS4-3"]),
        a(
          "b3-2",
          "Final",
          "Evolutionary Evidence Brief",
          "Performance Task",
          ["HS-LS4-1"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("B.4", "Cell Function", "Structure-function relationships.", [
        a("b4-1", "Lesson 04", "Membrane Transport Check", "Formative", ["HS-LS1-2"]),
      ]),
    ],
  },
  {
    id: "chemistry",
    label: "Chemistry",
    group: "high",
    units: [
      u("C.1", "Atomic Structure", "Patterns in the periodic table.", [
        a("c1-1", "Lesson 04", "Electron Configuration", "Formative", ["HS-PS1-1"]),
        a(
          "c1-2",
          "Final",
          "Periodic Trends Argument",
          "Summative",
          ["HS-PS1-2"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("C.2", "Chemical Reactions", "Stoichiometry and conservation.", [
        a("c2-1", "Lesson 06", "Balancing Equations Check", "Formative", ["HS-PS1-7"]),
      ]),
      u("C.3", "Thermodynamics", "Energy in chemical change.", [
        a("c3-1", "Lesson 05", "Calorimetry Lab Reflection", "Formative", ["HS-PS3-4"]),
        a(
          "c3-2",
          "Final",
          "Endothermic Design Task",
          "Performance Task",
          ["HS-PS3-3"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("C.4", "Equilibrium", "Reversible reactions and Le Chatelier's.", [
        a("c4-1", "Lesson 04", "Shifting Equilibrium Check", "Formative", ["HS-PS1-6"]),
      ]),
    ],
  },
  {
    id: "physics",
    label: "Physics",
    group: "high",
    units: [
      u("P.1", "Forces & Motion", "Newton's laws applied to systems.", [
        a("p1-1", "Lesson 05", "Free-Body Diagrams", "Formative", ["HS-PS2-1"]),
        a(
          "p1-2",
          "Final",
          "Momentum Collision Lab",
          "Performance Task",
          ["HS-PS2-2", "HS-PS2-3"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("P.2", "Energy", "Conservation and transfer.", [
        a("p2-1", "Lesson 04", "Energy Bar Charts", "Formative", ["HS-PS3-1"]),
      ]),
      u("P.3", "Waves & Electromagnetic Radiation", "Wave behavior and EM spectrum.", [
        a("p3-1", "Lesson 06", "Wave Interference Check", "Formative", ["HS-PS4-1"]),
        a(
          "p3-2",
          "Final",
          "EM Communication Argument",
          "Summative",
          ["HS-PS4-2"],
          ["doc", "key"],
          true,
        ),
      ]),
      u("P.4", "Electricity & Magnetism", "Fields, circuits, and induction.", [
        a("p4-1", "Lesson 05", "Circuit Analysis", "Formative", ["HS-PS2-5"]),
      ]),
    ],
  },
];

export const gradeGroups: { label: string; ids: string[] }[] = [
  { label: "Elementary", ids: ["k", "grade-1", "grade-2", "grade-3", "grade-4", "grade-5"] },
  { label: "Middle", ids: ["grade-6", "grade-7", "grade-8"] },
  { label: "High School", ids: ["biology", "chemistry", "physics"] },
];
