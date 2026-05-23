(function() {
'use strict';
let searchIndex = [];
let isIndexLoaded = false;
let searchTimer = null;
function initSearch() {
const searchInput = document.getElementById('search-input');
const searchForm = document.querySelector('.search-form');
const searchResults = document.getElementById('search-results');
if (!searchInput || !searchForm || !searchResults) {
console.warn('Search elements not found');
return;
}
console.log('Initializing search...');
buildSearchIndex().catch(err => {
console.error('Error building search index:', err);
});
searchInput.addEventListener('input', handleSearchInput);
searchForm.addEventListener('submit', handleSearchSubmit);
searchInput.addEventListener('focus', () => {
if (searchInput.value.trim().length >= 1) {
performSearch(searchInput.value.trim());
}
});
document.addEventListener('click', (e) => {
if (!searchForm.contains(e.target)) {
hideResults();
}
});
searchInput.addEventListener('keydown', handleKeydown);
console.log('Search initialized successfully');
}
async function extractSubjectsFromHtml(htmlFilePath) {
try {
const response = await fetch(htmlFilePath, { cache: 'force-cache' });
if (!response.ok) {
return [];
}
const html = await response.text();
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');
const subjects = [];
const selectors = [
'.computer-1-semester[id]',
'[class*="semester"][id]',
'section[id]',
'div[id][class*="subject"]',
'div[id][class*="semester"]'
];
let foundSections = [];
for (const selector of selectors) {
const sections = doc.querySelectorAll(selector);
if (sections.length > 0) {
foundSections = Array.from(sections);
break;
}
}
foundSections.forEach(section => {
const sectionId = section.id;
if (!sectionId) return;
const heading = section.querySelector('.semester-heading') ||
section.querySelector('h2') ||
section.querySelector('h3') ||
section.querySelector('[class*="heading"]') ||
section.querySelector('[class*="title"]');
if (heading) {
const subjectName = heading.textContent.trim();
if (subjectName.toLowerCase().includes('semester') &&
subjectName.toLowerCase().includes('previous year')) {
return;
}
if (subjectName.length < 3 || /^\d+$/.test(subjectName)) {
return;
}
const subtext = section.querySelector('.semester-subtext') ||
section.querySelector('[class*="subtext"]');
const hasSessionButtons = section.querySelector('.semester-subject-card') ||
section.querySelector('[class*="session"]') ||
section.querySelector('button') ||
section.querySelector('a[href*="pdf"]');
if (subtext && (subtext.textContent.includes('Select exam session') ||
subtext.textContent.includes('exam session') ||
subtext.textContent.includes('session'))) {
subjects.push({ id: sectionId, name: subjectName });
} else if (hasSessionButtons && sectionId) {
subjects.push({ id: sectionId, name: subjectName });
} else if (sectionId && subjectName.length > 5) {
subjects.push({ id: sectionId, name: subjectName });
}
}
});
return subjects;
} catch (error) {
return [];
}
}
async function buildSearchIndex() {
if (isIndexLoaded) return;

// Try to load from localStorage first
const CACHE_KEY = 'hsbte_search_index_v3';
const cached = localStorage.getItem(CACHE_KEY);
if (cached) {
    try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed) && parsed.length > 500) {
            searchIndex = parsed;
            isIndexLoaded = true;
            console.log(`Search index loaded from cache (${searchIndex.length} items).`);
            return;
        }
    } catch (e) {
        console.warn('Error parsing cached search index');
    }
}

