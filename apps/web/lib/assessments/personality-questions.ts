function mcq(
  id: string,
  prompt: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
) {
  return { id, prompt, options, correctIndex };
}

export const APTITUDE_QUESTIONS: {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}[] = [
  mcq("apt-01", "Book is to reading as fork is to…", ["Drawing", "Writing", "Stirring", "Eating"], 3),
  mcq("apt-02", "Which number comes next: 2, 6, 12, 20, 30, …", ["38", "40", "42", "44"], 2),
  mcq("apt-03", "All coaches are mentors. Some mentors are engineers. Which statement must be true?", [
    "All engineers are coaches",
    "Some coaches are engineers",
    "No engineer is a coach",
    "None of the above must be true",
  ], 3),
  mcq("apt-04", "Find the odd one out: cube, sphere, pyramid, circle.", ["Cube", "Sphere", "Pyramid", "Circle"], 3),
  mcq("apt-05", "If every coded letter is shifted two places forward (A→C, B→D), what is the code for LEAD?", ["NGCF", "MFBE", "NGCE", "OFCF"], 0),
  mcq("apt-06", "A statement: “Only graduates may apply.” Which option is a valid conclusion?", [
    "Every graduate will be hired",
    "Non-graduates may not apply",
    "Graduates cannot be rejected",
    "Experience is irrelevant",
  ], 1),
  mcq("apt-07", "Which pair has the same relationship as Clock : Time?", [
    "Thermometer : Heat",
    "Map : Traveller",
    "Scale : Weight",
    "Camera : Photograph",
  ], 2),
  mcq("apt-08", "Complete the series: AZ, BY, CX, …", ["DW", "DU", "EV", "EW"], 0),
  mcq("apt-09", "A team of 6 sits in a circle facing inward. Priya sits to the immediate left of Arun. Who sits to Arun’s immediate right?", [
    "Priya",
    "Cannot be determined from the information",
    "The person two seats from Priya",
    "Whoever faces Priya",
  ], 1),
  mcq("apt-10", "“Few of the proposals were funded.” Which restatement preserves the meaning most closely?", [
    "Most proposals were funded",
    "At least some proposals were funded, and not many",
    "No proposals were funded",
    "All proposals were funded",
  ], 1),
  mcq("apt-11", "If all roses are flowers and some flowers fade quickly, which must be true?", [
    "All roses fade quickly",
    "Some roses fade quickly",
    "No roses fade quickly",
    "None of these must be true",
  ], 3),
  mcq("apt-12", "Find the odd one: Mercury, Venus, Mars, Pluto.", ["Mercury", "Venus", "Mars", "Pluto"], 3),
  mcq("apt-13", "Complete: 3, 9, 27, 81, …", ["162", "243", "324", "729"], 1),
  mcq("apt-14", "Doctor is to hospital as teacher is to…", ["Book", "Student", "School", "Lesson"], 2),
  mcq("apt-15", "Which word cannot be formed from ASSESSMENT?", ["ASSET", "MEANS", "TAMES", "SEASON"], 3),
  mcq("apt-16", "If 1=3, 2=3, 3=5, 4=4, 5=4, then 6=?", ["3", "4", "5", "6"], 0),
  mcq("apt-17", "A is taller than B. C is shorter than B. D is taller than A. Who is shortest?", ["A", "B", "C", "D"], 2),
  mcq("apt-18", "Statements: All pens are tools. Some tools are metal. Conclusion: Some pens are metal.", [
    "Follows",
    "Does not follow",
    "Follows only if some tools are pens",
    "Follows only if all tools are metal",
  ], 1),
  mcq("apt-19", "Rearrange letters of LISTEN to form a meaningful word.", ["SILENT", "TINSEL is the only option", "ENLIST only", "All of SILENT, ENLIST, TINSEL"], 3),
  mcq("apt-20", "If in a code MANGO is NBOHP, then APPLE is…", ["BQQMF", "BQQME", "Zook", "BPPMF"], 0),
  mcq("apt-21", "Which number is the odd one: 2, 3, 6, 7, 8, 14, 15, 16?", ["8", "14", "15", "16"], 0),
  mcq("apt-22", "Pen is to poet as needle is to…", ["Thread", "Tailor", "Cloth", "Button"], 1),
  mcq("apt-23", "If the day after tomorrow is Friday, what day was yesterday?", ["Monday", "Tuesday", "Wednesday", "Thursday"], 1),
  mcq("apt-24", "Choose the pair with the same relation as Island : Ocean.", [
    "Oasis : Desert",
    "Tree : Forest",
    "City : Building",
    "River : Boat",
  ], 0),
  mcq("apt-25", "Find the next letter: A, C, F, J, O, …", ["S", "T", "U", "V"], 2),
  mcq("apt-26", "If only one of the following is true, which can be true: “All passed.” “None passed.” “Some passed.”?", [
    "All passed",
    "None passed",
    "Some passed",
    "Any of them, depending on the rest",
  ], 3),
  mcq("apt-27", "A cube is painted and cut into 27 smaller cubes. How many have paint on exactly two faces?", ["6", "8", "12", "24"], 2),
  mcq("apt-28", "Which is a valid analogy: Minute : Hour :: …", ["Day : Week", "Week : Month (approx)", "Second : Minute", "Year : Decade"], 2),
  mcq("apt-29", "If SOUTH is coded as 12345 and NORTH as 62345, then HORN is…", ["5236", "5326", "4523", "4536"], 0),
  mcq("apt-30", "Pointing to a photograph, a man says “I have no brother, but that man’s father is my father’s son.” Who is in the photo?", [
    "His son",
    "His father",
    "His nephew",
    "Himself",
  ], 0),
];

