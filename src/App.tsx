import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  GitBranch,
  Menu,
  X,
} from "lucide-react";
import Introduction from "./chapters/Introduction";
import Intuition from "./chapters/Intuition";
import Theory from "./chapters/Theory";
import Algorithm from "./chapters/Algorithm";
import Project from "./chapters/Project";
import Walkthrough from "./chapters/Walkthrough";
import Review from "./chapters/Review";

export const chapters = [
  {
    id: "introduction",
    name: "Introduction",
    subtitle: "The idea in a nutshell",
    title: "Decision trees",
    component: Introduction,
  },
  {
    id: "intuition",
    name: "Core intuition",
    subtitle: "See what a split does",
    title: "A better question.",
    component: Intuition,
  },
  {
    id: "theory",
    name: "The mathematics",
    subtitle: "Measure uncertainty",
    title: "The math behind the split.",
    component: Theory,
  },
  {
    id: "algorithm",
    name: "Step by step",
    subtitle: "Watch a tree grow",
    title: "Inside the algorithm.",
    component: Algorithm,
  },
  {
    id: "project",
    name: "The mini-project",
    subtitle: "Build. Train. Experiment.",
    title: "From intuition to Python.",
    component: Project,
  },
  {
    id: "code",
    name: "Code walkthrough",
    subtitle: "Understand every piece",
    title: "Read the machinery.",
    component: Walkthrough,
  },
  {
    id: "review",
    name: "Review & interview",
    subtitle: "Make the knowledge stick",
    title: "Close the loop.",
    component: Review,
  },
];
const fromHash = () =>
  Math.max(
    0,
    chapters.findIndex((c) => c.id === window.location.hash.slice(1)),
  );
function readProgress(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem("tree-lab-progress") || "[]");
    return Array.isArray(value)
      ? value.filter(
          (s: unknown) =>
            typeof s === "string" && chapters.some((c) => c.id === s),
        )
      : [];
  } catch {
    return [];
  }
}
export default function App() {
  const [active, setActive] = useState(fromHash),
    [completed, setCompleted] = useState<string[]>(readProgress),
    [menu, setMenu] = useState(false);
  useEffect(() => {
    function change() {
      setActive(fromHash());
      setMenu(false);
      window.scrollTo({ top: 0 });
    }
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.title = `${chapters[active].name} — Decision Tree Lab`;
  }, [active]);
  function complete() {
    const updated = completed.includes(chapters[active].id)
      ? completed.filter((id) => id !== chapters[active].id)
      : [...completed, chapters[active].id];
    setCompleted(updated);
    try {
      localStorage.setItem("tree-lab-progress", JSON.stringify(updated));
    } catch {
      /* In-memory progress still works in restricted browsers. */
    }
  }
  const Content = chapters[active].component;
  return (
    <div className="app">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <div className="mobile-header">
        <a href="#introduction" className="brand">
          <span className="brand-icon">
            <GitBranch size={21} />
          </span>
          <b>The Learning Lab</b>
        </a>
        <button
          aria-label={menu ? "Close navigation" : "Open navigation"}
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </div>
      {menu && (
        <button
          className="nav-scrim"
          aria-label="Close navigation overlay"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a href="#introduction" className="brand">
          <span className="brand-icon">
            <GitBranch size={23} />
          </span>
          <div>
            <b>The Learning Lab</b>
            <span>MACHINE LEARNING, MADE CLEAR</span>
          </div>
        </a>
        <div className="course-label">
          <span>FIELD GUIDE / 001</span>
          <h2>Decision trees</h2>
          <p>
            From a simple question
            <br />
            to a working model.
          </p>
        </div>
        <nav aria-label="Chapters">
          <span className="nav-label">YOUR LEARNING PATH</span>
          {chapters.map((c, i) => (
            <a
              key={c.id}
              className={active === i ? "active" : ""}
              aria-current={active === i ? "page" : undefined}
              href={`#${c.id}`}
            >
              <span
                className={`nav-number ${completed.includes(c.id) ? "done" : ""}`}
              >
                {completed.includes(c.id) ? <Check size={13} /> : `0${i + 1}`}
              </span>
              <div>
                <b>{c.name}</b>
                <small>{c.subtitle}</small>
              </div>
              {active === i && <ChevronRight className="nav-arrow" size={14} />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="progress-label">
            <span>Your progress</span>
            <b>{completed.length} / 7</b>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Completed chapters"
            aria-valuemin={0}
            aria-valuemax={7}
            aria-valuenow={completed.length}
          >
            <span style={{ width: `${(completed.length / 7) * 100}%` }} />
          </div>
          <small>Mark chapters complete as you learn.</small>
          <a
            href={`${import.meta.env.BASE_URL}downloads/decision-tree-lab-source.zip`}
            download
            className="source-link"
          >
            <Download size={16} /> Download all source <ArrowRight size={15} />
          </a>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <BookOpen size={15} />
            <span>Machine learning</span>
            <ChevronRight size={13} />
            <strong>Decision trees</strong>
          </div>
          <a href="#project">
            THE HANDS-ON SERIES <span>↗</span>
          </a>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="content" key={active}>
            {active !== 0 && (
              <div className="chapter-heading">
                <div className="eyebrow">
                  CHAPTER 0{active + 1} / 07 <span>DECISION TREES</span>
                </div>
                <h1>{chapters[active].title}</h1>
                <p>{chapters[active].subtitle}</p>
              </div>
            )}
            <Content />
            <div className="chapter-end">
              <button
                className={`button ${completed.includes(chapters[active].id) ? "completed" : "secondary"}`}
                onClick={complete}
              >
                <CheckCircle2 size={17} />
                {completed.includes(chapters[active].id)
                  ? "Chapter completed"
                  : "Mark chapter complete"}
              </button>
              <span>
                {completed.length === 7
                  ? "All seven chapters completed. Keep experimenting."
                  : "Progress is saved in this browser."}
              </span>
            </div>
            <div className="chapter-pagination">
              {active > 0 ? (
                <a href={`#${chapters[active - 1].id}`}>
                  <ArrowLeft size={19} />
                  <div>
                    <small>PREVIOUS CHAPTER</small>
                    <b>{chapters[active - 1].name}</b>
                  </div>
                </a>
              ) : (
                <span />
              )}
              {active < 6 ? (
                <a href={`#${chapters[active + 1].id}`}>
                  <div>
                    <small>UP NEXT</small>
                    <b>{chapters[active + 1].name}</b>
                  </div>
                  <ArrowRight size={19} />
                </a>
              ) : (
                <a href="#project">
                  <div>
                    <small>KEEP EXPLORING</small>
                    <b>Return to the experiment</b>
                  </div>
                  <ArrowRight size={19} />
                </a>
              )}
            </div>
            <footer>
              <span>
                <GitBranch size={15} /> The Learning Lab
              </span>
              <a
                href="https://github.com/wangshen-tech/decision-tree-learning-lab"
                target="_blank"
                rel="noreferrer"
              >
                Explore the GitHub repository ↗
              </a>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