const basePath = '/';
const branches = [
{ name: 'Agriculture Engineering', url: 'Agriculture', semesters: [1, 2, 3, 4, 5], key: 'agriculture' },
{ name: 'Architectural Assistantship', url: 'Architectural-Assistantship', semesters: [1, 2, 3, 4, 5, 6], key: 'architectural' },
{ name: 'Automobile Engineering', url: 'Automobile', semesters: [1, 2, 3, 4, 5, 6], key: 'automobile' },
{ name: 'Automation & Robotics', url: 'Automation', semesters: [1, 2, 3, 4, 5, 6], key: 'automation' },
{ name: 'AI & ML', url: 'ai-ml', semesters: [1, 2, 3, 4, 5, 6], key: 'ai-ml' },
{ name: 'Chemical Engineering', url: 'Chemical', semesters: [1, 2, 3, 4, 5, 6], key: 'chemical' },
{ name: 'Civil Engineering', url: 'civil', semesters: [1, 2, 3, 4, 5, 6], key: 'civil' },
{ name: 'Computer Engineering', url: 'computer-pyq', semesters: [1, 2, 3, 4, 5, 6], key: 'computer' },
{ name: 'DBM', url: 'dbm', semesters: [1, 2, 3, 4, 5], key: 'dbm' },
{ name: 'ECE', url: 'ece', semesters: [1, 2, 3, 4, 5, 6], key: 'ece' },
{ name: 'Electrical Engineering', url: 'Electrical-Engineering', semesters: [1, 2, 3, 4, 5, 6], key: 'electrical' },
{ name: 'Fashion Design', url: 'Fashion-Design', semesters: [1, 2, 3, 4, 5, 6], key: 'fashion-design' },
{ name: 'Fashion Technology', url: 'Fashion-Technology', semesters: [1, 2, 3, 4, 5, 6], key: 'fashion-technology' },
{ name: 'Food Technology', url: 'Food', semesters: [1, 2, 3, 4, 5, 6], key: 'food' },
{ name: 'Hotel Management', url: 'Hotel-Management', semesters: [1, 2, 3, 4, 5], key: 'hotel' },
{ name: 'Instrumentation & Control', url: 'Instrumentation-&-Control', semesters: [1, 2, 3, 4, 5, 6], key: 'instrumentation' },
{ name: 'Library & Information Science', url: 'Library', semesters: [1, 2, 3, 4, 5], key: 'library' },
{ name: 'Mechanical Engineering', url: 'mech', semesters: [1, 2, 3, 4, 5, 6], key: 'mechanical' },
{ name: 'Medical Electronics', url: 'Medical-Electronics', semesters: [1, 2, 3, 4, 5], key: 'medical-electronics' },
{ name: 'Medical Lab Technology', url: 'Medical-Laboratory-Technology', semesters: [1, 2, 3, 4], key: 'medical-lab' },
{ name: 'Office Management', url: 'Office-Management', semesters: [1, 2, 3, 4, 5], key: 'office' },
{ name: 'Plastic Technology', url: 'Plastic', semesters: [1, 2, 3, 4, 5, 6], key: 'plastic' },
{ name: 'Textile Design', url: 'Textile-Design', semesters: [1, 2, 3, 4, 5, 6], key: 'textile-design' },
{ name: 'Textile Processing', url: 'Textile-Processing', semesters: [1, 2, 3, 4, 5, 6], key: 'textile-processing' },
{ name: 'Textile Technology', url: 'Textile-Technology', semesters: [1, 2, 3, 4, 5, 6], key: 'textile-technology' },
{ name: 'Ceramic Engineering', url: 'Ceramic', semesters: [1, 2, 3, 4, 5], key: 'ceramic' },
{ name: 'Advance Diploma', url: 'Adv-Diploma', semesters: [1, 2, 3, 4], key: 'adv-diploma' },
{ name: 'FAA', url: 'FAA', semesters: [1, 2, 3, 4, 5], key: 'faa' },
{ name: 'D Pharmacy', url: 'd-pharmacy', semesters: [1, 2], key: 'd-pharmacy' }
];

// Initial sync build for branches and static pages
branches.forEach(branch => {
searchIndex.push({
type: 'branch',
title: branch.name,
url: `${basePath}${branch.url}`,
keywords: [branch.name.toLowerCase(), ...branch.name.split(' ').map(w => w.toLowerCase())]
});
branch.semesters.forEach(sem => {
const semNum = sem === 1 ? '1st' : sem === 2 ? '2nd' : sem === 3 ? '3rd' : `${sem}th`;
let semesterUrl;
if (branch.key === 'computer') {
semesterUrl = sem === 1 ? `${basePath}computer-1-semester` : `${basePath}computer-pyq-${sem}-semester`;
} else {
semesterUrl = `${basePath}${branch.url}-${sem}`;
}
searchIndex.push({
type: 'semester',
title: `${branch.name} - ${semNum} Semester`,
url: semesterUrl,
keywords: [
branch.name.toLowerCase(),
`${semNum} semester`.toLowerCase(),
`semester ${sem}`.toLowerCase(),
...branch.name.split(' ').map(w => w.toLowerCase())
]
});
});
});