export const QUANTITATIVE_QUESTIONS: {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}[] = [
  mcq("qty-01", "What is 18% of 2,500?", ["350", "400", "450", "500"], 2),
  mcq("qty-02", "A ratio of 3:5 is equivalent to which percentage of the first part to the whole?", ["37.5%", "40%", "60%", "62.5%"], 0),
  mcq("qty-03", "A train covers 240 km in 3 hours. At the same speed, how long for 400 km?", ["4 hours", "5 hours", "5 hours 15 min", "6 hours"], 1),
  mcq("qty-04", "The average of 8, 12, 16 and 24 is…", ["14", "15", "16", "18"], 1),
  mcq("qty-05", "A laptop listed at ₹40,000 is sold at a 12% discount. Sale price?", ["₹34,800", "₹35,200", "₹35,600", "₹36,000"], 1),
  mcq("qty-06", "If 5 machines finish a job in 12 days, how many days for 8 identical machines?", ["6.5", "7", "7.5", "8"], 2),
  mcq("qty-07", "Simple interest on ₹8,000 at 10% a year for 2 years is…", ["₹800", "₹1,200", "₹1,600", "₹1,800"], 2),
  mcq("qty-08", "A chart shows Q1 40, Q2 55, Q3 50, Q4 75 enrolments. What is the percentage increase from Q1 to Q4?", ["75%", "87.5%", "90%", "35"], 1),
  mcq("qty-09", "A mixture is 3 parts water to 2 parts concentrate. How much concentrate in 15 litres of mixture?", ["5 L", "6 L", "7.5 L", "9 L"], 1),
  mcq("qty-10", "If x + 2y = 16 and y = 3, what is x?", ["8", "10", "11", "13"], 1),
  mcq("qty-11", "A shopkeeper buys at ₹80 and sells at ₹100. Profit percent?", ["20%", "25%", "18%", "22.5%"], 1),
  mcq("qty-12", "What is 2/5 of 350?", ["70", "120", "140", "175"], 2),
  mcq("qty-13", "Compound interest on ₹5,000 at 10% for 2 years (annual) is…", ["₹1,000", "₹1,050", "₹1,100", "₹1,200"], 1),
  mcq("qty-14", "A number increased by 20% becomes 180. The original number is…", ["140", "150", "160", "144"], 1),
  mcq("qty-15", "Speed 72 km/h equals how many metres per second?", ["10", "15", "20", "25"], 2),
  mcq("qty-16", "LCM of 12 and 18 is…", ["24", "36", "48", "72"], 1),
  mcq("qty-17", "HCF of 24 and 36 is…", ["6", "8", "12", "18"], 2),
  mcq("qty-18", "A rectangle is 12 m by 5 m. Area?", ["17 m²", "34 m²", "60 m²", "120 m²"], 2),
  mcq("qty-19", "If 15% of a number is 45, the number is…", ["250", "280", "300", "320"], 2),
  mcq("qty-20", "A can do a job in 10 days, B in 15. Together they finish in…", ["5 days", "6 days", "7 days", "8 days"], 1),
  mcq("qty-21", "The median of 3, 9, 5, 7, 11 is…", ["5", "7", "9", "11"], 1),
  mcq("qty-22", "Probability of drawing an ace from a 52-card deck?", ["1/13", "1/12", "1/4", "4/13"], 0),
  mcq("qty-23", "A sum triples in 10 years at simple interest. Annual rate?", ["10%", "15%", "20%", "25%"], 2),
  mcq("qty-24", "If 3x − 7 = 14, x equals…", ["5", "6", "7", "8"], 2),
  mcq("qty-25", "A pie chart of 360° represents 1,800 students. 90° is how many students?", ["350", "400", "450", "500"], 2),
  mcq("qty-26", "√196 is…", ["12", "13", "14", "16"], 2),
  mcq("qty-27", "A tank fills in 8 hours and leaks empty in 12. Net fill time if both open?", ["16 h", "20 h", "24 h", "48 h"], 2),
  mcq("qty-28", "20% of 20% of 500 is…", ["10", "20", "25", "50"], 1),
  mcq("qty-29", "A car travels 150 km at 50 km/h and 150 km at 75 km/h. Average speed?", ["50 km/h", "60 km/h", "62.5 km/h", "65 km/h"], 1),
  mcq("qty-30", "If CP = ₹240 and SP = ₹300, mark-up on cost is…", ["20%", "25%", "30%", "60"], 1),
];

