import { useId, useState, type ReactNode } from "react";
import katex from "katex";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import { Check, Copy, ArrowUpRight } from "lucide-react";

export function MathFormula({ children }: { children: string }) {
  return (
    <div
      className="formula"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(children, {
          displayMode: true,
          throwOnError: true,
          output: "htmlAndMathml",
        }),
      }}
    />
  );
}
export function Code({
  code,
  title = "Python",
  language = "python",
}: {
  code: string;
  title?: string;
  language?: string;
}) {
  const [status, setStatus] = useState("Copy");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
    } catch {
      setStatus("Select to copy");
    }
    setTimeout(() => setStatus("Copy"), 2000);
  }
  return (
    <div className="code">
      <div className="code-top">
        <span>{title}</span>
        <button onClick={copy} aria-label={`Copy ${title}`}>
          {status === "Copied" ? <Check size={14} /> : <Copy size={14} />}{" "}
          {status}
        </button>
      </div>
      <pre>
        <code
          dangerouslySetInnerHTML={{
            __html: Prism.highlight(
              code.trim(),
              Prism.languages[language] || Prism.languages.python,
              language,
            ),
          }}
        />
      </pre>
    </div>
  );
}
export function Callout({
  title,
  children,
  tone = "",
}: {
  title: string;
  children: ReactNode;
  tone?: string;
}) {
  return (
    <aside className={`callout ${tone}`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}
export function Section({
  eyebrow,
  title,
  children,
  id,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="lesson-section" id={id}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="range-field">
      <div>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>
          {step < 1 ? value.toFixed(2) : value}
          {suffix}
        </output>
      </div>
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="range-ends">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
export function Download({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return (
    <a
      className="button secondary"
      href={`${import.meta.env.BASE_URL}${path}`}
      download
    >
      {children}
      <ArrowUpRight size={16} />
    </a>
  );
}
export function Legend() {
  return (
    <div className="legend">
      <span>
        <i className="normal" /> Normal · 0
      </span>
      <span>
        <i className="alert" /> Alert · 1
      </span>
    </div>
  );
}
export function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
}) {
  return (
    <div className="stat">
      <small>{label}</small>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}
