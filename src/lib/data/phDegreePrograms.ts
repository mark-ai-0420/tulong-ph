export type DegreeCategory =
  | 'STEM and Engineering'
  | 'Healthcare'
  | 'Agriculture and Fisheries'
  | 'Business'
  | 'Humanities and Social Sciences'
  | 'Education';

export interface PhilippineDegreeProgram {
  id: string;
  name: string;
  category: DegreeCategory;
  aliases: string[];
  isChedPriority: boolean;
  isDostPriority: boolean;
  isCoconutPriority: boolean;
}

type PriorityTags = Partial<Pick<PhilippineDegreeProgram, 'isChedPriority' | 'isDostPriority' | 'isCoconutPriority'>>;

const normalize = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function degree(name: string, category: DegreeCategory, tags: PriorityTags = {}, aliases: string[] = []): PhilippineDegreeProgram {
  return {
    id: normalize(name).replace(/ /g, '-'),
    name,
    category,
    aliases,
    isChedPriority: tags.isChedPriority ?? false,
    isDostPriority: tags.isDostPriority ?? false,
    isCoconutPriority: tags.isCoconutPriority ?? false,
  };
}

// Tags follow CHED CMO No. 7 s. 2023 and regional priorities supplementing CMO No. 10 s. 2021,
// the DOST-SEI undergraduate priority list for the 2027 application cycle, and Annex C of the 2023 CHED-PCA
// CoScho guidelines. CHED and CoScho recognition can vary by region and call; verify the selected school and program.
// Sources: https://legacy.ched.gov.ph/wp-content/uploads/CMO-NO.-7-S.-2023.pdf
// https://legacy.ched.gov.ph/wp-content/uploads/Regional-Priority-Courses-for-CHED-Scholarship-Prograrms-CSPs-Effective-Academic-Year-2021-2022-4.pdf
// https://ched.gov.ph/wp-content/uploads/CMO-NO.-13-S.-2025.pdf
// https://science-scholarships.ph/pdf/2026_UG_Scholarship_Brochure.pdf
// https://ched.gov.ph/wp-content/uploads/20230913-JMC-No.-01-S-2023-Implementing-Guidelines-of-the-Scholarship-Program-for-Coconut-Farmers-and-their-Families-CoScho.pdf
export const phDegreePrograms: PhilippineDegreeProgram[] = [
  degree('BS Applied Mathematics', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Applied Math', 'BSAMath']),
  degree('BS Applied Mathematics major in Mathematical Finance', 'STEM and Engineering', { isDostPriority: true }, ['Applied Mathematical Finance']),
  degree('BS Mathematics', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Math', 'BS Math']),
  degree('BS Applied Statistics', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Statistics', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }, ['Stat']),
  degree('BS Physics', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }),
  degree('BS Applied Physics', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Applied Physics with Applied Computer System', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Applied Physics with Materials Science and Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Chemistry', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Biochemistry', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }),
  degree('BS Biology', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }),
  degree('BS Microbiology', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Molecular Biology and Biotechnology', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Molecular Biology', 'Biotechnology']),
  degree('BS Environmental Science', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }),
  degree('BS Geology', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Meteorology', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Astronomy', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Computer Science', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Computer Science', 'BSCS']),
  degree('BS Information Technology', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Information Technology', 'IT', 'BSIT']),
  degree('BS Information Systems', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Information System', 'BSIS']),
  degree('BS Management Information Systems', 'STEM and Engineering', { isDostPriority: true }, ['Management Information System', 'MIS']),
  degree('BS Data Science', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Data Science and Analytics', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['BSDS']),
  degree('BS Cybersecurity', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Cyber Security']),
  degree('BS Artificial Intelligence', 'STEM and Engineering', { isDostPriority: true }, ['AI']),
  degree('BS Computer Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Computer Eng', 'BSCpE']),
  degree('BS Electronics Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Electronics and Communications Engineering', 'ECE']),
  degree('BS Electrical Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Electrical Eng', 'BSEE']),
  degree('BS Mechanical Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Mechanical Eng', 'BSME']),
  degree('BS Civil Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Civil Eng', 'BSCE']),
  degree('BS Chemical Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Chemical Eng', 'BSChemE']),
  degree('BS Industrial Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Industrial Eng', 'BSIE']),
  degree('BS Environmental Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }),
  degree('BS Geodetic Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Materials Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Mining Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Aeronautical Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Aerospace Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Mechatronics Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Robotics Engineering', 'STEM and Engineering', { isChedPriority: true }),
  degree('BS Biomedical Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Ceramics Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Geothermal Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Instrumentation and Control Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Metallurgical Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Packaging Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Petroleum Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Railway Engineering and Management', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Transportation Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Energy Systems Management', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Industrial Management Engineering - Information Technology', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Manufacturing Engineering', 'STEM and Engineering', { isDostPriority: true, isCoconutPriority: true }),
  degree('BS Manufacturing Engineering Management - Biomedical Engineering', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Manufacturing Engineering Management - Mechatronics and Robotics', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Food Engineering', 'STEM and Engineering', { isChedPriority: true, isCoconutPriority: true }),
  degree('BS Environmental and Sanitary Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }, ['Sanitary Engineering']),
  degree('BS Naval Architecture and Marine Engineering', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Naval Architecture', 'Marine Engineering']),
  degree('BS Industrial Technology', 'STEM and Engineering', { isChedPriority: true }),
  degree('BS Architecture', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }, ['Architecture']),
  degree('BS Environmental Planning', 'STEM and Engineering', { isChedPriority: true }),
  degree('BS Food Science and Technology', 'STEM and Engineering', { isDostPriority: true, isCoconutPriority: true }, ['Food Science', 'Food Technology']),
  degree('BS Fisheries', 'Agriculture and Fisheries', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }),
  degree('BS Fisheries and Aquatic Sciences', 'Agriculture and Fisheries', { isDostPriority: true, isCoconutPriority: true }),
  degree('BS Marine Science', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true }),
  degree('BS Marine Biology', 'STEM and Engineering', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }),
  degree('BS Information Technology Systems', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Library and Information Science', 'Humanities and Social Sciences', { isChedPriority: true, isDostPriority: true }, ['Library Science', 'BLIS']),
  degree('BS Agricultural Technology', 'Agriculture and Fisheries', { isDostPriority: true }),
  degree('BS Biotechnology', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Clothing Technology', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Fine Arts major in Industrial Design', 'Humanities and Social Sciences', { isDostPriority: true }),
  degree('BS Geography', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Health Sciences', 'Healthcare', { isDostPriority: true }),
  degree('BS Human Biology', 'Healthcare', { isDostPriority: true }),
  degree('BS Industrial Design', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Industrial Pharmacy', 'Healthcare', { isDostPriority: true }),
  degree('BS Information and Communications Technology', 'STEM and Engineering', { isDostPriority: true }, ['ICT']),
  degree('BS Life Sciences', 'STEM and Engineering', { isDostPriority: true }),
  degree('BS Pharmaceutical Sciences', 'Healthcare', { isDostPriority: true }),

  degree('BS Nursing', 'Healthcare', { isChedPriority: true }, ['Nursing', 'BSN']),
  degree('BS Medical Laboratory Science', 'Healthcare', { isChedPriority: true, isDostPriority: true }, ['Medical Technology', 'MedTech', 'MLS', 'BSMT']),
  degree('BS Pharmacy', 'Healthcare', { isChedPriority: true, isDostPriority: true }, ['Pharmacy', 'PharmD']),
  degree('BS Pharmacy major in Clinical Pharmacy', 'Healthcare', { isDostPriority: true }, ['Clinical Pharmacy']),
  degree('Doctor of Dental Medicine', 'Healthcare', { isChedPriority: true }, ['Dentistry', 'DMD']),
  degree('BS Physical Therapy', 'Healthcare', { isChedPriority: true }, ['Physical Therapy', 'PT']),
  degree('BS Occupational Therapy', 'Healthcare', { isChedPriority: true }, ['Occupational Therapy', 'OT']),
  degree('BS Radiologic Technology', 'Healthcare', { isChedPriority: true }, ['Radiologic Tech', 'RadTech']),
  degree('BS Respiratory Therapy', 'Healthcare', { isChedPriority: true }, ['Respiratory Therapy', 'RT']),
  degree('BS Public Health', 'Healthcare', { isChedPriority: true, isDostPriority: true }),
  degree('BS Nutrition and Dietetics', 'Healthcare', { isChedPriority: true, isDostPriority: true }, ['Nutrition', 'Dietetics']),
  degree('BS Psychology', 'Humanities and Social Sciences', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }, ['Psychology', 'BS Psych']),
  degree('BS Speech Language Pathology', 'Healthcare', { isChedPriority: true, isDostPriority: true }, ['Speech-Language Pathology', 'Speech Pathology', 'SLP']),
  degree('BS Midwifery', 'Healthcare', { isChedPriority: true }, ['Midwifery']),
  degree('Doctor of Optometry', 'Healthcare', { isChedPriority: true }, ['Optometry', 'OD']),
  degree('Doctor of Veterinary Medicine', 'Healthcare', { isDostPriority: true }, ['Veterinary Medicine', 'DVM']),
  degree('BS Basic Medical Sciences', 'Healthcare', { isDostPriority: true }),
  degree('BS Prosthetics and Orthotics', 'Healthcare', { isDostPriority: true }),
  degree('BS Medical Biology', 'Healthcare', {}, ['Medical Biology']),
  degree('BS Community Nutrition', 'Healthcare', { isDostPriority: true }),

  degree('BS Agriculture', 'Agriculture and Fisheries', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }, ['Agriculture', 'BSA']),
  degree('BS Agribusiness Management', 'Agriculture and Fisheries', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }, ['Agribusiness', 'Agribusiness Management and Entrepreneurship']),
  degree('BS Agricultural Economics', 'Agriculture and Fisheries', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }, ['Agricultural and Applied Economics']),
  degree('BS Agribusiness Economics', 'Agriculture and Fisheries', { isDostPriority: true }),
  degree('BS Agricultural and Biosystems Engineering', 'Agriculture and Fisheries', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }, ['Agricultural Engineering', 'Agricultural and Biosystems Eng']),
  degree('BS Agricultural Biotechnology', 'Agriculture and Fisheries', { isDostPriority: true, isCoconutPriority: true }),
  degree('BS Agricultural Chemistry', 'Agriculture and Fisheries', { isDostPriority: true, isCoconutPriority: true }),
  degree('BS Agricultural Entrepreneurship', 'Agriculture and Fisheries', { isCoconutPriority: true }),
  degree('BS Agricultural Education', 'Agriculture and Fisheries', { isDostPriority: true }),
  degree('BS Agricultural Extension Education', 'Agriculture and Fisheries', { isCoconutPriority: true }),
  degree('BS Animal Science', 'Agriculture and Fisheries', { isDostPriority: true }),
  degree('BS Animal Husbandry', 'Agriculture and Fisheries', { isDostPriority: true }),
  degree('BS Agroforestry', 'Agriculture and Fisheries', { isChedPriority: true, isDostPriority: true }),
  degree('BS Forestry', 'Agriculture and Fisheries', { isChedPriority: true, isDostPriority: true, isCoconutPriority: true }),
  degree('BS Horticulture', 'Agriculture and Fisheries'),
  degree('BS Crop Science', 'Agriculture and Fisheries'),
  degree('BS Soil Science', 'Agriculture and Fisheries'),
  degree('BS Plant Science', 'Agriculture and Fisheries'),
  degree('BS Rural Development', 'Agriculture and Fisheries', { isCoconutPriority: true }),
  degree('BS Plant Pathology', 'Agriculture and Fisheries'),
  degree('BS Agronomy', 'Agriculture and Fisheries'),
  degree('BS Agricultural Communication', 'Agriculture and Fisheries'),

  degree('BS Accountancy', 'Business', { isChedPriority: true }, ['Accountancy', 'BSAc']),
  degree('BS Business Administration', 'Business', { isCoconutPriority: true }, ['Business Administration', 'BSBA']),
  degree('BS Management', 'Business'),
  degree('BS Economics', 'Business', { isChedPriority: true, isCoconutPriority: true }, ['Economics']),
  degree('BS Marketing Management', 'Business'),
  degree('BS Financial Management', 'Business'),
  degree('BS Human Resource Management', 'Business', { isChedPriority: true }, ['Human Resource Development and Management']),
  degree('BS Entrepreneurship', 'Business', { isChedPriority: true }, ['Entrepreneurship']),
  degree('BS Hospitality Management', 'Business', { isChedPriority: true }, ['Hotel and Restaurant Management']),
  degree('BS Tourism Management', 'Business', { isChedPriority: true, isCoconutPriority: true }, ['Tourism']),
  degree('BS Business Analytics', 'Business', { isChedPriority: true }, ['Business Analytics major']),
  degree('BS Supply Chain Management', 'Business', { isChedPriority: true }, ['Logistics']),
  degree('BS Office Administration', 'Business', { isChedPriority: true }, ['Office Administration']),
  degree('BS Public Administration', 'Humanities and Social Sciences', { isChedPriority: true, isCoconutPriority: true }, ['Public Administration', 'BPA']),

  degree('BA Communication', 'Humanities and Social Sciences', { isChedPriority: true }, ['Communication', 'AB Communication']),
  degree('BS Journalism', 'Humanities and Social Sciences', { isChedPriority: true }, ['Journalism']),
  degree('BA Broadcasting', 'Humanities and Social Sciences', { isChedPriority: true }, ['Broadcasting']),
  degree('BS Development Communication', 'Humanities and Social Sciences', { isChedPriority: true, isCoconutPriority: true }, ['Development Communication', 'DevCom']),
  degree('BS Development Communication major in Science Communication', 'Humanities and Social Sciences', { isDostPriority: true }, ['Science Communication']),
  degree('BA Political Science', 'Humanities and Social Sciences', { isCoconutPriority: true }, ['Political Science', 'PolSci']),
  degree('BA History', 'Humanities and Social Sciences'),
  degree('BA Sociology', 'Humanities and Social Sciences'),
  degree('BS Social Work', 'Humanities and Social Sciences', { isChedPriority: true, isCoconutPriority: true }, ['Social Work']),
  degree('BA Philosophy', 'Humanities and Social Sciences', { isChedPriority: true }, ['Philosophy']),
  degree('BA English Language Studies', 'Humanities and Social Sciences', {}, ['English', 'English Language']),
  degree('BA Filipino', 'Humanities and Social Sciences', {}, ['Filipino']),
  degree('BA Anthropology', 'Humanities and Social Sciences'),
  degree('BA Development Studies', 'Humanities and Social Sciences'),
  degree('BA Peace Studies', 'Humanities and Social Sciences', { isChedPriority: true }, ['Peace Studies and Education']),
  degree('BA Indigenous Peoples Studies', 'Humanities and Social Sciences', { isChedPriority: true }, ['Indigenous Peoples Education']),
  degree('BS Community Development', 'Humanities and Social Sciences', { isChedPriority: true }, ['Community Development']),
  degree('BA International Studies', 'Humanities and Social Sciences'),
  degree('BS Criminology', 'Humanities and Social Sciences', {}, ['Criminology']),
  degree('BA Fine Arts', 'Humanities and Social Sciences', { isChedPriority: true }, ['Fine Arts']),
  degree('BS Interior Design', 'STEM and Engineering', { isChedPriority: true }, ['Interior Design']),
  degree('BS Landscape Architecture', 'STEM and Engineering', { isChedPriority: true }, ['Landscape Architecture']),
  degree('BS Construction Management', 'Business', { isChedPriority: true }, ['Construction Management']),
  degree('BS Development Management', 'Humanities and Social Sciences', { isCoconutPriority: true }),
  degree('Bachelor of Secondary Education in Biological Sciences', 'Education', { isDostPriority: true }),
  degree('Bachelor of Secondary Education in Biology and Chemistry', 'Education', { isDostPriority: true }),
  degree('Bachelor of Secondary Education in Chemistry', 'Education', { isDostPriority: true }),
  degree('Bachelor of Secondary Education in General Sciences', 'Education', { isDostPriority: true }),
  degree('Bachelor of Secondary Education in Physical Sciences', 'Education', { isDostPriority: true }),
  degree('Bachelor of Secondary Education in Physics', 'Education', { isDostPriority: true }),
  degree('Bachelor of Secondary Education in Physics and Chemistry', 'Education', { isDostPriority: true }),
  degree('Bachelor of Secondary Education in Physics and Mathematics', 'Education', { isDostPriority: true }),

  degree('Bachelor of Elementary Education', 'Education', { isChedPriority: true }, ['BEEd', 'Elementary Education']),
  degree('Bachelor of Elementary Education in Mathematics', 'Education', { isChedPriority: true, isDostPriority: true }),
  degree('Bachelor of Elementary Education in Science and Health', 'Education', { isChedPriority: true, isDostPriority: true }),
  degree('Bachelor in Elementary Mathematics and Science Education', 'Education', { isDostPriority: true }),
  degree('Bachelor of Secondary Education', 'Education', { isChedPriority: true }, ['BSEd', 'Secondary Education']),
  degree('Bachelor of Physical Education', 'Education', { isChedPriority: true }, ['BPEd', 'Physical Education']),
  degree('Bachelor of Technology and Livelihood Education', 'Education', { isChedPriority: true }, ['BTLEd', 'Technology and Livelihood Education']),
  degree('Bachelor of Technology and Livelihood Education with ICT specialization', 'Education', { isDostPriority: true }),
  degree('Bachelor of Technical-Vocational Teacher Education', 'Education', { isChedPriority: true }, ['BTVTEd', 'Technical Vocational Teacher Education']),
  degree('BS Special Needs Education', 'Education', { isChedPriority: true }, ['Special Needs Education', 'Special Education']),
  degree('BS Early Childhood Education', 'Education', { isChedPriority: true }, ['Early Childhood Education']),
  degree('BS Sports Science', 'Education', { isChedPriority: true, isDostPriority: true }, ['Sports and Exercise Science', 'Sports Science']),
  degree('Bachelor in Mathematics Education', 'Education', { isChedPriority: true, isDostPriority: true }, ['BS Mathematics Education', 'Math Education']),
  degree('Bachelor of Science Education with specializations in Biology, Chemistry, or Physics', 'Education', { isChedPriority: true, isDostPriority: true }, ['BS Science Education', 'Science Education']),
  degree('Bachelor of Secondary Education in Mathematics', 'Education', { isChedPriority: true, isDostPriority: true }, ['BSE Mathematics']),
  degree('Bachelor of Secondary Education in Science', 'Education', { isChedPriority: true, isDostPriority: true }, ['BSE Science']),
  degree('BS Mathematics and Science Teaching', 'Education', { isChedPriority: true, isDostPriority: true }),
  degree('BS Mathematics for Teachers', 'Education', { isChedPriority: true, isDostPriority: true }),
  degree('BS Biology for Teachers', 'Education', { isChedPriority: true, isDostPriority: true }),
  degree('BS Chemistry for Teachers', 'Education', { isChedPriority: true, isDostPriority: true }),
  degree('BS Physics for Teachers', 'Education', { isChedPriority: true, isDostPriority: true }),
  degree('BS Religious Education', 'Education', { isChedPriority: true }, ['Religious Education']),
];

const searchText = (program: PhilippineDegreeProgram) => normalize([program.name, ...program.aliases].join(' '));

export function searchDegreePrograms(query: string): PhilippineDegreeProgram[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  const queryWords = normalizedQuery.split(' ');

  return phDegreePrograms
    .map((program) => {
      const text = searchText(program);
      const score = text === normalizedQuery ? 0
        : text.startsWith(normalizedQuery) ? 1
          : text.includes(normalizedQuery) ? 2
            : queryWords.every((word) => text.includes(word)) ? 3 : Number.POSITIVE_INFINITY;
      return { program, score };
    })
    .filter((result) => Number.isFinite(result.score))
    .sort((left, right) => left.score - right.score || left.program.name.localeCompare(right.program.name))
    .map(({ program }) => program);
}

export function matchDegreeProgram(nameOrQuery: string): PhilippineDegreeProgram | undefined {
  const normalizedQuery = normalize(nameOrQuery);
  if (!normalizedQuery) return undefined;
  return phDegreePrograms.find((program) => normalize(program.name) === normalizedQuery
    || program.aliases.some((alias) => normalize(alias) === normalizedQuery))
    ?? searchDegreePrograms(nameOrQuery)[0];
}
