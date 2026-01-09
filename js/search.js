/**
 * Search functionality for HSBTE PYQ website
 * Searches branches, semesters, and subjects by name
 */

(function() {
  'use strict';

  let searchIndex = [];
  let isIndexLoaded = false;

  /**
   * Initialize search functionality
   */
  function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchForm = document.querySelector('.search-form');
    const searchResults = document.getElementById('search-results');

    if (!searchInput || !searchForm || !searchResults) {
      console.warn('Search elements not found');
      return;
    }

    console.log('Initializing search...');

    // Build search index immediately (async, but don't wait - it will load in background)
    buildSearchIndex().catch(err => {
      console.error('Error building search index:', err);
    });

    // Event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchForm.addEventListener('submit', handleSearchSubmit);
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 1) {
        performSearch(searchInput.value.trim());
      }
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchForm.contains(e.target)) {
        hideResults();
      }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', handleKeydown);
    
    console.log('Search initialized successfully');
  }

  /**
   * Extract subjects from HTML file
   */
  async function extractSubjectsFromHtml(htmlFilePath) {
    try {
      // Try to fetch the file
      const response = await fetch(htmlFilePath);
      if (!response.ok) {
        // Silently fail - file might not exist or path might be wrong
        // Don't spam console with warnings for expected 404s
        return [];
      }
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const subjects = [];
      
      // Find all subject sections - look for sections with IDs (these are individual subjects)
      doc.querySelectorAll('.computer-1-semester[id]').forEach(section => {
        const sectionId = section.id;
        const heading = section.querySelector('.semester-heading');
        if (heading) {
          const subjectName = heading.textContent.trim();
          
          // Skip main semester heading (contains "Semester" and "Previous Year")
          if (subjectName.toLowerCase().includes('semester') && 
              subjectName.toLowerCase().includes('previous year')) {
            return;
          }
          
          // Check if it's a subject section (has session buttons or "Select exam session" text)
          const subtext = section.querySelector('.semester-subtext');
          const hasSessionButtons = section.querySelector('.semester-subject-card');
          
          if (subtext && (subtext.textContent.includes('Select exam session') || 
              subtext.textContent.includes('exam session'))) {
            subjects.push({ id: sectionId, name: subjectName });
          } else if (hasSessionButtons && sectionId) {
            // Also include if it has session buttons and an ID
            subjects.push({ id: sectionId, name: subjectName });
          }
        }
      });
      
      return subjects;
    } catch (error) {
      // Silently handle errors - file might not exist or be accessible
      return [];
    }
  }

  /**
   * Build search index from all HTML pages
   */
  async function buildSearchIndex() {
    if (isIndexLoaded) return;

    // Determine base path - handle different page locations
    const currentPath = window.location.pathname;
    let basePath = './html/'; // Default: assume we're in root, need to go to html/
    
    // If we're already in the html/ directory, use relative path (same directory)
    // Check if current path contains /html/ (meaning we're viewing a page inside html/)
    // Examples: 
    //   /html/hsbte-pyq.html -> contains '/html/' -> use './'
    //   /index.html -> doesn't contain '/html/' -> use './html/'
    //   / -> doesn't contain '/html/' -> use './html/'
    if (currentPath.indexOf('/html/') !== -1) {
      basePath = './';
    }

    // Define all branches and their semesters
    const branches = [
      { name: 'Agriculture Engineering', url: 'Agriculture.html', semesters: [1, 2, 3, 4, 5], key: 'agriculture' },
      { name: 'Architectural Assistantship', url: 'Architectural-Assistantship.html', semesters: [1, 2, 3, 4, 5, 6], key: 'architectural' },
      { name: 'Automobile Engineering', url: 'Automobile.html', semesters: [1, 2, 3, 4, 5, 6], key: 'automobile' },
      { name: 'Automation & Robotics', url: 'Automation.html', semesters: [1, 2, 3, 4, 5, 6], key: 'automation' },
      { name: 'AI & ML', url: 'ai-ml.html', semesters: [1, 2, 3, 4, 5, 6], key: 'ai-ml' },
      { name: 'Chemical Engineering', url: 'Chemical.html', semesters: [1, 2, 3, 4, 5, 6], key: 'chemical' },
      { name: 'Civil Engineering', url: 'civil.html', semesters: [1, 2, 3, 4, 5, 6], key: 'civil' },
      { name: 'Computer Engineering', url: 'computer-pyq.html', semesters: [1, 2, 3, 4, 5, 6], key: 'computer' },
      { name: 'DBM', url: 'dbm.html', semesters: [1, 2, 3, 4, 5], key: 'dbm' },
      { name: 'ECE', url: 'ece.html', semesters: [1, 2, 3, 4, 5, 6], key: 'ece' },
      { name: 'Electrical Engineering', url: 'Electrical-Engineering.html', semesters: [1, 2, 3, 4, 5, 6], key: 'electrical' },
      { name: 'Fashion Design', url: 'Fashion-Design.html', semesters: [1, 2, 3, 4, 5, 6], key: 'fashion-design' },
      { name: 'Fashion Technology', url: 'Fashion-Technology.html', semesters: [1, 2, 3, 4, 5, 6], key: 'fashion-technology' },
      { name: 'Food Technology', url: 'food.html', semesters: [1, 2, 3, 4, 5, 6], key: 'food' },
      { name: 'Hotel Management', url: 'Hotel-Management.html', semesters: [1, 2, 3, 4, 5], key: 'hotel' },
      { name: 'Instrumentation & Control', url: 'Instrumentation-&-Control.html', semesters: [1, 2, 3, 4, 5, 6], key: 'instrumentation' },
      { name: 'Library & Information Science', url: 'Library.html', semesters: [1, 2, 3, 4, 5], key: 'library' },
      { name: 'Mechanical Engineering', url: 'mech.html', semesters: [1, 2, 3, 4, 5, 6], key: 'mechanical' },
      { name: 'Medical Electronics', url: 'Medical-Electronics.html', semesters: [1, 2, 3, 4, 5], key: 'medical-electronics' },
      { name: 'Medical Lab Technology', url: 'Medical-Laboratory-Technology.html', semesters: [1, 2, 3, 4], key: 'medical-lab' },
      { name: 'Office Management', url: 'Office-Management.html', semesters: [1, 2, 3, 4, 5], key: 'office' },
      { name: 'Plastic Technology', url: 'Plastic.html', semesters: [1, 2, 3, 4, 5, 6], key: 'plastic' },
      { name: 'Textile Design', url: 'Textile-Design.html', semesters: [1, 2, 3, 4, 5, 6], key: 'textile-design' },
      { name: 'Textile Processing', url: 'Textile-Processing.html', semesters: [1, 2, 3, 4, 5, 6], key: 'textile-processing' },
      { name: 'Textile Technology', url: 'Textile-Technology.html', semesters: [1, 2, 3, 4, 5, 6], key: 'textile-technology' },
      { name: 'Ceramic Engineering', url: 'Ceramic.html', semesters: [1, 2, 3, 4, 5], key: 'ceramic' },
      { name: 'Advance Diploma', url: 'Adv-Diploma.html', semesters: [1, 2, 3, 4], key: 'adv-diploma' },
      { name: 'FAA', url: 'FAA.html', semesters: [1, 2, 3, 4, 5], key: 'faa' },
      { name: 'D Pharmacy', url: 'd-pharmacy.html', semesters: [1, 2], key: 'd-pharmacy' } 

    ];

    // Build index - Add branches and semesters first (immediate)
    branches.forEach(branch => {
      // Add branch
      searchIndex.push({
        type: 'branch',
        title: branch.name,
        url: `${basePath}${branch.url}`,
        keywords: [branch.name.toLowerCase(), ...branch.name.split(' ').map(w => w.toLowerCase())]
      });

      // Add semesters immediately (don't wait for subjects)
      branch.semesters.forEach(sem => {
        const semNum = sem === 1 ? '1st' : sem === 2 ? '2nd' : sem === 3 ? '3rd' : `${sem}th`;
        
        // Generate correct URL based on branch and semester
        let semesterUrl;
        if (branch.key === 'computer') {
          // Special case: computer-1-semester.html, computer-pyq-2-semester.html, etc.
          if (sem === 1) {
            semesterUrl = `${basePath}computer-1-semester.html`;
          } else {
            semesterUrl = `${basePath}computer-pyq-${sem}-semester.html`;
          }
        } else {
          // For other branches: BranchName-1.html, BranchName-2.html, etc.
          semesterUrl = `${basePath}${branch.url.replace('.html', `-${sem}.html`)}`;
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
      
      // Load subjects asynchronously (don't wait)
      branch.semesters.forEach(sem => {
        const semNum = sem === 1 ? '1st' : sem === 2 ? '2nd' : sem === 3 ? '3rd' : `${sem}th`;
        let semesterUrl;
        if (branch.key === 'computer') {
          if (sem === 1) {
            semesterUrl = `${basePath}computer-1-semester.html`;
          } else {
            semesterUrl = `${basePath}computer-pyq-${sem}-semester.html`;
          }
        } else {
          semesterUrl = `${basePath}${branch.url.replace('.html', `-${sem}.html`)}`;
        }
        
        // Extract subjects asynchronously (add to index when ready)
        extractSubjectsFromHtml(semesterUrl).then(subjects => {
          subjects.forEach(subject => {
            const subjectWords = subject.name.split(/[\s&–\-()]+/).filter(w => w.length > 0);
            const keywords = [
              subject.name.toLowerCase(),
              ...subjectWords.map(w => w.toLowerCase()),
              ...subjectWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')),
              branch.name.toLowerCase(),
              `${semNum} semester`.toLowerCase(),
              `semester ${sem}`.toLowerCase(),
              ...branch.name.split(' ').map(w => w.toLowerCase())
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
        }).catch(() => {
          // Silently handle errors - file might not exist or be accessible
          // This is expected for some files
        });
      });
    });

    // Add special pages
    searchIndex.push(
      { type: 'page', title: 'HSBTE PYQ', url: `${basePath}hsbte-pyq.html`, keywords: ['hsbte', 'pyq', 'previous year', 'question papers', 'question paper'] },
      { type: 'page', title: 'Home', url: `${basePath}index.html`, keywords: ['home', 'main', 'index', 'homepage'] },
      // LEET pages with comprehensive keywords
      { 
        type: 'page', 
        title: 'Haryana LEET', 
        url: `${basePath}haryanaleet.html`, 
        keywords: ['leet', 'haryana leet', 'lateral entry', 'haryana', 'lateral entry engineering test', 'haryana lateral entry'] 
      },
      { 
        type: 'page', 
        title: 'BTech LEET Information', 
        url: `${basePath}btech-leet.html`, 
        keywords: ['btech leet', 'btech', 'b.tech leet', 'b tech leet', 'btech lateral entry', 'engineering leet', 'leet btech', 'btech lateral', 'btech information', 'btech syllabus', 'btech exam pattern', 'btech cutoff', 'btech key dates'] 
      },
      { 
        type: 'page', 
        title: 'BTech LEET Sample Papers', 
        url: `${basePath}btech-leet-sample-paper.html`, 
        keywords: ['btech leet sample paper', 'btech sample paper', 'btech leet sample', 'btech mock paper', 'btech practice paper', 'btech leet practice', 'sample paper btech', 'btech leet mock', 'btech leet papers', 'btech sample', 'btech practice', 'btech mock'] 
      },
      { 
        type: 'page', 
        title: 'B. Pharmacy LEET Information', 
        url: `${basePath}B-Pharmacy-leet.html`, 
        keywords: ['b pharmacy leet', 'bpharmacy leet', 'b.pharmacy leet', 'b pharmacy lateral entry', 'pharmacy leet', 'bpharm leet', 'b pharm leet', 'bpharmacy', 'b pharmacy', 'pharmacy lateral entry', 'b pharmacy information', 'b pharmacy syllabus', 'b pharmacy exam pattern', 'b pharmacy cutoff', 'b pharmacy key dates'] 
      },
      { 
        type: 'page', 
        title: 'B. Pharmacy LEET Sample Papers', 
        url: `${basePath}b-pharmacy-leet-sample-paper.html`, 
        keywords: ['b pharmacy leet sample paper', 'bpharmacy leet sample paper', 'b pharmacy sample paper', 'bpharmacy sample paper', 'b pharmacy leet sample', 'bpharmacy leet sample', 'b pharmacy mock paper', 'bpharmacy mock paper', 'b pharmacy practice paper', 'bpharmacy practice paper', 'sample paper b pharmacy', 'sample paper bpharmacy', 'b pharmacy leet mock', 'bpharmacy leet mock', 'b pharmacy leet papers', 'bpharmacy leet papers', 'b pharmacy sample', 'bpharmacy sample', 'b pharmacy practice', 'bpharmacy practice', 'b pharmacy mock', 'bpharmacy mock'] 
      }
    );

    // Mark as loaded immediately (subjects will be added as they load)
    isIndexLoaded = true;
    console.log(`Search index loaded with ${searchIndex.length} items (branches and semesters). Subjects loading in background...`);
  }

  /**
   * Handle search input
   */
  function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    if (query.length < 1) {
      hideResults();
      return;
    }

    performSearch(query);
  }

  /**
   * Handle search form submit
   */
  function handleSearchSubmit(e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    
    if (query.length < 2) {
      return;
    }

    performSearch(query);
    
    // Focus first result if available
    const firstResult = document.querySelector('.search-result-item');
    if (firstResult) {
      firstResult.focus();
    }
  }

  /**
   * Perform search with intelligent matching
   */
  function performSearch(query) {
    if (!query || query.trim().length < 1) {
      hideResults();
      return;
    }
    
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    const results = [];

    // If index is not loaded yet, start building it
    if (!isIndexLoaded) {
      buildSearchIndex().catch(err => console.error('Error building search index:', err));
    }
    
    // Even if index is still loading, search what we have so far
    if (searchIndex.length === 0) {
      const searchResults = document.getElementById('search-results');
      if (searchResults) {
        searchResults.innerHTML = '<div class="search-result-item">Loading search index...</div>';
        searchResults.style.display = 'block';
      }
      // Try again after a short delay
      setTimeout(() => {
        if (searchIndex.length > 0) {
          performSearch(query);
        }
      }, 500);
      return;
    }

    // Detect search intent
    const isSemesterSearch = /^\d+(st|nd|rd|th)?\s*(semester|sem)?$|semester\s*\d+|sem\s*\d+/i.test(query);
    const isLeetSearch = /leet|sample\s*paper|mock\s*paper|practice\s*paper/i.test(queryLower);
    const isBranchSearch = !isSemesterSearch && !isLeetSearch && queryWords.length <= 2;
    const isSubjectSearch = queryWords.length >= 2 || (!isSemesterSearch && !isBranchSearch && !isLeetSearch);

    // Score and filter results with intelligent matching
    searchIndex.forEach(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const titleWords = titleLower.split(/\s+/);

      // Prioritize subject matches (when searching for subjects)
      if (item.type === 'subject') {
        if (!isSubjectSearch && !isBranchSearch) {
          // Skip subjects if clearly searching for semester or branch
          return;
        }
        
        const subjectNameLower = (item.subjectName || '').toLowerCase();
        const branchNameLower = (item.branchName || '').toLowerCase();
        
        // Exact subject name match - highest priority
        if (subjectNameLower === queryLower) {
          score = 100;
        }
        // Subject name starts with query
        else if (subjectNameLower.startsWith(queryLower)) {
          score = 95;
        }
        // Subject name contains query as whole word
        else if (new RegExp(`\\b${queryLower}\\b`).test(subjectNameLower)) {
          score = 90;
        }
        // Subject name contains query
        else if (subjectNameLower.includes(queryLower)) {
          score = 85;
        }
        // Word-by-word match in subject name
        else {
          const subjectWords = subjectNameLower.split(/[\s&–\-()]+/).filter(w => w.length > 0);
          const matchingWords = queryWords.filter(qw => 
            subjectWords.some(sw => sw.startsWith(qw) || sw === qw || sw.includes(qw))
          );
          
          if (matchingWords.length === queryWords.length && queryWords.length > 0) {
            score = 80;
          }
          // Partial word matches
          else if (matchingWords.length > 0) {
            score = 75;
          }
          // Check if branch name matches (bonus for subject in matching branch)
          else if (branchNameLower.includes(queryLower) || queryLower.includes(branchNameLower)) {
            score = 70;
          }
          // Keyword match in subject (more flexible)
          else {
            const keywordMatch = item.keywords.some(kw => {
              const kwLower = kw.toLowerCase();
              // Exact keyword match
              if (kwLower === queryLower) return true;
              // Keyword contains query as whole word
              if (new RegExp(`\\b${queryLower}\\b`).test(kwLower)) return true;
              // Query contains keyword as whole word
              if (new RegExp(`\\b${kwLower}\\b`).test(queryLower)) return true;
              // Partial match
              if (kwLower.includes(queryLower) || queryLower.includes(kwLower)) return true;
              return false;
            });
            if (keywordMatch) {
              score = 65;
            }
            // Try individual word matching
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
      // Branch matches - highest priority for branch names
      else if (item.type === 'branch') {
        if (isSemesterSearch) {
          // Skip branches if clearly searching for semester
          return;
        }
        
        // Exact match
        if (titleLower === queryLower) {
          score = 100;
        }
        // Branch name starts with query
        else if (titleLower.startsWith(queryLower)) {
          score = 98;
        }
        // Branch name contains query as whole word
        else if (new RegExp(`\\b${queryLower}\\b`).test(titleLower)) {
          score = 95;
        }
        // Branch name contains query
        else if (titleLower.includes(queryLower)) {
          score = 90;
        }
        // Word-by-word match in branch name
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
          // Keyword match (exact word match)
          else {
            const keywordMatch = item.keywords.some(kw => {
              const kwLower = kw.toLowerCase();
              // Exact keyword match
              if (kwLower === queryLower) return true;
              // Keyword contains query as whole word
              if (new RegExp(`\\b${queryLower}\\b`).test(kwLower)) return true;
              // Query contains keyword as whole word
              if (new RegExp(`\\b${kwLower}\\b`).test(queryLower)) return true;
              // Partial match
              if (kwLower.includes(queryLower) || queryLower.includes(kwLower)) return true;
              return false;
            });
            if (keywordMatch) {
              score = 75;
            }
          }
        }
      }
      // Semester matches - prioritize when searching for semesters
      else if (item.type === 'semester') {
        if (isSubjectSearch && !isBranchSearch) {
          // Lower priority if clearly searching for subject
          // But still show if branch matches
          const branchMatch = item.keywords.some(kw => {
            const kwLower = kw.toLowerCase();
            return queryWords.some(qw => kwLower.includes(qw) || qw.includes(kwLower));
          });
          if (!branchMatch) {
            return; // Skip if branch doesn't match
          }
        }
        
        // Extract semester number from title (e.g., "1st", "2nd", "3rd", "4th", "5th", "6th")
        const semesterMatch = titleLower.match(/(\d+)(st|nd|rd|th)?\s*semester|semester\s*(\d+)/);
        const querySemesterMatch = queryLower.match(/(\d+)(st|nd|rd|th)?|semester\s*(\d+)|sem\s*(\d+)/);
        
        // Exact match
        if (titleLower === queryLower) {
          score = 100;
        }
        // Semester number matches
        else if (semesterMatch && querySemesterMatch) {
          const semNum = semesterMatch[1] || semesterMatch[3];
          const queryNum = querySemesterMatch[1] || querySemesterMatch[3] || querySemesterMatch[4];
          if (semNum === queryNum) {
            score = 95;
          }
        }
        // Starts with
        else if (titleLower.startsWith(queryLower)) {
          score = 90;
        }
        // Contains as whole word
        else if (new RegExp(`\\b${queryLower}\\b`).test(titleLower)) {
          score = 85;
        }
        // Contains in title
        else if (titleLower.includes(queryLower)) {
          score = 75;
        }
        // Branch name matches in semester
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
          // Keyword match
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
      // Page matches - enhanced for LEET pages
      else {
        // Check if it's a LEET-related page
        const isLeetPage = item.keywords && item.keywords.some(kw => kw.includes('leet'));
        const isSamplePaperPage = item.keywords && item.keywords.some(kw => kw.includes('sample'));
        
        // Exact title match
        if (titleLower === queryLower) {
          score = 100;
        }
        // LEET-specific matching
        else if (isLeetSearch && isLeetPage) {
          // Check for exact keyword matches
          const exactKeywordMatch = item.keywords.some(kw => {
            const kwLower = kw.toLowerCase();
            // Exact match
            if (kwLower === queryLower) return true;
            // Query contains keyword as whole word
            if (new RegExp(`\\b${kwLower}\\b`).test(queryLower)) return true;
            // Keyword contains query as whole word
            if (new RegExp(`\\b${queryLower}\\b`).test(kwLower)) return true;
            return false;
          });
          
          if (exactKeywordMatch) {
            score = 95;
          }
          // Check for word-by-word matching
          else {
            const matchingKeywords = item.keywords.filter(kw => {
              const kwLower = kw.toLowerCase();
              return queryWords.some(qw => {
                // Exact word match
                if (kwLower === qw) return true;
                // Keyword contains query word
                if (kwLower.includes(qw)) return true;
                // Query word contains keyword
                if (qw.includes(kwLower)) return true;
                // Whole word match
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
            // Partial match for LEET pages
            else if (titleLower.includes(queryLower) || queryLower.includes('leet')) {
              score = 80;
            }
          }
        }
        // Sample paper matching
        else if ((queryLower.includes('sample') || queryLower.includes('mock') || queryLower.includes('practice')) && isSamplePaperPage) {
          const sampleMatch = item.keywords.some(kw => {
            const kwLower = kw.toLowerCase();
            return kwLower.includes('sample') || kwLower.includes('mock') || kwLower.includes('practice');
          });
          
          if (sampleMatch) {
            // Check if branch matches too (btech, b pharmacy, etc.)
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
        // Title contains query
        else if (titleLower.includes(queryLower)) {
          score = 50;
        }
        // Keyword partial match
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

    // Sort by score (highest first), then by type priority based on search intent
    let typePriority;
    if (isLeetSearch) {
      // Prioritize LEET pages when searching for LEET-related terms
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

    // Display results (show more results for better suggestions)
    const maxResults = 25; // Show more results for better suggestions
    displayResults(results.slice(0, maxResults), query);
  }

  /**
   * Display search results
   */
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

    // Add click handlers
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = item.getAttribute('href');
      });
    });
  }

  /**
   * Get icon for result type
   */
  function getIconForType(type) {
    const icons = {
      branch: '🏛️',
      semester: '📚',
      subject: '📖',
      page: '📄'
    };
    return icons[type] || '📄';
  }

  /**
   * Highlight matching text
   */
  function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Hide search results
   */
  function hideResults() {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
      searchResults.style.display = 'none';
    }
  }

  /**
   * Handle keyboard navigation
   */
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

  // Initialize when DOM is ready and header is loaded
  function tryInitSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      initSearch();
      return true;
    }
    return false;
  }

  // Try to initialize immediately
  if (tryInitSearch()) {
    // Successfully initialized
  } else {
    // Wait for DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Try immediately, then retry if needed (for include.js)
        if (!tryInitSearch()) {
          let attempts = 0;
          const maxAttempts = 20; // Try for 2 seconds
          const interval = setInterval(() => {
            attempts++;
            if (tryInitSearch() || attempts >= maxAttempts) {
              clearInterval(interval);
            }
          }, 100);
        }
      });
    } else {
      // DOM already loaded, but header might not be
      let attempts = 0;
      const maxAttempts = 20; // Try for 2 seconds
      const interval = setInterval(() => {
        attempts++;
        if (tryInitSearch() || attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 100);
    }
    
    // Also listen for partialsLoaded event from include.js
    document.addEventListener('partialsLoaded', () => {
      setTimeout(tryInitSearch, 100);
    });
  }
})();