function psyche(
  id: string,
  prompt: string,
  dimension: "drive" | "structure" | "people" | "risk",
  polarity: 1 | -1,
) {
  return { id, prompt, dimension, polarity };
}

export const PSYCHE_QUESTIONS: {
  id: string;
  prompt: string;
  dimension: "drive" | "structure" | "people" | "risk";
  polarity: 1 | -1;
}[] = [
  psyche("psy-01", "I volunteer for stretch goals even when the outcome is uncertain.", "drive", 1),
  psyche("psy-02", "I feel restless when I am not making measurable progress.", "drive", 1),
  psyche("psy-03", "I would rather keep a role I have mastered than chase a harder one.", "drive", -1),
  psyche("psy-04", "I prefer a written plan before I start a new project.", "structure", 1),
  psyche("psy-05", "Unclear instructions bother me more than a tight deadline.", "structure", 1),
  psyche("psy-06", "I am comfortable changing the plan as soon as new information appears.", "structure", -1),
  psyche("psy-07", "I think out loud with others before I decide.", "people", 1),
  psyche("psy-08", "Teaching someone a skill is how I know I understand it.", "people", 1),
  psyche("psy-09", "I do my best work when I can stay uninterrupted and decide alone.", "people", -1),
  psyche("psy-10", "I would rather try a new tool than master the one I already use.", "risk", 1),
  psyche("psy-11", "Ambiguous problems energize me more than well-specified ones.", "risk", 1),
  psyche("psy-12", "I wait for a proven method before I commit time to a new approach.", "risk", -1),
  psyche("psy-13", "I set a public deadline so I cannot quietly lower the bar.", "drive", 1),
  psyche("psy-14", "Finishing something good enough is more satisfying than starting something ambitious.", "drive", -1),
  psyche("psy-15", "I track my week in hours and outcomes, not in how busy I felt.", "drive", 1),
  psyche("psy-16", "A messy workspace makes it hard for me to think.", "structure", 1),
  psyche("psy-17", "I like roles with a playbook more than roles I have to invent.", "structure", 1),
  psyche("psy-18", "Rules exist to be rewritten when they slow the work.", "structure", -1),
  psyche("psy-19", "I notice when someone on the team has gone quiet.", "people", 1),
  psyche("psy-20", "Feedback conversations drain me more than a hard technical problem.", "people", -1),
  psyche("psy-21", "I would rather ship with a partner than ship alone faster.", "people", 1),
  psyche("psy-22", "I sign up for beta tools before the documentation is finished.", "risk", 1),
  psyche("psy-23", "I would rather be slightly behind a stable stack than first on a fragile one.", "risk", -1),
  psyche("psy-24", "Unknown unknowns are part of why I pick a domain.", "risk", 1),
  psyche("psy-25", "I get impatient in meetings that do not end with an owner and a date.", "drive", 1),
  psyche("psy-26", "Checklists make me feel safer, not slower.", "structure", 1),
  psyche("psy-27", "I recover energy by talking the problem through with a colleague.", "people", 1),
  psyche("psy-28", "I would take a pay cut to work on something nobody has a map for yet.", "risk", 1),
  psyche("psy-29", "If two paths look equal, I pick the one with more structure.", "structure", 1),
  psyche("psy-30", "Being useful to a group matters more to me than being the best individual contributor.", "people", 1),
];
