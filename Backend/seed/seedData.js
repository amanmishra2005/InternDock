require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Domain = require("../models/Domain");
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
  {
    name: "Full Stack Development",
    slug: "full-stack-development",
    category: "Software Development",
    description: "Master full-stack engineering using the MERN stack (MongoDB, Express, React, Node.js) with production-ready capstones.",
    skills: ["React.js", "Node.js", "Express.js", "MongoDB", "REST APIs", "Tailwind CSS"],
    icon: "code",
  },
  {
    name: "Web Development",
    slug: "web-development",
    category: "Software Development",
    description: "Design and build responsive, modern interactive web interfaces using modern HTML5, CSS3, JavaScript ES6+, and UI tools.",
    skills: ["HTML5", "CSS3", "JavaScript ES6+", "Git & GitHub", "Responsive Design"],
    icon: "layout",
  },
  {
    name: "Artificial Intelligence & ML",
    slug: "artificial-intelligence-ml",
    category: "Data & AI",
    description: "Engineer machine learning pipelines, deep neural networks, and generative AI models using Python and PyTorch.",
    skills: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Computer Vision", "NLP"],
    icon: "cpu",
  },
  {
    name: "Data Science & Analytics",
    slug: "data-science-analytics",
    category: "Data & AI",
    description: "Perform exploratory data analysis, data storytelling, SQL modeling, and interactive dashboard creation.",
    skills: ["Python", "Pandas", "NumPy", "SQL", "PowerBI", "Matplotlib"],
    icon: "bar-chart",
  },
  {
    name: "Python Programming",
    slug: "python-programming",
    category: "Software Development",
    description: "Develop robust backend services, automation scripts, and object-oriented software architectures using Python.",
    skills: ["Python", "OOP", "Django/FastAPI", "Web Scraping", "Automation"],
    icon: "terminal",
  },
  {
    name: "Java Full Stack Development",
    slug: "java-full-stack-development",
    category: "Software Development",
    description: "Build enterprise web applications with Spring Boot backend, microservices, Hibernate, and frontend frameworks.",
    skills: ["Java", "Spring Boot", "Hibernate", "REST Services", "MySQL", "React"],
    icon: "coffee",
  },
  {
    name: "UI/UX & Product Design",
    slug: "ui-ux-product-design",
    category: "Design & Product",
    description: "Craft modern user experiences, interactive wireframes, design systems, and usable prototypes in Figma.",
    skills: ["Figma", "User Research", "Wireframing", "Design Systems", "Prototyping"],
    icon: "figma",
  },
  {
    name: "Cyber Security & Ethical Hacking",
    slug: "cyber-security-ethical-hacking",
    category: "Cybersecurity",
    description: "Audit application vulnerabilities, analyze network security, mitigate OWASP top 10 flaws, and execute penetration tests.",
    skills: ["Ethical Hacking", "OWASP Top 10", "Wireshark", "Network Security", "Metasploit"],
    icon: "shield",
  },
  {
    name: "Cloud Computing & DevOps",
    slug: "cloud-computing-devops",
    category: "Cloud & DevOps",
    description: "Architect cloud infrastructure on AWS, containerize apps with Docker, and automate CI/CD release pipelines.",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux", "Terraform"],
    icon: "cloud",
  },
  {
    name: "Android & Flutter App Development",
    slug: "android-flutter-app-development",
    category: "Software Development",
    description: "Build cross-platform mobile apps for iOS and Android with Flutter, Dart, and Firebase backends.",
    skills: ["Flutter", "Dart", "Firebase", "State Management", "REST API Integration"],
    icon: "smartphone",
  },
  {
    name: "Digital Marketing & Growth SEO",
    slug: "digital-marketing-growth-seo",
    category: "Marketing & Business",
    description: "Execute organic SEO growth strategies, run performance advertising campaigns, content marketing, and Google Analytics.",
    skills: ["SEO", "Google Analytics", "Content Marketing", "Meta Ads", "Growth Hacking"],
    icon: "trending-up",
  },
  {
    name: "C++ Data Structures & Algorithms",
    slug: "cpp-data-structures-algorithms",
    category: "Software Development",
    description: "Master problem solving, low-level memory handling, trees, graphs, dynamic programming, and algorithm optimization in C++.",
    skills: ["C++", "STL", "Data Structures", "Algorithms", "Competitive Programming"],
    icon: "code-2",
  }
];

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
  } else {
    domainTasks = [
      {
        title: "Orientation & Environment Setup",
        desc: `Set up your development workspace for ${domainName}. Initialize your project repository and verify local build tools.`,
        instructions: `1. Install required compiler / IDE / tools for ${domainName}.\n2. Create a clean project folder and GitHub repository.\n3. Write a simple 'Hello World' starter program and verify output.\n4. Push initial repository to GitHub and submit your link below.`
      },
      {
        title: "Core Foundations & Guided Task",
        desc: `Build a guided beginner project demonstrating fundamental syntax, control structures, and module organization in ${domainName}.`,
        instructions: `1. Implement basic input/output, data structures, or UI components.\n2. Add comments explaining your code logic.\n3. Test program execution with sample inputs.\n4. Commit your code and submit your GitHub link below.`
      },
      {
        title: "Applied Feature Module",
        desc: `Extend your ${domainName} project by adding a practical feature module (e.g. Data persistence, API integration, or interactive UI).`,
        instructions: `1. Add interactive features or modular functions.\n2. Handle basic edge cases and error handling.\n3. Update your project README with setup instructions.\n4. Commit changes to GitHub and submit link below.`
      },
      {
        title: "Final Capstone Project & Demo",
        desc: `Finalize your ${domainName} capstone project. Polish UI/code structure, write documentation, and submit for mentor evaluation.`,
        instructions: `1. Ensure all project features run cleanly without errors.\n2. Write a comprehensive README with project description and screenshots.\n3. Test build deployment or release package.\n4. Submit your final repository link below.`
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

async function seed() {
  await connectDB();

  await Promise.all([Domain.deleteMany({}), Duration.deleteMany({}), Assignment.deleteMany({})]);

  const durationDocs = await Duration.insertMany(DURATIONS);

  for (const d of DOMAINS) {
    const domain = await Domain.create({ ...d, availableDurations: durationDocs.map((x) => x._id) });

    const assignmentData = generateWeeklyAssignments(d.name, 24).map((item) => ({
      ...item,
      domain: domain._id,
    }));

    await Assignment.insertMany(assignmentData);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        fullName: process.env.ADMIN_NAME || "Program Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      await admin.save();
      console.log(`Created admin user -> email: ${adminEmail}`);
    }
  }

  console.log("Seed complete:", DOMAINS.length, "domains,", DURATIONS.length, "durations.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