// Use requestIdleCallback to index subjects without blocking main thread
const startBackgroundIndexing = () => {
    let globalIdx = 0;
    branches.forEach(branch => {
        branch.semesters.forEach(sem => {
            const semNum = sem === 1 ? '1st' : sem === 2 ? '2nd' : sem === 3 ? '3rd' : `${sem}th`;
            let semesterUrl;
            if (branch.key === 'computer') {
                semesterUrl = sem === 1 ? `${basePath}computer-1-semester` : `${basePath}computer-pyq-${sem}-semester`;
            } else {
                semesterUrl = `${basePath}${branch.url}-${sem}`;
            }
            const fetchUrl = `${semesterUrl}.html`;
            
            // Staggered background fetch
            setTimeout(() => {
                const runner = () => {
                   extractSubjectsFromHtml(fetchUrl).then(subjects => {
                        subjects.forEach(subject => {
                            const subjectWords = subject.name.split(/[\s&–\-()]+/).filter(w => w.length > 0);
                            const keywords = [
                                subject.name.toLowerCase(),
                                ...subjectWords.map(w => w.toLowerCase()),
                                branch.name.toLowerCase(),
                                `${semNum} semester`.toLowerCase()
                            ];
                            searchIndex.push({
                                type: 'subject',
                                title: `${subject.name} (${branch.name} - ${semNum} Sem)`,
                                url: `${semesterUrl}#${subject.id}`,
                                keywords: [...new Set(keywords)],
                                subjectName: subject.name,
                                branchName: branch.name,
                                semester: sem
                            });
                        });
                        if (subjects.length > 0) saveIndexWithDelay();
                    }).catch(() => {});
                };
                
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(runner);
                } else {
                    runner();
                }
            }, 3000 + (globalIdx * 250)); // Start much later and staggered
            globalIdx++;
        });
    });
};

