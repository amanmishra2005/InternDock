const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer = null;

// Domain-tailored, beginner-friendly weekly assignments generator for tech and non-tech domains
function generateWeeklyAssignments(domainName, maxWeeks = 24) {
  const name = domainName.toLowerCase();
  let domainTasks = [];

  if (name.includes("full stack") || name.includes("web development") || name.includes("mern") || name.includes("react") || name.includes("node")) {
    domainTasks = [
      {
        title: "Dev Environment Setup & Portfolio Landing Page",
        desc: "Set up VS Code, Git, and Node.js. Build a responsive personal portfolio landing page with HTML5, CSS flexbox/grid, and a navigation bar.",
        instructions: "1. Create index.html and style.css files.\n2. Add a Hero section with your name, bio, and tech stack skills.\n3. Add a responsive navigation bar and mobile layout.\n4. Push code to your GitHub repo and submit the repository URL below."
      },
      {
        title: "Interactive UI & JavaScript Logic",
        desc: "Add dynamic interactive features to your web app using vanilla JavaScript or React components (e.g. Dark Mode toggle, Form validation, or Task Tracker).",
        instructions: "1. Add event listeners for button clicks and form input validation.\n2. Implement a Dark Mode / Light Mode theme toggle using JavaScript.\n3. Validate contact form fields before submission.\n4. Commit your changes to GitHub and submit your link below."
      },
      {
        title: "Frontend Component State & Public API Integration",
        desc: "Build a dynamic React component that fetches live data from a public REST API (e.g. Weather API, GitHub User Finder, or Quotes API).",
        instructions: "1. Use useState and useEffect to manage component state.\n2. Fetch data using Axios or fetch() API.\n3. Display loading spinners and clean error messages.\n4. Commit your code and submit the GitHub repository URL below."
      },
      {
        title: "Node.js REST API & Capstone Final Submission",
        desc: "Build a simple Express.js REST API with CRUD routes (Create, Read, Update, Delete) and connect it to your frontend app.",
        instructions: "1. Create Express server endpoints (/api/items, GET, POST, DELETE).\n2. Store data in MongoDB or JSON data store.\n3. Test endpoints using Postman or browser.\n4. Submit your completed full-stack project repository link below."
      }
    ];
  } else if (name.includes("python") || name.includes("data science") || name.includes("intelligence") || name.includes("machine learning") || name.includes("ai")) {
    domainTasks = [
      {
        title: "Python Environment & Jupyter Notebook Setup",
        desc: "Install Python 3, Anaconda/Jupyter Notebook or Google Colab. Write basic Python scripts exploring data types, loops, and functions.",
        instructions: "1. Set up your Jupyter Notebook or VS Code environment.\n2. Write Python functions to calculate basic mathematical and string metrics.\n3. Document your notebook cells with Markdown comments.\n4. Export notebook to GitHub and submit the link below."
      },
      {
        title: "Data Cleaning & Pandas Exploration",
        desc: "Load a sample real-world dataset (e.g. Sales, Student Performance, or Weather CSV) into Pandas and perform data cleaning.",
        instructions: "1. Load CSV dataset into a Pandas DataFrame (df = pd.read_csv).\n2. Clean missing values, remove duplicate rows, and rename columns.\n3. Calculate summary statistics (df.describe, groupby).\n4. Commit your notebook to GitHub and submit your link below."
      },
      {
        title: "Data Visualization & Interactive Charts",
        desc: "Create informative data visual charts using Matplotlib, Seaborn, or Plotly to communicate dataset insights.",
        instructions: "1. Generate bar charts, histogram distributions, and correlation heatmaps.\n2. Add clear title labels, axis titles, and color legends.\n3. Summarize key data findings in 3 bullet points.\n4. Push your Jupyter notebook to GitHub and submit below."
      },
      {
        title: "Predictive Model & Final Capstone Notebook",
        desc: "Train a simple beginner-friendly ML model (e.g., Linear Regression, Logistic Regression, or Decision Tree) using scikit-learn.",
        instructions: "1. Split data into Training and Testing sets (train_test_split).\n2. Train scikit-learn model and evaluate Accuracy / R2 Score.\n3. Document model findings and future improvements.\n4. Submit your final project notebook URL below."
      }
    ];
  } else if (name.includes("ui") || name.includes("ux") || name.includes("design") || name.includes("graphic")) {
    domainTasks = [
      {
        title: "Figma Environment Setup & Low-Fidelity Wireframes",
        desc: "Explore Figma interface, frame tools, and draw low-fidelity paper/digital wireframes for a modern mobile app concept.",
        instructions: "1. Create a Figma account and new project board.\n2. Design 3 mobile screens (Home, Details, Profile).\n3. Establish layout grids and content hierarchy.\n4. Share your public Figma link or export project screenshots below."
      },
      {
        title: "Design System, Colors & Typography Scale",
        desc: "Define a modern design system including color palettes, typography hierarchy (headings, body), buttons, and reusable Figma components.",
        instructions: "1. Choose primary, secondary, and background color tokens.\n2. Set up font styles (Inter, Outfit, or Roboto).\n3. Create reusable component variants for buttons and cards.\n4. Submit your Figma design link below."
      },
      {
        title: "High-Fidelity UI & Interactive Prototype",
        desc: "Convert wireframes into high-fidelity UI designs with glassmorphism cards, micro-illustrations, and interactive prototype transitions.",
        instructions: "1. Apply colors, shadows, and smooth radii to wireframe screens.\n2. Connect screens using Figma Smart Animate transitions.\n3. Test user flow from Home screen to Checkout/Details screen.\n4. Share your interactive Figma prototype URL below."
      },
      {
        title: "Final UI/UX Design Case Study & Capstone Presentation",
        desc: "Package your design process into a clean UI/UX case study detailing user research, wireframes, component design, and final prototype.",
        instructions: "1. Assemble a presentation board in Figma or Behance layout.\n2. Document design decisions, color palette, and user flows.\n3. Record a 1-minute video walk-through or PDF presentation.\n4. Submit your final Figma / Portfolio URL below."
      }
    ];
  } else if (name.includes("finance") || name.includes("accounting") || name.includes("taxation")) {
    domainTasks = [
      {
        title: "Financial Statements Overview & P&L Analysis",
        desc: "Analyze income statements, balance sheets, and cash flow statements of a target corporate case study.",
        instructions: "1. Create an Excel/Google Sheet with Income Statement & Balance Sheet line items.\n2. Calculate gross margin, operating margin, and net profit ratio.\n3. Summarize financial findings in a bulleted overview.\n4. Submit your spreadsheet link below."
      },
      {
        title: "Excel Financial Modeling & Ratio Calculation",
        desc: "Build an automated Excel financial model using formulas (VLOOKUP, INDEX/MATCH, SUMIFS, IRR).",
        instructions: "1. Calculate Debt-to-Equity, Current Ratio, and Working Capital.\n2. Build dynamic sensitivity tables in Excel.\n3. Add clean charts visualizing revenue growth YoY.\n4. Upload your spreadsheet or share link below."
      },
      {
        title: "Corporate Valuation & Budget Forecasting",
        desc: "Construct a 3-year DCF (Discounted Cash Flow) valuation or budget forecasting model.",
        instructions: "1. Project revenue growth assumptions and WACC discount rate.\n2. Calculate Terminal Value and Enterprise Value.\n3. Write a 1-page executive valuation memo.\n4. Submit spreadsheet and report link below."
      },
      {
        title: "Final Financial Audit & Capstone Valuation Presentation",
        desc: "Package your financial model, ratio analysis, and valuation into a executive financial presentation.",
        instructions: "1. Format a PDF slide deck summarizing investment recommendations.\n2. Highlight key risk factors and sensitivity metrics.\n3. Present key financial metrics cleanly.\n4. Submit final valuation portfolio link below."
      }
    ];
  } else if (name.includes("human resource") || name.includes("hr")) {
    domainTasks = [
      {
        title: "Job Description Drafting & Candidate Persona Mapping",
        desc: "Draft professional Job Descriptions (JDs) and outline key candidate personas for open corporate roles.",
        instructions: "1. Define required skills, responsibilities, and experience criteria.\n2. Outline company culture highlights and perk summaries.\n3. Create candidate evaluation scorecards.\n4. Submit your JD document link below."
      },
      {
        title: "Talent Sourcing Strategy & Interview Framework",
        desc: "Design structured interview questionnaires and passive talent sourcing workflows on LinkedIn.",
        instructions: "1. Write 5 competency-based behavioral interview questions.\n2. Draft personalized candidate outreach messages.\n3. Outline candidate stage progression flow.\n4. Submit your recruitment framework link below."
      },
      {
        title: "Employee Onboarding Plan & Engagement Strategy",
        desc: "Construct a 30-60-90 day employee onboarding checklist and team engagement initiatives.",
        instructions: "1. Map out Day 1 orientation activities and mentor pairing.\n2. Design employee feedback survey form.\n3. Draft team building event plan.\n4. Submit your onboarding portal guide below."
      },
      {
        title: "HR Policy Manual & Capstone Portfolio",
        desc: "Compile an HR Policy Manual covering leave policies, remote work guidelines, and performance review cycles.",
        instructions: "1. Draft attendance, leave, and conduct policies.\n2. Design quarterly KPI appraisal review templates.\n3. Package into a clean HR Handbook PDF.\n4. Submit your final HR portfolio link below."
      }
    ];
  } else if (name.includes("content") || name.includes("writing") || name.includes("copywriting") || name.includes("media")) {
    domainTasks = [
      {
        title: "Content Strategy Blueprint & Audience Research",
        desc: "Conduct target audience research and build a monthly content calendar blueprint.",
        instructions: "1. Define target reader personas and pain points.\n2. Outline 12 high-intent topic ideas for blogs and social media.\n3. Establish tone-of-voice style guide.\n4. Submit your content strategy sheet link below."
      },
      {
        title: "SEO-Optimized Blog Article Writing",
        desc: "Write a 1,000-word SEO blog article targeting specific long-tail search keywords.",
        instructions: "1. Write catchy H1 title and H2/H3 section headers.\n2. Integrate primary and secondary keywords naturally.\n3. Include meta description and internal link suggestions.\n4. Submit your draft article link below."
      },
      {
        title: "High-Converting Social Media Copywriting",
        desc: "Craft high-converting ad copy, LinkedIn carousels, and email newsletter broadcasts.",
        instructions: "1. Write 3 short-form ad hooks using AIDA framework.\n2. Draft a weekly value-driven email newsletter issue.\n3. Create 5 engaging LinkedIn post captions.\n4. Submit your copy portfolio link below."
      },
      {
        title: "Final Content Editing & Capstone Portfolio Case Study",
        desc: "Assemble your written work into a published digital content portfolio.",
        instructions: "1. Proofread and refine all articles using style rules.\n2. Publish portfolio on Notion, Medium, or Google Docs.\n3. Document keyword rank improvements or engagement metrics.\n4. Submit your final portfolio link below."
      }
    ];
  } else if (name.includes("sales") || name.includes("business development")) {
    domainTasks = [
      {
        title: "Ideal Customer Profile (ICP) & Target Prospect List",
        desc: "Define Ideal Customer Profiles (ICP) and build a target lead list of 25 qualified B2B prospects.",
        instructions: "1. Outline target industry, company size, and decision-maker roles.\n2. Gather prospect names, titles, and company website URLs.\n3. Categorize leads by priority score.\n4. Submit your target lead sheet link below."
      },
      {
        title: "Cold Email Outreach Sequence & Sales Pitch Deck",
        desc: "Draft a 3-step cold email sequence and create a 5-slide B2B sales pitch deck.",
        instructions: "1. Write compelling subject lines and value proposition hooks.\n2. Create a concise pitch deck highlighting problem, solution, and pricing.\n3. Include clear Call-to-Action (CTA) for booking calls.\n4. Submit your pitch deck and outreach copy below."
      },
      {
        title: "CRM Pipeline Management & Objection Handling",
        desc: "Set up a sales CRM pipeline (HubSpot / Notion) and write an objection handling playbook.",
        instructions: "1. Configure deal stages: Prospect, Contacted, Demo, Proposal, Closed.\n2. Write response scripts for top 5 sales objections (Price, Timing, Competitors).\n3. Map out follow-up automation cadence.\n4. Submit your CRM workspace link below."
      },
      {
        title: "Strategic Deal Closure Proposal & BD Capstone",
        desc: "Formulate a commercial enterprise deal proposal and partnership agreement outline.",
        instructions: "1. Draft scope of work, deliverables, and payment terms.\n2. Include ROI projection calculations for clients.\n3. Compile final Business Development portfolio.\n4. Submit your proposal portfolio link below."
      }
    ];
  } else if (name.includes("legal") || name.includes("law")) {
    domainTasks = [
      {
        title: "Legal Research & Precedent Case Summary",
        desc: "Conduct legal research on corporate law topics and summarize key statutory precedents.",
        instructions: "1. Research relevant case law and statutory clauses.\n2. Write a 2-page legal research brief detailing key holdings.\n3. Include proper legal citations and jurisdiction notes.\n4. Submit legal research document link below."
      },
      {
        title: "Commercial Contract Drafting & Clause Analysis",
        desc: "Draft standard commercial agreements (Service Level Agreement, Vendor Agreement).",
        instructions: "1. Draft essential clauses: Scope, Payment, Liability, Termination, Arbitration.\n2. Highlight potential legal risk areas for client.\n3. Format clean contract document.\n4. Submit draft agreement link below."
      },
      {
        title: "Non-Disclosure Agreement (NDA) & Intellectual Property Framework",
        desc: "Draft a mutual NDA and outline IP ownership frameworks for corporate assets.",
        instructions: "1. Define confidential information scope and exclusions.\n2. Draft IP assignment clauses for independent contractors.\n3. Ensure compliance with data privacy regulations.\n4. Submit NDA template link below."
      },
      {
        title: "Corporate Legal Compliance Audit & Capstone Brief",
        desc: "Perform a legal compliance audit for startup incorporation and regulatory filings.",
        instructions: "1. Audit corporate filings, secretarial compliance, and tax registrations.\n2. Create a compliance checklist calendar.\n3. Package into a legal opinion brief.\n4. Submit final legal portfolio link below."
      }
    ];
  } else if (name.includes("healthcare") || name.includes("hospital")) {
    domainTasks = [
      {
        title: "Healthcare Operations & Hospital Structure Orientation",
        desc: "Analyze hospital administrative hierarchies, clinical department workflows, and emergency protocols.",
        instructions: "1. Map out organizational chart of acute hospital departments.\n2. Document patient flow from admission to discharge.\n3. Summarize hospital accreditation standards.\n4. Submit your workflow chart link below."
      },
      {
        title: "Electronic Health Record (EHR) & Patient Intake Management",
        desc: "Study Electronic Health Record (EHR) systems, privacy compliance, and intake optimization.",
        instructions: "1. Design digital patient intake form mockup.\n2. Document data security standards for patient health records.\n3. Outline steps to reduce patient waiting times by 20%.\n4. Submit intake design document below."
      },
      {
        title: "Hospital Quality Audit & Safety Standards",
        desc: "Conduct a mock quality audit evaluating infection control, medical waste disposal, and safety protocols.",
        instructions: "1. Draft a 10-point audit checklist for hospital ward safety.\n2. Identify common operational bottlenecks in emergency rooms.\n3. Propose corrective action recommendations.\n4. Submit quality audit report link below."
      },
      {
        title: "Healthcare Administration & Facility Capstone Project",
        desc: "Formulate a strategic hospital expansion or operational improvement plan.",
        instructions: "1. Outline budget allocation for medical equipment and staffing.\n2. Present patient satisfaction enhancement metrics.\n3. Compile healthcare management capstone deck.\n4. Submit final project link below."
      }
    ];
  } else if (name.includes("supply chain") || name.includes("operations") || name.includes("logistics")) {
    domainTasks = [
      {
        title: "Supply Chain Mapping & Inventory Control Setup",
        desc: "Map end-to-end supply chain stages and establish inventory tracking metrics (EOQ, Safety Stock).",
        instructions: "1. Draw a supply chain diagram from raw material to end consumer.\n2. Calculate Economic Order Quantity (EOQ) for sample SKUs.\n3. Outline ABC inventory classification framework.\n4. Submit supply chain map link below."
      },
      {
        title: "Vendor Selection Matrix & Procurement Strategy",
        desc: "Develop a multi-criteria vendor evaluation matrix and procurement negotiation plan.",
        instructions: "1. Create weighted criteria table: Price, Lead Time, Quality, Reliability.\n2. Score 3 prospective suppliers using sample data.\n3. Draft vendor Service Level Agreement (SLA) terms.\n4. Submit procurement matrix link below."
      },
      {
        title: "Logistics Route Optimization & Bottleneck Analysis",
        desc: "Analyze transportation freight costs, last-mile delivery routes, and warehouse layout optimization.",
        instructions: "1. Evaluate cost per ton-mile across transport modes (Road, Air, Sea).\n2. Design an optimized warehouse picking layout.\n3. Propose 3 strategies to decrease transit delay.\n4. Submit logistics analysis report below."
      },
      {
        title: "Operations Efficiency & Supply Chain Capstone",
        desc: "Construct a lean manufacturing/operations improvement strategy to eliminate waste.",
        instructions: "1. Map out Value Stream (VSM) current vs future state.\n2. Recommend 5S / Kaizen operational improvements.\n3. Present cost savings projections.\n4. Submit final operations portfolio link below."
      }
    ];
  } else if (name.includes("event") || name.includes("public relations") || name.includes("pr")) {
    domainTasks = [
      {
        title: "Event Concept Proposal & Blueprint Design",
        desc: "Design a comprehensive event concept proposal for a corporate summit or product launch.",
        instructions: "1. Define event objectives, target attendee profiles, and theme.\n2. Create event schedule agenda with speaker slots.\n3. Draft venue requirement specifications.\n4. Submit event proposal document below."
      },
      {
        title: "Press Release Drafting & Media Outreach Kit",
        desc: "Draft a official corporate press release and curate a targeted media journalist list.",
        instructions: "1. Write compelling press release headline, dateline, and body copy.\n2. Include executive quotes and media contact details.\n3. Build list of 15 relevant industry publication contacts.\n4. Submit press release kit link below."
      },
      {
        title: "Vendor Budgeting & Event Execution Timeline",
        desc: "Construct a itemized event budget spreadsheet and day-of-event run of show timeline.",
        instructions: "1. Build budget allocating AV, catering, staging, and marketing costs.\n2. Map minute-by-minute run-of-show timeline for event day.\n3. Formulate contingency risk management plan.\n4. Submit event budget spreadsheet below."
      },
      {
        title: "Post-Event ROI Analysis & PR Campaign Presentation",
        desc: "Compile post-event analytics including media coverage impressions, attendee feedback, and ROI.",
        instructions: "1. Calculate total PR impressions and social media reach.\n2. Analyze attendee survey feedback scores.\n3. Assemble a clean PR & Event capstone presentation.\n4. Submit final PR portfolio link below."
      }
    ];
  } else if (name.includes("environmental") || name.includes("sustainability") || name.includes("esg")) {
    domainTasks = [
      {
        title: "Corporate Environmental Impact & ESG Orientation",
        desc: "Conduct an initial environmental impact assessment for a corporate enterprise.",
        instructions: "1. Identify Scope 1, Scope 2, and Scope 3 carbon emission sources.\n2. Evaluate corporate energy and water consumption benchmarks.\n3. Summarize ESG regulatory disclosure frameworks (GRI, SASB).\n4. Submit environmental impact brief below."
      },
      {
        title: "Carbon Footprint Accounting & Resource Audit",
        desc: "Calculate carbon footprint emissions and create a waste reduction audit plan.",
        instructions: "1. Use emission factors to calculate CO2 equivalent metrics.\n2. Propose zero-waste office guidelines and recycling protocols.\n3. Create energy efficiency optimization checklist.\n4. Submit carbon audit spreadsheet below."
      },
      {
        title: "Renewable Energy Integration & Sustainable Strategy",
        desc: "Evaluate solar/wind renewable energy adoption options for facility operations.",
        instructions: "1. Calculate payback period and ROI for solar panel installation.\n2. Design sustainable supply chain sourcing guidelines.\n3. Draft employee green engagement initiative.\n4. Submit sustainability proposal link below."
      },
      {
        title: "Corporate Sustainability Report & ESG Capstone",
        desc: "Compile a professional Corporate Sustainability Report summarizing ESG goals and progress.",
        instructions: "1. Format a PDF ESG report deck with charts and milestones.\n2. Outline 2030 Net-Zero carbon reduction roadmap.\n3. Present key sustainability metrics.\n4. Submit final ESG portfolio link below."
      }
    ];
  } else if (name.includes("biotechnology") || name.includes("life science") || name.includes("bioinformatics")) {
    domainTasks = [
      {
        title: "Scientific Literature Review & Lab Safety Standards",
        desc: "Conduct a comprehensive scientific literature review on recent biotech breakthroughs.",
        instructions: "1. Review 3 peer-reviewed research papers in biotechnology.\n2. Write a 2-page literature synthesis highlighting key findings.\n3. Summarize Biosafety Level (BSL) laboratory compliance rules.\n4. Submit research summary link below."
      },
      {
        title: "Biological Sequence Analysis & Bioinformatics Tools",
        desc: "Utilize online bioinformatics databases (NCBI, UniProt, BLAST) for sequence alignment.",
        instructions: "1. Perform BLAST search for sample DNA / Protein sequence.\n2. Analyze sequence homology and functional domain predictions.\n3. Export alignment results and annotations.\n4. Submit bioinformatics report link below."
      },
      {
        title: "Experimental Protocol Documentation & Data Analysis",
        desc: "Document a standard molecular biology protocol (PCR, Gel Electrophoresis) and analyze sample data.",
        instructions: "1. Write step-by-step Standard Operating Procedure (SOP).\n2. Plot experimental assay data using Python or Excel.\n3. Discuss experimental controls and potential error sources.\n4. Submit protocol document link below."
      },
      {
        title: "Biotech Research Summary & Capstone Presentation",
        desc: "Package your research findings, bioinformatics analysis, and experimental data into a final report.",
        instructions: "1. Assemble a presentation deck detailing biotech project outcomes.\n2. Outline potential clinical or commercial applications.\n3. Format references and figures professionally.\n4. Submit final biotech research portfolio link below."
      }
    ];
  } else {
    domainTasks = [
      {
        title: "Orientation & Workspace Setup",
        desc: `Set up your learning workspace for ${domainName}. Initialize project folders and review fundamental tools.`,
        instructions: `1. Install required tools / software for ${domainName}.\n2. Create a clean project folder and GitHub / Document repository.\n3. Write a starter outline program / document and verify output.\n4. Push initial repository and submit your link below.`
      },
      {
        title: "Core Foundations & Guided Task",
        desc: `Build a guided beginner project demonstrating fundamental concepts and practical skills in ${domainName}.`,
        instructions: `1. Implement core features or practical exercise tasks.\n2. Add clear comments or notes explaining your work.\n3. Test execution or review output accuracy.\n4. Commit your work and submit your link below.`
      },
      {
        title: "Applied Feature Module",
        desc: `Extend your ${domainName} project by adding an applied practical module (e.g. Data persistence, UI polish, or detailed report).`,
        instructions: `1. Add interactive features or modular components.\n2. Handle edge cases and formatting requirements.\n3. Update your project README / Guide with documentation.\n4. Commit changes and submit link below.`
      },
      {
        title: "Final Capstone Project & Mentor Demo",
        desc: `Finalize your ${domainName} capstone project. Polish final presentation, write documentation, and submit for mentor evaluation.`,
        instructions: `1. Ensure all project deliverables run cleanly without errors.\n2. Write a comprehensive README with project description and screenshots/links.\n3. Prepare demo link or submission package.\n4. Submit your final repository link below.`
      }
    ];
  }

  const assignments = [];
  for (let w = 1; w <= maxWeeks; w++) {
    const tplIndex = (w - 1) % domainTasks.length;
    const tpl = domainTasks[tplIndex];
    assignments.push({
      week: w,
      title: `Week ${w}: ${tpl.title}`,
      description: `${tpl.desc} (Guided, beginner-friendly effort: ~1-2 hours/week).`,
      instructions: tpl.instructions,
      submissionType: "github",
    });
  }
  return assignments;
}