if (window.requestIdleCallback) {
    window.requestIdleCallback(startBackgroundIndexing, { timeout: 5000 });
} else {
    setTimeout(startBackgroundIndexing, 4000);
}
searchIndex.push(
{ type: 'page', title: 'HSBTE PYQ', url: `${basePath}hsbte-pyq`, keywords: ['hsbte', 'pyq', 'previous year', 'question papers', 'question paper'] },
{ type: 'page', title: 'Home', url: `${basePath}`, keywords: ['home', 'main', 'index', 'homepage'] },
{ type: 'page', title: 'Syllabus', url: `${basePath}syllabus`, keywords: ['syllabus', 'hsbte syllabus', 'diploma syllabus', 'polytechnic syllabus', 'haryana syllabus', 'syllabus pdf', 'curriculum'] },
{
type: 'page',
title: 'Haryana LEET',
url: `${basePath}haryanaleet`,
keywords: ['leet', 'haryana leet', 'lateral entry', 'haryana', 'lateral entry engineering test', 'haryana lateral entry', 'haryana leet exam', 'haryana leet syllabus', 'haryana leet sample paper']
},
{
type: 'page',
title: 'BTech LEET Information',
url: `${basePath}btech-leet`,
keywords: ['btech leet', 'btech', 'b.tech leet', 'b tech leet', 'btech lateral entry', 'engineering leet', 'leet btech', 'btech lateral', 'btech information', 'btech syllabus', 'btech exam pattern', 'btech cutoff', 'btech key dates', 'btech leet 2025', 'btech leet 2026', 'btech leet 2027']
},
{
type: 'page',
title: 'BTech LEET Key Dates 2026-27',
url: `${basePath}btech-leet-key-dates`,
keywords: ['btech leet key dates', 'btech leet dates', 'btech important dates', 'btech leet counselling dates', 'btech leet exam date 2026', 'haryana btech leet key dates', 'ocet btech dates']
},
{
type: 'page',
title: 'BTech LEET Sample Papers',
url: `${basePath}btech-leet-sample-paper`,
keywords: ['btech leet sample paper', 'btech sample paper', 'btech leet sample', 'btech mock paper', 'btech practice paper', 'btech leet practice', 'sample paper btech', 'btech leet mock', 'btech leet papers', 'btech sample', 'btech practice', 'btech mock', 'btech leet pyq', 'btech leet previous year']
},
{
type: 'page',
title: 'B. Pharmacy LEET Information',
url: `${basePath}B-Pharmacy-leet`,
keywords: ['b pharmacy leet', 'bpharmacy leet', 'b.pharmacy leet', 'b pharmacy lateral entry', 'pharmacy leet', 'bpharm leet', 'b pharm leet', 'bpharmacy', 'b pharmacy', 'pharmacy lateral entry', 'b pharmacy information', 'b pharmacy syllabus', 'b pharmacy exam pattern', 'b pharmacy cutoff', 'b pharmacy key dates', 'b pharmacy leet 2025', 'b pharmacy leet 2026', 'b pharmacy leet 2027']
},
{
type: 'page',
title: 'B. Pharmacy LEET Key Dates 2026-27',
url: `${basePath}b-pharmacy-leet-key-dates`,
keywords: ['b pharmacy leet key dates', 'b pharmacy dates', 'bpharmacy key dates', 'b pharmacy important dates', 'b pharmacy leet exam date 2026', 'haryana b pharmacy leet schedule', 'd pharmacy lateral entry dates']
},
{
type: 'page',
title: 'B. Pharmacy LEET Sample Papers',
url: `${basePath}b-pharmacy-leet-sample-paper`,
keywords: ['b pharmacy leet sample paper', 'bpharmacy leet sample paper', 'b pharmacy sample paper', 'bpharmacy sample paper', 'b pharmacy leet sample', 'bpharmacy leet sample', 'b pharmacy mock paper', 'bpharmacy mock paper', 'b pharmacy practice paper', 'bpharmacy practice paper', 'sample paper b pharmacy', 'sample paper bpharmacy', 'b pharmacy leet mock', 'bpharmacy leet mock', 'b pharmacy leet papers', 'bpharmacy leet papers', 'b pharmacy sample', 'bpharmacy sample', 'b pharmacy practice', 'bpharmacy practice', 'b pharmacy mock', 'bpharmacy mock', 'b pharmacy leet pyq', 'b pharmacy leet previous year']
},
{
type: 'page',
title: 'LEET Preparation Guide',
url: `${basePath}leet-preparation-guide`,
keywords: ['leet preparation guide', 'leet preparation', 'hsbte leet preparation', 'haryana leet preparation', 'leet exam preparation', 'leet study plan', 'leet preparation tips', 'leet preparation strategy', 'leet preparation material', 'leet exam tips', 'leet study guide', 'btech leet preparation', 'b pharmacy leet preparation', 'leet preparation 2025', 'leet preparation 2026', 'leet preparation books', 'leet mock test', 'leet practice papers']
},
{
type: 'page',
title: 'LEET Counselling Information',
url: `${basePath}leet-counselling`,
keywords: ['leet counselling', 'hsbte leet counselling', 'haryana leet counselling', 'leet counselling process', 'leet seat allotment', 'leet counselling dates', 'leet counselling registration', 'leet counselling fee', 'leet document verification', 'leet counselling rounds', 'leet choice filling', 'leet counselling guidelines', 'btech leet counselling', 'b pharmacy leet counselling', 'leet counselling 2025', 'leet counselling 2026']
},
{
type: 'page',
title: 'Haryana Diploma Information',
url: `${basePath}haryana-diploma-info`,
keywords: ['haryana diploma', 'hsbte diploma', 'haryana diploma engineering', 'hsbte diploma courses', 'haryana polytechnic', 'diploma engineering haryana', 'diploma admission haryana', 'diploma syllabus haryana', 'diploma branches haryana', 'diploma engineering information', 'haryana technical education', 'diploma career', 'diploma to degree', 'lateral entry diploma', 'haryana diploma colleges']
},
{
type: 'page',
title: 'LEET Overview',
url: `${basePath}leet-overview`,
keywords: ['leet overview', 'hsbte leet overview', 'haryana leet overview', 'what is leet', 'leet exam details', 'leet information', 'btech leet overview', 'b pharmacy leet overview']
},
{
type: 'page',
title: 'LEET Sample Papers',
url: `${basePath}leet-sample-paper`,
keywords: ['leet sample papers', 'haryana leet sample papers', 'leet papers', 'leet practice papers', 'leet mock papers', 'leet model papers', 'btech leet sample papers', 'b pharmacy leet sample papers']
},
{
type: 'page',
title: 'LEET Key Dates Hub',
url: `${basePath}leet-tentative-dates`,
keywords: ['leet tentative dates', 'leet key dates', 'haryana leet schedule', 'leet exam dates', 'leet counselling dates', 'haryana leet 2026 dates', 'btech leet key dates', 'b pharmacy leet key dates']
},
{
type: 'page',
title: 'Haryana LEET Cutoff Analytics',
url: `${basePath}cutoff-analytics`,
keywords: ['cutoff analytics', 'haryana leet cutoff analytics', 'btech cutoff analytics', 'leet rank analysis', 'opening closing rank', 'cutoff trends']
},
{
type: 'page',
title: 'Haryana LEET College Comparison',
url: `${basePath}college-comparison`,
keywords: ['college comparison', 'haryana leet college comparison', 'ymca vs dcrust', 'best college for leet', 'compare leet colleges']
},
{
type: 'page',
title: 'Last Year LEET Cutoff',
url: `${basePath}last-year-cutoff`,
keywords: ['last year leet cutoff', 'hsbte leet last year cutoff', 'leet previous cutoff', 'haryana leet cutoff', 'mock rank cutoff', 'institute wise leet cutoff']
},
{
type: 'page',
title: 'Haryana LEET 2026 – Complete Guide',
url: `${basePath}haryana-leet-2026`,
keywords: ['haryana leet 2026', 'leet 2026', 'haryana leet 2026 guide', 'haryana leet 2026 exam', 'haryana leet 2026 syllabus', 'haryana leet 2026 pyq', 'haryana leet 2026 sample papers', 'haryana leet 2026 counselling']
},
{
type: 'page',
title: 'Haryana LEET 2026 Syllabus',
url: `${basePath}haryana-leet-syllabus`,
keywords: ['haryana leet 2026 syllabus', 'leet 2026 syllabus', 'btech leet syllabus 2026', 'b pharmacy leet syllabus 2026', 'haryana leet syllabus pdf']
},
{
type: 'page',
title: 'Haryana LEET 2026 Exam Pattern',
url: `${basePath}haryana-leet-exam-pattern`,
keywords: ['haryana leet 2026 exam pattern', 'leet 2026 exam pattern', 'haryana leet paper pattern', 'btech leet exam pattern', 'b pharmacy leet exam pattern']
},
{
type: 'page',
title: 'Haryana LEET 2026 Eligibility',
url: `${basePath}haryana-leet-eligibility`,
keywords: ['haryana leet 2026 eligibility', 'leet eligibility', 'btech leet eligibility', 'b pharmacy leet eligibility', 'haryana leet qualification']
},
{
type: 'page',
title: 'Haryana LEET 2026 Counselling',
url: `${basePath}haryana-leet-counselling`,
keywords: ['haryana leet 2026 counselling', 'leet counselling haryana', 'hstes leet counselling', 'leet 2026 choice filling', 'leet 2026 seat allotment']
},
{
type: 'page',
title: 'Haryana LEET Cutoff – Rank vs College',
url: `${basePath}haryana-leet-cutoff`,
keywords: ['haryana leet cutoff', 'leet rank vs college', 'leet previous year cutoff', 'haryana leet 2026 cutoff insight']
},
{
type: 'page',
title: 'Haryana LEET Colleges Overview',
url: `${basePath}haryana-leet-colleges`,
keywords: ['haryana leet colleges', 'btech leet colleges haryana', 'b pharmacy leet colleges', 'haryana leet participating institutes']
},
{
type: 'page',
title: 'HSBTE Result Check',
url: `${basePath}hsbte-result`,
keywords: ['result', 'hsbte result', 'diploma result', 'check result', 'haryana diploma result']
},
{
type: 'page',
title: 'College Predictor',
url: `${basePath}college-predictor`,
keywords: ['predictor', 'college predictor', 'leet predictor', 'rank vs college', 'admission predictor']
},
{
type: 'page',
title: 'Rank Analysis',
url: `${basePath}rank-analysis`,
keywords: ['rank', 'rank analysis', 'leet rank', 'cutoff analysis', 'rank vs marks']
},
{
type: 'page',
title: 'LEET Study Plan',
url: `${basePath}study-plan`,
keywords: ['study plan', 'preparation strategy', 'leet study plan', 'exam schedule']
},
{
type: 'page',
title: 'Contact Us',
url: `${basePath}contact`,
keywords: ['contact', 'support', 'help', 'email', 'about us']
}
);
for (let i = 1; i <= 11; i++) {
searchIndex.push({
type: 'page',
title: `BTech LEET Sample Paper ${i}`,
url: `${basePath}btech-sample-paper-${i}`,
keywords: [
`btech sample paper ${i}`,
`btech leet sample paper ${i}`,
`btech mock paper ${i}`,
`btech practice paper ${i}`,
'btech leet',
'btech sample',
'btech leet sample',
'btech leet pyq',
'btech previous year'
]
});
}
[1, 2, 3, 4, 5, 6, 11].forEach(i => {
searchIndex.push({
type: 'page',
title: `B. Pharmacy LEET Sample Paper ${i}`,
url: `${basePath}Bpharma-sample-paper-${i}`,
keywords: [
`b pharmacy sample paper ${i}`,
`bpharmacy sample paper ${i}`,
`b pharmacy leet sample paper ${i}`,
`bpharmacy leet sample paper ${i}`,
`b pharmacy mock paper ${i}`,
`bpharmacy mock paper ${i}`,
'b pharmacy leet',
'bpharmacy leet',
'b pharmacy sample',
'bpharmacy sample',
'b pharmacy leet pyq',
'b pharmacy previous year'
]
});
});
const dbmSpecializations = [
{ url: 'dbm-5-retail', title: 'DBM 5th Semester - Retail', keywords: ['dbm', 'retail', '5th semester', 'business management', 'retail management'] },
{ url: 'dbm-5-mr', title: 'DBM 5th Semester - Marketing', keywords: ['dbm', 'marketing', '5th semester', 'business management', 'marketing management'] },
{ url: 'dbm-5-hr', title: 'DBM 5th Semester - HR', keywords: ['dbm', 'hr', 'human resources', '5th semester', 'business management', 'hr management'] },
{ url: 'dbm-4-retail', title: 'DBM 4th Semester - Retail', keywords: ['dbm', 'retail', '4th semester', 'business management', 'retail management'] },
{ url: 'dbm-4-mr', title: 'DBM 4th Semester - Marketing', keywords: ['dbm', 'marketing', '4th semester', 'business management', 'marketing management'] },
{ url: 'dbm-4-hr', title: 'DBM 4th Semester - HR', keywords: ['dbm', 'hr', 'human resources', '4th semester', 'business management', 'hr management'] }
];
dbmSpecializations.forEach(spec => {
searchIndex.push({
type: 'semester',
title: spec.title,
url: `${basePath}${spec.url}`,
keywords: [...spec.keywords, 'dbm pyq', 'dbm previous year', 'dbm question paper']
});
});
isIndexLoaded = true;
localStorage.setItem(CACHE_KEY, JSON.stringify(searchIndex));
console.log(`Search index loaded with ${searchIndex.length} items (branches and semesters). Subjects loading in background...`);