async function autoSeed() {
  try {
    const Domain = require("../models/Domain");
    const count = await Domain.countDocuments();
    if (count < 20) {
      console.log("Seeding comprehensive tech and non-tech internship domains catalog...");
      const Duration = require("../models/Duration");
      const Assignment = require("../models/Assignment");
      const User = require("../models/User");

      const DURATIONS = [
        { weeks: 4, label: "4 Weeks", fee: 100 },
        { weeks: 6, label: "6 Weeks", fee: 150 },
        { weeks: 8, label: "8 Weeks", fee: 200 },
        { weeks: 12, label: "12 Weeks", fee: 300 },
        { weeks: 24, label: "24 Weeks", fee: 500 },
      ];

      const DOMAINS = [
        // --- Tech & Software Development ---
        {
          name: "Full Stack Web Development",
          slug: "full-stack-development",
          category: "Software Development",
          description: "Master full-stack engineering with React, Node.js, Express, MongoDB, and Next.js capstones.",
          skills: ["HTML5", "CSS3", "JavaScript", "React", "Node.js", "MongoDB", "REST APIs"],
          icon: "code",
        },
        {
          name: "Web Development",
          slug: "web-development",
          category: "Software Development",
          description: "Build responsive, modern web applications with frontend frameworks and UI design systems.",
          skills: ["HTML", "CSS", "JavaScript", "React", "Tailwind CSS", "Git"],
          icon: "layout",
        },
        {
          name: "Python Full Stack Development",
          slug: "python-development",
          category: "Software Development",
          description: "Build scalable web applications and data APIs using Python, Django, and FastAPI.",
          skills: ["Python", "Django", "FastAPI", "PostgreSQL", "React", "REST APIs"],
          icon: "terminal",
        },
        {
          name: "Java Enterprise Development",
          slug: "java-development",
          category: "Software Development",
          description: "Develop enterprise microservices and robust backends using Java and Spring Boot framework.",
          skills: ["Java", "Spring Boot", "Hibernate", "MySQL", "RESTful Web Services"],
          icon: "coffee",
        },
        {
          name: "Mobile App Development",
          slug: "mobile-development",
          category: "Software Development",
          description: "Build cross-platform mobile apps for iOS and Android using React Native and Flutter.",
          skills: ["React Native", "Flutter", "Dart", "Firebase", "Mobile UI"],
          icon: "smartphone",
        },
        {
          name: "C++ & Systems Programming",
          slug: "cpp-programming",
          category: "Software Development",
          description: "Master object-oriented programming, data structures, memory management, and high-performance algorithms in C++.",
          skills: ["C++", "Data Structures", "Algorithms", "Object-Oriented Design", "Memory Management"],
          icon: "code-2",
        },

        // --- Data & AI ---
        {
          name: "Data Science & Analytics",
          slug: "data-science",
          category: "Data & AI",
          description: "Perform exploratory data analysis, data cleaning, visualization, and predictive statistical modeling.",
          skills: ["Python", "Pandas", "NumPy", "Matplotlib", "SQL", "PowerBI"],
          icon: "bar-chart",
        },
        {
          name: "Machine Learning & AI",
          slug: "machine-learning",
          category: "Data & AI",
          description: "Train supervised and unsupervised ML models, neural networks, and LLM artificial intelligence applications.",
          skills: ["Python", "scikit-learn", "TensorFlow", "PyTorch", "OpenAI APIs"],
          icon: "cpu",
        },
        {
          name: "Artificial Intelligence & Prompt Engineering",
          slug: "ai-prompt-engineering",
          category: "Data & AI",
          description: "Engineer AI prompts, fine-tune LLM agents, build RAG pipelines, and integrate OpenAI/LangChain APIs.",
          skills: ["Prompt Engineering", "LLM APIs", "LangChain", "Python", "Vector Databases"],
          icon: "sparkles",
        },

        // --- Cloud & Cybersecurity ---
        {
          name: "Cloud Computing & DevOps",
          slug: "cloud-computing",
          category: "Cloud & DevOps",
          description: "Architect cloud infrastructure, containerize microservices, and automate CI/CD deployment pipelines.",
          skills: ["AWS", "Docker", "Kubernetes", "Linux", "GitHub Actions", "Terraform"],
          icon: "cloud",
        },
        {
          name: "Cybersecurity & Ethical Hacking",
          slug: "cybersecurity",
          category: "Cybersecurity",
          description: "Identify vulnerabilities, audit web applications, analyze network traffic, and defend enterprise systems.",
          skills: ["Network Security", "OWASP Top 10", "Wireshark", "Metasploit", "Penetration Testing"],
          icon: "shield",
        },

        // --- Design & Creative ---
        {
          name: "UI/UX Design & Product Prototyping",
          slug: "ui-ux-design",
          category: "Design & Product",
          description: "Design user-centric interfaces, conduct user research, wireframe user journeys, and build interactive Figma prototypes.",
          skills: ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems"],
          icon: "figma",
        },
        {
          name: "Graphic Design & Brand Identity",
          slug: "graphic-design-branding",
          category: "Design & Product",
          description: "Create visual branding systems, vector logo designs, promotional media assets, and digital illustrations.",
          skills: ["Photoshop", "Illustrator", "Brand Identity", "Vector Design", "Canva"],
          icon: "palette",
        },

        // --- Marketing & Business ---
        {
          name: "Digital Marketing & Growth Hacking",
          slug: "digital-marketing",
          category: "Marketing & Business",
          description: "Drive online customer acquisition, run performance ad campaigns, optimize SEO, and master growth analytics.",
          skills: ["SEO", "Google Analytics", "Social Media Marketing", "Content Strategy", "Email Campaigns"],
          icon: "trending-up",
        },
        {
          name: "Business Analytics & Market Research",
          slug: "business-analytics",
          category: "Marketing & Business",
          description: "Analyze key business growth metrics, conduct competitive market intelligence, and model strategic insights.",
          skills: ["Excel", "PowerBI", "Market Research", "SWOT Analysis", "Business Intelligence"],
          icon: "pie-chart",
        },

        // --- Finance & Accounting ---
        {
          name: "Financial Analytics & Investment Banking",
          slug: "financial-analytics",
          category: "Finance & Accounting",
          description: "Build financial valuation models, analyze corporate P&L statements, and calculate DCF metrics.",
          skills: ["Financial Modeling", "Excel Valuation", "Financial Statements", "Risk Analysis", "Corporate Finance"],
          icon: "dollar-sign",
        },
        {
          name: "Accounting, Taxation & Corporate Auditing",
          slug: "accounting-taxation",
          category: "Finance & Accounting",
          description: "Master corporate bookkeeping, GST taxation compliance, balance sheet reconciliation, and auditing standards.",
          skills: ["Tally Prime", "GST Compliance", "Income Tax", "Financial Auditing", "Bookkeeping"],
          icon: "file-text",
        },

        // --- Human Resources ---
        {
          name: "Human Resource Management & Talent Acquisition",
          slug: "human-resources-management",
          category: "Human Resources",
          description: "Execute talent sourcing strategies, candidate interviewing frameworks, employee onboarding, and HR policy manuals.",
          skills: ["Talent Sourcing", "Interviewing", "Employee Engagement", "HR Policies", "Onboarding"],
          icon: "users",
        },

        // --- Content & Media ---
        {
          name: "Content Writing, Copywriting & Media Communication",
          slug: "content-writing-copywriting",
          category: "Content & Media",
          description: "Write high-converting website copy, SEO blog posts, newsletter campaigns, and corporate press releases.",
          skills: ["Blog Writing", "SEO Copywriting", "Social Media Content", "Editing", "Proofreading"],
          icon: "edit-3",
        },

        // --- Sales & BD ---
        {
          name: "Sales, Business Development & Lead Generation",
          slug: "sales-business-development",
          category: "Sales & BD",
          description: "Identify B2B clients, construct sales pitch decks, execute email outreach campaigns, and manage CRM funnels.",
          skills: ["Lead Generation", "Cold Email Outreach", "Sales Pitching", "CRM Tools", "Deal Closing"],
          icon: "briefcase",
        },

        // --- Legal Affairs ---
        {
          name: "Legal Research, Corporate Law & IP Rights",
          slug: "legal-research-corporate-law",
          category: "Legal Affairs",
          description: "Draft commercial contracts, analyze IP regulations, research statutory precedents, and review regulatory compliance.",
          skills: ["Legal Research", "Contract Drafting", "Intellectual Property", "NDAs", "Compliance Auditing"],
          icon: "book-open",
        },

        // --- Healthcare & Science ---
        {
          name: "Hospital Administration & Healthcare Management",
          slug: "healthcare-hospital-management",
          category: "Healthcare & Science",
          description: "Understand healthcare facility operations, patient care workflows, EHR standards, and health system quality audits.",
          skills: ["Healthcare Operations", "Patient Workflow", "Medical Records (EHR)", "Health Quality Audits"],
          icon: "activity",
        },

        // --- Supply Chain & Operations ---
        {
          name: "Supply Chain, Logistics & Operations Management",
          slug: "supply-chain-operations",
          category: "Operations & Supply Chain",
          description: "Optimize supply chain logistics, inventory turnover metrics, procurement vendor selection, and warehouse workflows.",
          skills: ["Inventory Control", "Logistics Routing", "Vendor Management", "Process Optimization"],
          icon: "truck",
        },

        // --- Events & PR ---
        {
          name: "Event Management & Public Relations (PR)",
          slug: "event-management-pr",
          category: "Events & PR",
          description: "Plan corporate events, draft press releases, negotiate vendor budgets, and execute public relations campaigns.",
          skills: ["Event Planning", "PR Campaigning", "Vendor Negotiation", "Media Outreach", "Budgeting"],
          icon: "calendar",
        },

        // --- Sustainability & ESG ---
        {
          name: "Environmental Science & Corporate Sustainability (ESG)",
          slug: "environmental-sustainability",
          category: "Sustainability",
          description: "Assess corporate environmental impacts, audit carbon accounting metrics, and outline green ESG action plans.",
          skills: ["ESG Reporting", "Carbon Accounting", "Renewable Energy Audits", "Waste Reduction"],
          icon: "globe",
        },

        // --- Biotechnology ---
        {
          name: "Biotechnology & Bio-Informatics Research",
          slug: "biotechnology-bioinformatics",
          category: "Healthcare & Science",
          description: "Explore genomic data tools, document lab research protocols, and summarize biotechnological scientific literature.",
          skills: ["Bioinformatics", "DNA Sequence Tools", "Lab Protocols", "Scientific Literature Review"],
          icon: "dnamic",
        },
      ];

      await Promise.all([Domain.deleteMany({}), Duration.deleteMany({}), Assignment.deleteMany({})]);
      const durationDocs = await Duration.insertMany(DURATIONS);

      for (const d of DOMAINS) {
        const domain = await Domain.create({ ...d, availableDurations: durationDocs.map((x) => x._id) });
        const assignmentsData = generateWeeklyAssignments(d.name, 24).map((item) => ({
          ...item,
          domain: domain._id,
        }));
        await Assignment.insertMany(assignmentsData);
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminEmail && adminPassword) {
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
          await User.create({
            fullName: process.env.ADMIN_NAME || "Program Admin",
            email: adminEmail,
            password: adminPassword,
            role: "admin",
          });
          console.log(`Created admin user -> email: ${adminEmail}`);
        }
      }
      console.log(`Auto-seeding completed: ${DOMAINS.length} tech & non-tech domains successfully seeded.`);
    }
  } catch (err) {
    console.error("Auto-seeding error:", err.message);
  }
}

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internship_platform";
  const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 40,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 30000,
    retryWrites: true,
  };

  try {
    await mongoose.connect(uri, mongoOptions);
    console.log("MongoDB connected with optimized pool settings:", uri);
  } catch (err) {
    console.log("Local/Atlas MongoDB not available:", err.message);
    if (process.env.NODE_ENV === "production") {
      console.error("MongoDB is unavailable in production. API will start in degraded mode until MongoDB is restored.");
      return false;
    }
    console.log("Starting embedded MongoMemoryServer fallback for development...");
    try {
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log("Connected to embedded MongoMemoryServer at:", memoryUri);
    } catch (memErr) {
      console.error("Embedded MongoDB startup error:", memErr.message);
      console.log("Operating in Hybrid Spreadsheet Mode.");
    }
  }

  if (mongoose.connection.readyState === 1) await autoSeed();
  return mongoose.connection.readyState === 1;
}

module.exports = connectDB;