// Re-save index periodically as background subjects load
let backgroundSaveTimer = null;
const saveIndexWithDelay = () => {
    if (backgroundSaveTimer) clearTimeout(backgroundSaveTimer);
    backgroundSaveTimer = setTimeout(() => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(searchIndex));
    }, 2000);
};
}
function handleSearchInput(e) {
const query = e.target.value.trim();
if (query.length < 1) {
hideResults();
return;
}
if (searchTimer) {
clearTimeout(searchTimer);
}
searchTimer = setTimeout(() => {
performSearch(query);
}, 160);
}
function handleSearchSubmit(e) {
e.preventDefault();
const query = document.getElementById('search-input').value.trim();
if (query.length < 2) {
return;
}
performSearch(query);
const firstResult = document.querySelector('.search-result-item');
if (firstResult) {
firstResult.focus();
}
}
function performSearch(query) {
if (!query || query.trim().length < 1) {
hideResults();
return;
}
let queryLower = query.toLowerCase().trim();
const synonymReplacements = [
{ pattern: /\bcse\b/g, replacement: 'computer' },
{ pattern: /\bcs\b/g, replacement: 'computer' },
{ pattern: /\bme\b/g, replacement: 'mechanical' },
{ pattern: /\bece\b/g, replacement: 'ece' },
{ pattern: /\bec\b/g, replacement: 'electrical' },
{ pattern: /\bmlt\b/g, replacement: 'medical laboratory technology' }
];
synonymReplacements.forEach(rule => {
queryLower = queryLower.replace(rule.pattern, rule.replacement);
});
const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
const results = [];
if (!isIndexLoaded) {
buildSearchIndex().catch(err => console.error('Error building search index:', err));
}
if (searchIndex.length === 0) {
const searchResults = document.getElementById('search-results');
if (searchResults) {
searchResults.innerHTML = '<div class="search-result-item">Loading search index...</div>';
searchResults.style.display = 'block';
}
setTimeout(() => {
if (searchIndex.length > 0) {
performSearch(query);
}
}, 500);
return;
}
const isSemesterSearch = /^\d+(st|nd|rd|th)?\s*(semester|sem)?$|semester\s*\d+|sem\s*\d+/i.test(query);
const isLeetSearch = /leet|sample\s*paper|mock\s*paper|practice\s*paper/i.test(queryLower);
const isBranchSearch = !isSemesterSearch && !isLeetSearch && queryWords.length <= 2;
const isSubjectSearch = queryWords.length >= 2 || (!isSemesterSearch && !isBranchSearch && !isLeetSearch);
searchIndex.forEach(item => {
let score = 0;
const titleLower = item.title.toLowerCase();
const titleWords = titleLower.split(/\s+/);
if (item.type === 'subject') {
if (!isSubjectSearch && !isBranchSearch) {
return;
}
const subjectNameLower = (item.subjectName || '').toLowerCase();
const branchNameLower = (item.branchName || '').toLowerCase();
if (subjectNameLower === queryLower) {
score = 100;
}
else if (subjectNameLower.startsWith(queryLower)) {
score = 95;
}
else if (new RegExp(`\\b${queryLower}\\b`).test(subjectNameLower)) {
score = 90;
}
else if (subjectNameLower.includes(queryLower)) {
score = 85;
}
else {
const subjectWords = subjectNameLower.split(/[\s&–\-()]+/).filter(w => w.length > 0);
const matchingWords = queryWords.filter(qw =>
subjectWords.some(sw => sw.startsWith(qw) || sw === qw || sw.includes(qw))
);
if (matchingWords.length === queryWords.length && queryWords.length > 0) {
score = 80;
}
else if (matchingWords.length > 0) {
score = 75;
}
else if (branchNameLower.includes(queryLower) || queryLower.includes(branchNameLower)) {
score = 70;
}
else {
const keywordMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
if (kwLower === queryLower) return true;
if (new RegExp(`\\b${queryLower}\\b`).test(kwLower)) return true;
if (new RegExp(`\\b${kwLower}\\b`).test(queryLower)) return true;
if (kwLower.includes(queryLower) || queryLower.includes(kwLower)) return true;
return false;
});
if (keywordMatch) {
score = 65;
}
else {
const wordMatches = queryWords.filter(qw =>
item.keywords.some(kw => kw.toLowerCase().includes(qw))
);
if (wordMatches.length > 0) {
score = 55;
}
}
}
}
}
else if (item.type === 'branch') {
if (isSemesterSearch) {
return;
}
if (titleLower === queryLower) {
score = 100;
}
else if (titleLower.startsWith(queryLower)) {
score = 98;
}
else if (new RegExp(`\\b${queryLower}\\b`).test(titleLower)) {
score = 95;
}
else if (titleLower.includes(queryLower)) {
score = 90;
}
else {
const branchWords = titleLower.split(/\s+/);
const matchingWords = queryWords.filter(qw =>
branchWords.some(bw => bw.startsWith(qw) || bw === qw || bw.includes(qw))
);
if (matchingWords.length === queryWords.length && queryWords.length > 0) {
score = 85;
}
else if (matchingWords.length > 0) {
score = 80;
}
else {
const keywordMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
if (kwLower === queryLower) return true;
if (new RegExp(`\\b${queryLower}\\b`).test(kwLower)) return true;
if (new RegExp(`\\b${kwLower}\\b`).test(queryLower)) return true;
if (kwLower.includes(queryLower) || queryLower.includes(kwLower)) return true;
return false;
});
if (keywordMatch) {
score = 75;
}
}
}
}
else if (item.type === 'semester') {
if (isSubjectSearch && !isBranchSearch) {
const branchMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
return queryWords.some(qw => kwLower.includes(qw) || qw.includes(kwLower));
});
if (!branchMatch) {
return;
}
}
const semesterMatch = titleLower.match(/(\d+)(st|nd|rd|th)?\s*semester|semester\s*(\d+)/);
const querySemesterMatch = queryLower.match(/(\d+)(st|nd|rd|th)?|semester\s*(\d+)|sem\s*(\d+)/);
if (titleLower === queryLower) {
score = 100;
}
else if (semesterMatch && querySemesterMatch) {
const semNum = semesterMatch[1] || semesterMatch[3];
const queryNum = querySemesterMatch[1] || querySemesterMatch[3] || querySemesterMatch[4];
if (semNum === queryNum) {
score = 95;
}
}
else if (titleLower.startsWith(queryLower)) {
score = 90;
}
else if (new RegExp(`\\b${queryLower}\\b`).test(titleLower)) {
score = 85;
}
else if (titleLower.includes(queryLower)) {
score = 75;
}
else {
const branchMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
return queryWords.some(qw => {
if (qw === 'semester' || qw === 'sem' || /^\d+/.test(qw)) return false;
return kwLower.includes(qw) || qw.includes(kwLower);
});
});
if (branchMatch) {
score = 70;
}
else {
const keywordMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
if (kwLower === queryLower) return true;
if (new RegExp(`\\b${queryLower}\\b`).test(kwLower)) return true;
if (kwLower.includes(queryLower) || queryLower.includes(kwLower)) return true;
return false;
});
if (keywordMatch) {
score = 60;
}
}
}
}
else {
const isLeetPage = item.keywords && item.keywords.some(kw => kw.includes('leet'));
const isSamplePaperPage = item.keywords && item.keywords.some(kw => kw.includes('sample'));
if (titleLower === queryLower) {
score = 100;
}
else if (isLeetSearch && isLeetPage) {
const exactKeywordMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
if (kwLower === queryLower) return true;
if (new RegExp(`\\b${kwLower}\\b`).test(queryLower)) return true;
if (new RegExp(`\\b${queryLower}\\b`).test(kwLower)) return true;
return false;
});
if (exactKeywordMatch) {
score = 95;
}
else {
const matchingKeywords = item.keywords.filter(kw => {
const kwLower = kw.toLowerCase();
return queryWords.some(qw => {
if (kwLower === qw) return true;
if (kwLower.includes(qw)) return true;
if (qw.includes(kwLower)) return true;
if (new RegExp(`\\b${qw}\\b`).test(kwLower)) return true;
return false;
});
});
if (matchingKeywords.length === queryWords.length && queryWords.length > 0) {
score = 90;
}
else if (matchingKeywords.length > 0) {
score = 85;
}
else if (titleLower.includes(queryLower) || queryLower.includes('leet')) {
score = 80;
}
}
}
else if ((queryLower.includes('sample') || queryLower.includes('mock') || queryLower.includes('practice')) && isSamplePaperPage) {
const sampleMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
return kwLower.includes('sample') || kwLower.includes('mock') || kwLower.includes('practice');
});
if (sampleMatch) {
const branchMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
return queryWords.some(qw => {
if (qw === 'sample' || qw === 'paper' || qw === 'mock' || qw === 'practice') return false;
return kwLower.includes(qw) || qw.includes(kwLower);
});
});
if (branchMatch) {
score = 95;
}
else {
score = 85;
}
}
else {
score = 70;
}
}
else if (titleLower.includes(queryLower)) {
score = 50;
}
else if (item.keywords) {
const keywordMatch = item.keywords.some(kw => {
const kwLower = kw.toLowerCase();
if (kwLower === queryLower) return true;
if (new RegExp(`\\b${queryLower}\\b`).test(kwLower)) return true;
if (kwLower.includes(queryLower) || queryLower.includes(kwLower)) return true;
return false;
});
if (keywordMatch) {
score = 45;
}
}
}
if (score > 0) {
results.push({ ...item, score });
}
});
let typePriority;
if (isLeetSearch) {
typePriority = { page: 5, branch: 3, subject: 2, semester: 1 };
} else if (isSemesterSearch) {
typePriority = { semester: 5, branch: 4, subject: 3, page: 1 };
} else if (isBranchSearch) {
typePriority = { branch: 5, semester: 4, subject: 3, page: 1 };
} else if (isSubjectSearch) {
typePriority = { subject: 5, branch: 4, semester: 3, page: 1 };
} else {
typePriority = { branch: 5, subject: 4, semester: 3, page: 1 };
}
results.sort((a, b) => {
if (b.score !== a.score) return b.score - a.score;
return (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
});
const maxResults = 25;
displayResults(results.slice(0, maxResults), query);
}
function displayResults(results, query) {
const searchResults = document.getElementById('search-results');
if (!searchResults) return;
if (results.length === 0) {
searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
searchResults.style.display = 'block';
return;
}
const html = results.map((item, index) => {
const icon = getIconForType(item.type);
const highlightedTitle = highlightMatch(item.title, query);
return `
<a href="${item.url}" class="search-result-item" role="listitem" tabindex="0" data-index="${index}">
<span class="search-result-icon">${icon}</span>
<span class="search-result-title">${highlightedTitle}</span>
<span class="search-result-type">${item.type}</span>
</a>
`;
}).join('');
searchResults.innerHTML = html;
searchResults.style.display = 'block';
searchResults.querySelectorAll('.search-result-item').forEach(item => {
item.addEventListener('click', (e) => {
e.preventDefault();
window.location.href = item.getAttribute('href');
});
});
}
function getIconForType(type) {
const icons = {
branch: '🏛️',
semester: '📚',
subject: '📖',
page: '📄'
};
return icons[type] || '📄';
}
function highlightMatch(text, query) {
if (!query) return text;
const regex = new RegExp(`(${query})`, 'gi');
return text.replace(regex, '<mark>$1</mark>');
}
function hideResults() {
const searchResults = document.getElementById('search-results');
if (searchResults) {
searchResults.style.display = 'none';
}
}
function handleKeydown(e) {
const searchResults = document.getElementById('search-results');
if (!searchResults || searchResults.style.display === 'none') return;
const items = Array.from(searchResults.querySelectorAll('.search-result-item'));
const currentIndex = items.findIndex(item => item === document.activeElement);
if (e.key === 'ArrowDown') {
e.preventDefault();
const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
items[nextIndex].focus();
} else if (e.key === 'ArrowUp') {
e.preventDefault();
const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
items[prevIndex].focus();
} else if (e.key === 'Escape') {
hideResults();
document.getElementById('search-input').blur();
}
}
function tryInitSearch() {
const searchInput = document.getElementById('search-input');
if (searchInput) {
initSearch();
return true;
}
return false;
}
if (tryInitSearch()) {
} else {
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
if (!tryInitSearch()) {
let attempts = 0;
const maxAttempts = 20;
const interval = setInterval(() => {
attempts++;
if (tryInitSearch() || attempts >= maxAttempts) {
clearInterval(interval);
}
}, 100);
}
});
} else {
let attempts = 0;
const maxAttempts = 20;
const interval = setInterval(() => {
attempts++;
if (tryInitSearch() || attempts >= maxAttempts) {
clearInterval(interval);
}
}, 100);
}
document.addEventListener('partialsLoaded', () => {
setTimeout(tryInitSearch, 100);
});
}
})();
