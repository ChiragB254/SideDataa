import { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu, X, ArrowRight, Code2, Shield, BarChart3,
  Mail, Phone, MapPin, Linkedin, Github, Star, Zap,
  Cloud, Lock, Users, CheckCircle, Send, Layers,
  Terminal, BrainCircuit, Workflow, Rocket, MessageSquare,
  ArrowUpRight, ChevronRight, Globe, Headset, Server,
  MonitorSmartphone, Database, GitBranch, Cpu, Network,
  HardDrive, Eye, Target, Sparkles, ArrowUp, Clock,
  Building2, Trophy, Heart, ShieldCheck
} from "lucide-react";

/* ════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════ */
const C = {
  midnight: "#060A13", navy: "#0C1222", deep: "#111B2E",
  blue: "#3B82F6", teal: "#06D6A0", violet: "#7C3AED",
  pink: "#EC4899", amber: "#F59E0B", red: "#EF4444",
  sky: "#38BDF8", lime: "#84CC16",
  lightBg: "#F8FAFC", white: "#FFFFFF",
  text: "#0F172A", muted: "#64748B", border: "#E2E8F0",
  glass: "rgba(255,255,255,0.04)", glassBorder: "rgba(255,255,255,0.08)",
};

const SERVICES = [
  { id:"ai", icon: BrainCircuit, title: "AI Solutions & Infrastructure", short: "Custom AI systems that automate complex workflows and unlock intelligence from your data.",
    desc: "We design and deploy production-grade AI systems — from retrieval-augmented generation pipelines to multi-agent orchestration that handles real business logic end-to-end. Whether you need an enterprise chatbot, a document intelligence platform, or LLM infrastructure running at scale, we build it to ship, not to demo.",
    features: ["RAG Pipelines & Knowledge Bases","Multi-Agent Orchestration (LangGraph)","LLM Deployment & Optimization (vLLM)","Enterprise Chatbots & AI Copilots","Fine-tuning & Prompt Engineering","Vector Database Architecture"],
    techs: ["Python","LangChain","LangGraph","AWS Bedrock","Claude API","OpenAI","vLLM","Qdrant","Hugging Face"], gradient: `linear-gradient(135deg, ${C.blue}, ${C.violet})`, color: C.blue },
  { id:"data", icon: BarChart3, title: "Data Analytics & BI", short: "Turn raw data into dashboards and pipelines that make your team's analysis faster, not harder.",
    desc: "We build data infrastructure that replaces manual reporting with automated, real-time intelligence. From SQL pipelines feeding Power BI dashboards to BigQuery warehouses that scale with your business — our systems give your leadership team the numbers they need, when they need them.",
    features: ["Power BI & Looker Dashboards","SQL & BigQuery Data Pipelines","Automated Reporting Systems","Data Warehouse Design","ETL/ELT Architecture","KPI Tracking & Alerting"],
    techs: ["Power BI","Looker","BigQuery","PostgreSQL","dbt","Pandas","Airflow","Snowflake"], gradient: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, color: C.teal },
  { id:"dev", icon: Code2, title: "Software Engineering", short: "Full-stack development focused on automation, scalable APIs, and production-grade reliability.",
    desc: "We write software that solves problems and stays running. Whether it's a customer-facing web application, a backend API serving millions of requests, or a Python automation that saves your team 20 hours a week — we build with production in mind from day one.",
    features: ["Full-Stack Web Applications","API Design & Integration","Python & Node.js Automation","Microservices Architecture","Database Design & Optimization","CI/CD Pipeline Setup"],
    techs: ["React","Next.js","Node.js","Express","TypeScript","Python","PostgreSQL","MongoDB","Docker"], gradient: `linear-gradient(135deg, ${C.violet}, ${C.pink})`, color: C.violet },
  { id:"cloud", icon: Cloud, title: "Cloud Services", short: "Architect, migrate, and optimize your cloud infrastructure across AWS, GCP, and Azure.",
    desc: "Cloud done right means lower costs, better performance, and infrastructure that scales when you need it. We help businesses migrate legacy systems to the cloud, architect serverless solutions, and optimize existing deployments for cost and performance — using Infrastructure as Code so everything is repeatable.",
    features: ["Cloud Migration & Architecture","Serverless & Container Orchestration","Infrastructure as Code (Terraform)","Cost Optimization & FinOps","Multi-Cloud Strategy","Auto-Scaling & Performance Tuning"],
    techs: ["AWS","GCP","Azure","Terraform","Docker","Kubernetes","Lambda","CloudFormation","S3"], gradient: `linear-gradient(135deg, ${C.sky}, ${C.teal})`, color: C.sky },
  { id:"security", icon: Shield, title: "Cybersecurity", short: "Protect your digital assets with security-first engineering and proactive threat defense.",
    desc: "Security isn't an add-on — it's architecture. We assess your infrastructure for vulnerabilities, implement hardening measures, set up monitoring and alerting, and build incident response plans. From compliance requirements to zero-trust architecture, we help you stay protected without slowing down development.",
    features: ["Security Assessments & Penetration Testing","Infrastructure Hardening","Compliance & Regulatory Alignment","Zero-Trust Architecture","SIEM & Monitoring Setup","Incident Response Planning"],
    techs: ["OWASP","Nessus","Wireshark","AWS Security Hub","CloudTrail","IAM","Vault","WAF"], gradient: `linear-gradient(135deg, ${C.amber}, ${C.red})`, color: C.amber },
  { id:"it", icon: Headset, title: "IT Support & Managed Services", short: "Reliable infrastructure management, monitoring, and helpdesk support to keep your business running.",
    desc: "Technology should work for your team, not against it. We provide ongoing IT support — from system administration and network management to 24/7 monitoring and helpdesk services. Whether you need a fractional IT team or full managed services, we keep your systems healthy, patched, and performing.",
    features: ["24/7 Infrastructure Monitoring","Helpdesk & Ticket Management","System Administration","Network Management & VPN","Backup & Disaster Recovery","Software Deployment & Patching"],
    techs: ["Linux","Windows Server","Active Directory","Nagios","Zabbix","Ansible","Jira Service Mgmt","VPN"], gradient: `linear-gradient(135deg, ${C.lime}, ${C.teal})`, color: C.lime },
];

const TESTIMONIALS = [
  { quote: "SideData transformed our data infrastructure completely. What used to take days of manual reporting now runs automatically with dashboards that actually tell us something useful.", name: "Priya Mehta", role: "VP of Operations", company: "FinCore Solutions" },
  { quote: "Their AI chatbot solution cut our support ticket volume by 40% in the first month. The team understood our domain deeply and delivered exactly what we needed, on time.", name: "Marcus Chen", role: "CTO", company: "RetailEdge Technologies" },
  { quote: "We needed someone who could bridge the gap between our raw data and real business insights. SideData built us a BI pipeline that our entire leadership team now relies on daily.", name: "Sarah Thompson", role: "Director of Analytics", company: "NovaPay Inc." },
  { quote: "Their cloud migration saved us $4,200/month in infrastructure costs while actually improving our application performance. The ROI was immediate.", name: "David Park", role: "Engineering Lead", company: "StackFlow Systems" },
];

const PROCESS = [
  { step: "Discovery", desc: "Deep-dive sessions to understand your challenge, technical landscape, and what success looks like.", icon: Eye },
  { step: "Strategy", desc: "Technical approach, tool selection, and a clear roadmap with milestones — no 80-page decks.", icon: Target },
  { step: "Build", desc: "Agile sprints with weekly demos. You see progress, provide feedback, and we adjust in real time.", icon: Terminal },
  { step: "Launch & Support", desc: "Production deployment with documentation, knowledge transfer, and ongoing support.", icon: Rocket },
];

const MARQUEE = ["Artificial Intelligence","Machine Learning","Data Analytics","Cloud Architecture","Cybersecurity","Full-Stack Dev","LLM Orchestration","Business Intelligence","API Engineering","DevOps","RAG Pipelines","IT Infrastructure","Managed Services","Data Engineering"];

const STATS = [
  { value: 25, suffix: "+", label: "Projects Delivered" },
  { value: 40, suffix: "+", label: "Technologies" },
  { value: 100, suffix: "%", label: "Client Retention" },
  { value: 6, suffix: "", label: "Service Verticals" },
];

/* ════════════════════════════════════════════
   GLOBAL STYLES
   ════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}

@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.7}}
@keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes gridScroll{0%{transform:translate(0,0)}100%{transform:translate(60px,60px)}}
@keyframes pageIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

.page-transition{animation:pageIn .5s ease forwards}
.mq-track{display:flex;animation:marquee 40s linear infinite;width:max-content}
.mq-track:hover{animation-play-state:paused}
.fade-in{opacity:0;transform:translateY(35px);transition:opacity .7s ease,transform .7s ease}
.fade-in.vis{opacity:1;transform:translateY(0)}
.card-hover{transition:transform .35s ease,box-shadow .35s ease}
.card-hover:hover{transform:translateY(-8px);box-shadow:0 24px 64px rgba(0,0,0,.12)}
.glow-card{position:relative;overflow:hidden;transition:transform .3s ease,border-color .3s ease}
.glow-card:hover{transform:translateY(-4px);border-color:${C.blue}44}
.glow-card::before{content:'';position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:linear-gradient(135deg,transparent,${C.blue}33,transparent);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;-webkit-mask-composite:xor;opacity:0;transition:opacity .3s}
.glow-card:hover::before{opacity:1}
.chip{transition:all .25s ease;cursor:default}
.chip:hover{background:${C.blue};color:white;transform:scale(1.06)}
.nav-a{position:relative;transition:color .2s}
.nav-a::after{content:'';position:absolute;bottom:-3px;left:0;width:0;height:2px;background:${C.teal};transition:width .3s}
.nav-a:hover::after{width:100%}
.nav-a:hover{color:${C.teal}}
.btn-primary{transition:all .3s ease;position:relative;overflow:hidden}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 36px ${C.blue}55}
.btn-outline{transition:all .3s ease}
.btn-outline:hover{background:rgba(255,255,255,.08);transform:translateY(-2px)}
.grid-bg{background-image:linear-gradient(${C.blue}09 1px,transparent 1px),linear-gradient(90deg,${C.blue}09 1px,transparent 1px);background-size:60px 60px;animation:gridScroll 10s linear infinite}
input:focus,textarea:focus,select:focus{outline:none;border-color:${C.blue}!important;box-shadow:0 0 0 3px ${C.blue}22}
::selection{background:${C.blue};color:white}
.back-top{position:fixed;bottom:24px;right:24px;z-index:999;width:44px;height:44px;border-radius:12px;border:1px solid ${C.glassBorder};background:${C.navy}ee;backdrop-filter:blur(12px);color:${C.teal};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .3s;opacity:0;transform:translateY(20px);pointer-events:none}
.back-top.show{opacity:1;transform:translateY(0);pointer-events:all}
.back-top:hover{background:${C.blue};color:white;border-color:${C.blue}}
.service-full{border-left:3px solid transparent;transition:border-color .3s,background .3s}
.service-full:hover{border-left-color:${C.blue};background:${C.blue}06}
.testimonial-card{transition:transform .3s,box-shadow .3s}
.testimonial-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(0,0,0,.08)}
@media(max-width:768px){.desk{display:none!important}.mob-btn{display:flex!important}}
@media(min-width:769px){.mob-btn{display:none!important}}
@media(prefers-reduced-motion:reduce){.mq-track,.grid-bg{animation:none}.fade-in{opacity:1;transform:none;transition:none}}
`;

/* ════════════════════════════════════════════
   SHARED COMPONENTS
   ════════════════════════════════════════════ */
function FadeIn({ children, style, className = "" }) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setV(true), { threshold: 0.12 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return <div ref={ref} className={`fade-in ${v ? "vis" : ""} ${className}`} style={style}>{children}</div>;
}

function AnimatedCounter({ value, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const dur = 1800, step = (ts) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / dur, 1);
          setCount(Math.floor(p * value));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [value]);
  return <span ref={ref}>{count}{suffix}</span>;
}

const Label = ({ text, light }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", background: light ? `${C.blue}0D` : `${C.teal}18`, color: light ? C.blue : C.teal, marginBottom: 14 }}>{text}</div>
);

const Title = ({ children, light, style }) => (
  <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 700, lineHeight: 1.15, color: light ? C.text : C.white, marginBottom: 14, ...style }}>{children}</h2>
);

const Desc = ({ children, light, style }) => (
  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, lineHeight: 1.75, color: light ? C.muted : "rgba(255,255,255,.6)", maxWidth: 600, marginBottom: 48, ...style }}>{children}</p>
);

const Wrap = ({ children, style }) => <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", ...style }}>{children}</div>;

function MarqueeBanner() {
  return (
    <div style={{ background: C.navy, borderTop: `1px solid ${C.glassBorder}`, borderBottom: `1px solid ${C.glassBorder}`, padding: "16px 0", overflow: "hidden" }}>
      <div className="mq-track">
        {[...MARQUEE, ...MARQUEE].map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "0 28px", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.3)", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".06em" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.teal, opacity: .45 }} />{t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Nav({ page, go, scrolled }) {
  const [mob, setMob] = useState(false);
  const links = [
    { label: "Home", p: "home" },
    { label: "Services", p: "services" },
    { label: "About", p: "about" },
    { label: "Contact", p: "contact" },
  ];
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, padding: scrolled ? "10px 0" : "16px 0", background: scrolled ? `${C.midnight}F0` : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? `1px solid ${C.glassBorder}` : "none", transition: "all .35s ease" }}>
      <Wrap style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => go("home")}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C.blue},${C.teal})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers size={20} color="white" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 21, fontWeight: 700, color: C.white }}>
            Side<span style={{ color: C.teal }}>Data</span>
          </span>
        </div>
        <div className="desk" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {links.map(l => (
            <span key={l.p} className="nav-a" onClick={() => go(l.p)} style={{ color: page === l.p ? C.teal : "rgba(255,255,255,.7)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>{l.label}</span>
          ))}
          <button className="btn-primary" onClick={() => go("contact")} style={{ padding: "10px 24px", borderRadius: 9, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.blue},${C.violet})`, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Start a Project</button>
        </div>
        <button className="mob-btn" onClick={() => setMob(!mob)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex" }}>{mob ? <X size={24}/> : <Menu size={24}/>}</button>
      </Wrap>
      {mob && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: `${C.midnight}FA`, backdropFilter: "blur(24px)", padding: "16px 24px", borderTop: `1px solid ${C.glassBorder}` }}>
          {links.map(l => <div key={l.p} onClick={() => { go(l.p); setMob(false); }} style={{ padding: "14px 0", color: page === l.p ? C.teal : "rgba(255,255,255,.75)", fontSize: 16, cursor: "pointer", borderBottom: `1px solid ${C.glassBorder}` }}>{l.label}</div>)}
          <button onClick={() => { go("contact"); setMob(false); }} style={{ width: "100%", marginTop: 16, padding: "14px", borderRadius: 9, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.blue},${C.violet})`, color: "white", fontSize: 15, fontWeight: 600 }}>Start a Project</button>
        </div>
      )}
    </nav>
  );
}

function Footer({ go }) {
  return (
    <footer style={{ background: C.midnight, borderTop: `1px solid ${C.glassBorder}`, padding: "56px 0 32px" }}>
      <Wrap>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 48, marginBottom: 48 }}>
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${C.blue},${C.teal})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Layers size={18} color="white"/></div>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 19, fontWeight: 700, color: C.white }}>Side<span style={{ color: C.teal }}>Data</span></span>
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.4)", lineHeight: 1.7 }}>Software services for businesses that need real engineering — AI, data, cloud, security, and IT under one roof.</p>
          </div>
          <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.45)", marginBottom: 16, textTransform: "uppercase", letterSpacing: ".1em" }}>Services</div>
              {SERVICES.map(s => <div key={s.id} onClick={() => go("services")} style={{ fontSize: 14, color: "rgba(255,255,255,.4)", marginBottom: 10, cursor: "pointer" }}>{s.title}</div>)}
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.45)", marginBottom: 16, textTransform: "uppercase", letterSpacing: ".1em" }}>Company</div>
              {[["Home","home"],["About","about"],["Services","services"],["Contact","contact"]].map(([l,p]) => <div key={p} onClick={() => go(p)} style={{ fontSize: 14, color: "rgba(255,255,255,.4)", marginBottom: 10, cursor: "pointer" }}>{l}</div>)}
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.glassBorder}`, paddingTop: 24, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.28)" }}>© 2026 SideData Technologies Inc. All rights reserved.</span>
          <div style={{ display: "flex", gap: 12 }}>
            {[Linkedin,Github,Mail].map((Ic,i) => <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: 9, background: C.glass, border: `1px solid ${C.glassBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.4)", textDecoration: "none" }}><Ic size={16}/></a>)}
          </div>
        </div>
      </Wrap>
    </footer>
  );
}

/* ════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════ */
function HomePage({ go }) {
  return (
    <div className="page-transition">
      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", background: `linear-gradient(160deg,${C.midnight},${C.navy} 50%,${C.deep})`, display: "flex", alignItems: "center", padding: "130px 0 80px", overflow: "hidden" }}>
        <div className="grid-bg" style={{ position: "absolute", inset: -80, opacity: .45 }} />
        <div style={{ position: "absolute", top: "5%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,${C.blue}12,transparent 70%)`, animation: "pulse 7s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${C.teal}0A,transparent 70%)`, animation: "pulse 9s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", top: "40%", right: "30%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle,${C.violet}0A,transparent 70%)`, animation: "pulse 11s ease-in-out infinite 1s" }} />
        <div style={{ position: "absolute", top: "18%", right: "18%", width: 70, height: 70, borderRadius: 16, border: `1px solid ${C.blue}22`, background: `${C.blue}08`, animation: "float 6s ease-in-out infinite", transform: "rotate(15deg)" }} />
        <div style={{ position: "absolute", bottom: "22%", right: "12%", width: 50, height: 50, borderRadius: "50%", border: `1px solid ${C.teal}22`, background: `${C.teal}08`, animation: "float 8s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "55%", left: "8%", width: 40, height: 40, borderRadius: 8, border: `1px solid ${C.violet}22`, background: `${C.violet}08`, animation: "float 7s ease-in-out infinite 1s", transform: "rotate(-10deg)" }} />

        <Wrap style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 100, marginBottom: 32, background: `${C.teal}14`, border: `1px solid ${C.teal}28` }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.teal, animation: "pulse 2s ease infinite" }} />
            <span style={{ fontSize: 13, color: C.teal, fontWeight: 500, fontFamily: "'JetBrains Mono',monospace" }}>Available for new projects</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(38px,6vw,76px)", lineHeight: 1.08, color: C.white, maxWidth: 820, marginBottom: 28 }}>
            We Build{" "}
            <span style={{ background: `linear-gradient(135deg,${C.blue},${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Intelligent</span>
            <br/>Software Solutions
          </h1>
          <p style={{ fontSize: "clamp(16px,2vw,20px)", lineHeight: 1.75, color: "rgba(255,255,255,.55)", maxWidth: 580, marginBottom: 44, fontFamily: "'Inter',sans-serif" }}>
            AI systems, data pipelines, cloud infrastructure, cybersecurity, and IT support —
            engineered for businesses that need real results, not prototypes.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 72 }}>
            <button className="btn-primary" onClick={() => go("contact")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "17px 36px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.blue},${C.violet})`, color: "white", fontSize: 16, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Start a Project <ArrowRight size={18}/></button>
            <button className="btn-outline" onClick={() => go("services")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "17px 36px", borderRadius: 12, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,.18)", color: "rgba(255,255,255,.8)", fontSize: 16, fontWeight: 500, fontFamily: "'Inter',sans-serif" }}>Explore Services <ChevronRight size={18}/></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 24, maxWidth: 700 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ padding: "20px 0", borderTop: `1px solid ${C.glassBorder}` }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 40, fontWeight: 700, color: C.teal, lineHeight: 1 }}>
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 8, fontFamily: "'Inter',sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      <MarqueeBanner />

      {/* SERVICES */}
      <section style={{ background: C.white, padding: "100px 0" }}>
        <Wrap>
          <FadeIn>
            <Label text="What we do" light />
            <Title light>Six service verticals, one partner</Title>
            <Desc light>End-to-end technical expertise across AI, data, software, cloud, security, and IT — scoped around your specific business challenge.</Desc>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 20 }}>
            {SERVICES.map((s, i) => (
              <FadeIn key={s.id} style={{ transitionDelay: `${i * .08}s` }}>
                <div className="card-hover" onClick={() => go("services")} style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, padding: 32, cursor: "pointer", position: "relative", overflow: "hidden", height: "100%" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.gradient }} />
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: s.gradient, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <s.icon size={24} color="white" />
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 10, color: C.text }}>{s.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted, marginBottom: 20 }}>{s.short}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: s.color }}>Learn more <ArrowRight size={15}/></div>
                </div>
              </FadeIn>
            ))}
          </div>
        </Wrap>
      </section>

      {/* WHY SIDEDATA */}
      <section style={{ background: `linear-gradient(160deg,${C.midnight},${C.navy})`, padding: "100px 0" }}>
        <Wrap>
          <FadeIn>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 64, alignItems: "center" }}>
              <div>
                <Label text="Why SideData" />
                <Title>We build systems that make your team faster</Title>
                <p style={{ fontSize: 16, lineHeight: 1.85, color: "rgba(255,255,255,.55)", marginBottom: 24 }}>SideData Technologies is a software services company focused on AI, data, and infrastructure. We work with businesses that need real engineering — not slide decks — to solve hard problems.</p>
                <p style={{ fontSize: 16, lineHeight: 1.85, color: "rgba(255,255,255,.55)", marginBottom: 36 }}>Our team has hands-on experience across banking, fintech, retail, and enterprise SaaS. We specialize in building production-grade systems that run long after handoff.</p>
                <button className="btn-primary" onClick={() => go("about")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 10, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.blue},${C.violet})`, color: "white", fontSize: 15, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>About Us <ArrowRight size={16}/></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { icon: Zap, title: "Production-Ready", desc: "Every system designed for real-world scale and reliability." },
                  { icon: Users, title: "Domain Expertise", desc: "Deep experience in finance, data infra, and AI." },
                  { icon: ShieldCheck, title: "Security-First", desc: "Enterprise-grade security at every stack layer." },
                  { icon: Globe, title: "End-to-End", desc: "Architecture to deployment — one team, full ownership." },
                ].map(item => (
                  <div key={item.title} className="glow-card" style={{ padding: 22, borderRadius: 14, background: C.glass, border: `1px solid ${C.glassBorder}` }}>
                    <item.icon size={22} color={C.teal} style={{ marginBottom: 12 }} />
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,.45)" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </Wrap>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: C.lightBg, padding: "100px 0" }}>
        <Wrap>
          <FadeIn>
            <Label text="Client stories" light />
            <Title light>Real results, real partners</Title>
            <Desc light>We earn trust through delivery, not sales pitches.</Desc>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} style={{ transitionDelay: `${i * .1}s` }}>
                <div className="testimonial-card" style={{ padding: 32, borderRadius: 18, background: C.white, border: `1px solid ${C.border}`, height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: 2, marginBottom: 20 }}>{Array(5).fill(0).map((_, j) => <Star key={j} size={15} fill={C.amber} color={C.amber}/>)}</div>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: C.muted, fontStyle: "italic", flex: 1, marginBottom: 24 }}>"{t.quote}"</p>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: C.text }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{t.role}, {t.company}</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </Wrap>
      </section>

      {/* CTA */}
      <section style={{ background: `linear-gradient(135deg,${C.blue},${C.violet})`, padding: "80px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 20% 50%,${C.teal}15,transparent 50%)` }} />
        <Wrap style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, color: C.white, marginBottom: 16 }}>Ready to build something worth shipping?</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.75)", maxWidth: 500, margin: "0 auto 36px" }}>Tell us about your project — we'll get back within 24 hours.</p>
          <button className="btn-primary" onClick={() => go("contact")} style={{ padding: "17px 40px", borderRadius: 12, border: "none", cursor: "pointer", background: C.white, color: C.blue, fontSize: 16, fontWeight: 700, fontFamily: "'Inter',sans-serif", display: "inline-flex", alignItems: "center", gap: 10 }}>Get in Touch <ArrowRight size={18}/></button>
        </Wrap>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════
   SERVICES PAGE
   ════════════════════════════════════════════ */
function ServicesPage({ go }) {
  return (
    <div className="page-transition">
      <section style={{ background: `linear-gradient(160deg,${C.midnight},${C.navy})`, padding: "160px 0 80px", position: "relative", overflow: "hidden" }}>
        <div className="grid-bg" style={{ position: "absolute", inset: -60, opacity: .3 }} />
        <Wrap style={{ position: "relative", zIndex: 1 }}>
          <Label text="Our services" />
          <Title>What we build for you</Title>
          <Desc>Six core service areas — each backed by production experience, delivered by engineers who've shipped real systems across banking, fintech, and enterprise SaaS.</Desc>
        </Wrap>
      </section>
      <MarqueeBanner />

      <section style={{ background: C.white, padding: "80px 0" }}>
        <Wrap>
          {SERVICES.map((s, i) => (
            <FadeIn key={s.id}>
              <div className="service-full" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, padding: "48px 0", borderBottom: i < SERVICES.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "start", marginLeft: -12, paddingLeft: 12, borderRadius: 4 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: s.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.icon size={24} color="white" />
                    </div>
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: C.text }}>{s.title}</h3>
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.8, color: C.muted }}>{s.desc}</p>
                </div>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Key Deliverables</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                    {s.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <CheckCircle size={16} color={s.color} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Technologies</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {s.techs.map(t => (
                      <span key={t} className="chip" style={{ padding: "5px 13px", borderRadius: 8, background: `${s.color}0D`, border: `1px solid ${s.color}22`, fontSize: 12, fontWeight: 500, color: s.color }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </Wrap>
      </section>

      <section style={{ background: `linear-gradient(135deg,${C.blue},${C.violet})`, padding: "72px 0", textAlign: "center" }}>
        <Wrap>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 700, color: C.white, marginBottom: 14 }}>Have a project in mind?</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.75)", maxWidth: 480, margin: "0 auto 32px" }}>Let's talk scope, timeline, and how we can help.</p>
          <button className="btn-primary" onClick={() => go("contact")} style={{ padding: "16px 36px", borderRadius: 12, border: "none", cursor: "pointer", background: C.white, color: C.blue, fontSize: 16, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10 }}>Contact Us <ArrowRight size={18}/></button>
        </Wrap>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════
   ABOUT PAGE
   ════════════════════════════════════════════ */
function AboutPage({ go }) {
  return (
    <div className="page-transition">
      <section style={{ background: `linear-gradient(160deg,${C.midnight},${C.navy})`, padding: "160px 0 80px", position: "relative", overflow: "hidden" }}>
        <div className="grid-bg" style={{ position: "absolute", inset: -60, opacity: .3 }} />
        <Wrap style={{ position: "relative", zIndex: 1 }}>
          <Label text="About us" />
          <Title>Engineering-first, outcome-driven</Title>
          <Desc>SideData Technologies is a software services company built by engineers who've shipped production systems across banking, fintech, and enterprise SaaS.</Desc>
        </Wrap>
      </section>

      {/* MISSION */}
      <section style={{ background: C.white, padding: "80px 0" }}>
        <Wrap>
          <FadeIn>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48 }}>
              <div>
                <Label text="Our mission" light />
                <Title light style={{ fontSize: "clamp(24px,3vw,36px)" }}>Build systems that make analysis faster for everyone</Title>
                <p style={{ fontSize: 16, lineHeight: 1.85, color: C.muted, marginBottom: 24 }}>We started SideData because we saw the same pattern everywhere: talented teams stuck doing manual work that software should handle. Reports assembled by hand. Data pipelines held together with duct tape. AI capabilities stuck in proof-of-concept limbo.</p>
                <p style={{ fontSize: 16, lineHeight: 1.85, color: C.muted }}>We exist to close that gap. We build the infrastructure, automation, and intelligence layers that free your team to focus on decisions — not data wrangling.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { num: "25+", text: "Production projects shipped across industries" },
                  { num: "6", text: "Core service verticals — AI to IT support" },
                  { num: "40+", text: "Technologies in our working toolkit" },
                  { num: "100%", text: "Client retention rate since founding" },
                ].map(item => (
                  <div key={item.text} style={{ padding: 24, borderRadius: 14, background: C.lightBg, border: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 32, fontWeight: 700, color: C.blue, marginBottom: 8 }}>{item.num}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: C.muted }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </Wrap>
      </section>

      {/* VALUES */}
      <section style={{ background: C.lightBg, padding: "80px 0" }}>
        <Wrap>
          <FadeIn>
            <Label text="Our values" light />
            <Title light style={{ fontSize: "clamp(24px,3vw,36px)" }}>How we operate</Title>
            <Desc light>These aren't wall posters — they're how we make decisions on every project.</Desc>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 20 }}>
            {[
              { icon: Target, title: "Outcome over output", desc: "We measure success by business impact, not lines of code or hours billed." },
              { icon: Eye, title: "Radical transparency", desc: "Weekly demos, honest timelines, and we'll tell you if something isn't working." },
              { icon: Rocket, title: "Ship to production", desc: "POCs are fine for validation — but every engagement targets production deployment." },
              { icon: Lock, title: "Security is architecture", desc: "Security isn't a checklist item. It's built into every design decision from day one." },
            ].map((v, i) => (
              <FadeIn key={v.title} style={{ transitionDelay: `${i * .1}s` }}>
                <div className="glow-card" style={{ padding: 28, borderRadius: 16, background: C.white, border: `1px solid ${C.border}`, height: "100%" }}>
                  <v.icon size={24} color={C.blue} style={{ marginBottom: 14 }} />
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>{v.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted }}>{v.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Wrap>
      </section>

      {/* PROCESS */}
      <section style={{ background: C.white, padding: "80px 0" }}>
        <Wrap>
          <FadeIn>
            <Label text="Our process" light />
            <Title light style={{ fontSize: "clamp(24px,3vw,36px)" }}>From first call to production</Title>
            <Desc light>A transparent, four-phase approach. You're involved at every step.</Desc>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 20 }}>
            {PROCESS.map((p, i) => (
              <FadeIn key={p.step} style={{ transitionDelay: `${i * .1}s` }}>
                <div className="glow-card" style={{ padding: 28, borderRadius: 16, background: C.white, border: `1px solid ${C.border}`, height: "100%" }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: C.blue, marginBottom: 14, letterSpacing: ".1em" }}>0{i + 1} — {p.step.toUpperCase()}</div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.blue}0D`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <p.icon size={22} color={C.blue} />
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted }}>{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Wrap>
      </section>

      {/* TECH */}
      <section style={{ background: `linear-gradient(160deg,${C.midnight},${C.navy})`, padding: "80px 0" }}>
        <Wrap>
          <FadeIn>
            <Label text="Our toolkit" />
            <Title>Technologies we work with</Title>
            <Desc>The right tool for the job — not the trendiest one.</Desc>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
            {[
              { label: "AI / ML", techs: ["Python","LangChain","LangGraph","AWS Bedrock","Claude API","OpenAI","vLLM","Hugging Face","Qdrant","RAG"] },
              { label: "Data & Analytics", techs: ["Power BI","Looker","BigQuery","PostgreSQL","MongoDB","Redis","Pandas","dbt","Airflow"] },
              { label: "Cloud & DevOps", techs: ["AWS","GCP","Azure","Docker","Kubernetes","Terraform","GitHub Actions","Lambda","CI/CD"] },
              { label: "Web & Backend", techs: ["React","Next.js","Node.js","TypeScript","Express","REST APIs","GraphQL","Selenium","Python"] },
            ].map(cat => (
              <FadeIn key={cat.label}>
                <div style={{ padding: 24, borderRadius: 14, background: C.glass, border: `1px solid ${C.glassBorder}` }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: C.teal, marginBottom: 16, letterSpacing: ".1em", textTransform: "uppercase" }}>{cat.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {cat.techs.map(t => <span key={t} className="chip" style={{ padding: "5px 13px", borderRadius: 8, background: "rgba(255,255,255,.06)", border: `1px solid ${C.glassBorder}`, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.65)" }}>{t}</span>)}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </Wrap>
      </section>

      <section style={{ background: `linear-gradient(135deg,${C.blue},${C.violet})`, padding: "72px 0", textAlign: "center" }}>
        <Wrap>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 700, color: C.white, marginBottom: 14 }}>Let's work together</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.75)", maxWidth: 480, margin: "0 auto 32px" }}>We'd love to hear about what you're building.</p>
          <button className="btn-primary" onClick={() => go("contact")} style={{ padding: "16px 36px", borderRadius: 12, border: "none", cursor: "pointer", background: C.white, color: C.blue, fontSize: 16, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10 }}>Contact Us <ArrowRight size={18}/></button>
        </Wrap>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════
   CONTACT PAGE
   ════════════════════════════════════════════ */
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", service: "", message: "" });
  const [sent, setSent] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const submit = () => {
    const s = encodeURIComponent(`New Inquiry from ${form.name} — ${form.service || "General"}`);
    const b = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nCompany: ${form.company || "N/A"}\nService: ${form.service || "N/A"}\n\nMessage:\n${form.message}`);
    window.open(`mailto:contact@sidedataa.com?subject=${s}&body=${b}`, "_blank");
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  const inputStyle = { width: "100%", padding: "13px 16px", borderRadius: 11, background: "rgba(255,255,255,.06)", border: `1px solid ${C.glassBorder}`, color: C.white, fontSize: 15, fontFamily: "'Inter',sans-serif" };
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.55)", marginBottom: 7 };

  return (
    <div className="page-transition">
      <section style={{ background: `linear-gradient(160deg,${C.midnight},${C.navy})`, padding: "160px 0 100px", position: "relative", overflow: "hidden", minHeight: "100vh" }}>
        <div className="grid-bg" style={{ position: "absolute", inset: -60, opacity: .25 }} />
        <div style={{ position: "absolute", top: "20%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${C.blue}10,transparent 70%)`, animation: "pulse 8s ease infinite" }} />
        <Wrap style={{ position: "relative", zIndex: 1 }}>
          <FadeIn>
            <Label text="Get in touch" />
            <Title>Let's build something<br/>worth shipping</Title>
            <Desc>Tell us about your project — we'll respond within 24 hours with honest feedback on scope, timeline, and fit.</Desc>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 48 }}>
            <FadeIn>
              <div style={{ padding: 36, borderRadius: 22, background: C.glass, border: `1px solid ${C.glassBorder}`, backdropFilter: "blur(12px)" }}>
                {sent ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <CheckCircle size={52} color={C.teal} style={{ marginBottom: 18 }} />
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>Message ready!</h3>
                    <p style={{ color: "rgba(255,255,255,.55)", fontSize: 15 }}>Your email client should open with the details pre-filled. Just hit send!</p>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 6 }}>Send us a message</h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,.4)", marginBottom: 28 }}>Fill out the form and we'll be in touch</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <div><label style={labelStyle}>Full Name <span style={{ color: C.teal }}>*</span></label><input style={inputStyle} placeholder="Your name" value={form.name} onChange={e => set("name", e.target.value)} /></div>
                      <div><label style={labelStyle}>Email <span style={{ color: C.teal }}>*</span></label><input type="email" style={inputStyle} placeholder="you@company.com" value={form.email} onChange={e => set("email", e.target.value)} /></div>
                      <div><label style={labelStyle}>Company</label><input style={inputStyle} placeholder="Your company (optional)" value={form.company} onChange={e => set("company", e.target.value)} /></div>
                      <div>
                        <label style={labelStyle}>Service Interest</label>
                        <select style={{ ...inputStyle, color: form.service ? C.white : "rgba(255,255,255,.35)", appearance: "none" }} value={form.service} onChange={e => set("service", e.target.value)}>
                          <option value="" style={{ background: C.navy }}>Select a service</option>
                          {SERVICES.map(s => <option key={s.id} value={s.title} style={{ background: C.navy }}>{s.title}</option>)}
                          <option value="Multiple / Other" style={{ background: C.navy }}>Multiple / Other</option>
                        </select>
                      </div>
                      <div><label style={labelStyle}>Message <span style={{ color: C.teal }}>*</span></label><textarea rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} placeholder="Tell us about your project..." value={form.message} onChange={e => set("message", e.target.value)} /></div>
                      <button className="btn-primary" onClick={submit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "15px", borderRadius: 11, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.blue},${C.violet})`, color: "white", fontSize: 16, fontWeight: 600, fontFamily: "'Inter',sans-serif", marginTop: 4 }}><Send size={18}/>Send Message</button>
                    </div>
                  </>
                )}
              </div>
            </FadeIn>

            <FadeIn style={{ transitionDelay: ".15s" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {[
                  { icon: Mail, label: "Email", value: "contact@sidedataa.com", href: "mailto:contact@sidedataa.com" },
                  { icon: Globe, label: "Website", value: "sidedataa.com", href: "https://sidedataa.com" },
                  { icon: MapPin, label: "Location", value: "Toronto, Ontario, Canada" },
                  { icon: Linkedin, label: "LinkedIn", value: "SideData Technologies", href: "https://linkedin.com/company/sidedata-technologies" },
                  { icon: Clock, label: "Response Time", value: "Within 24 hours" },
                ].map(c => (
                  <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: C.glass, border: `1px solid ${C.glassBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <c.icon size={20} color={C.teal} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 3, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em" }}>{c.label}</div>
                      {c.href ? <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.8)", fontSize: 15, textDecoration: "none", fontWeight: 500 }}>{c.value}</a> : <span style={{ color: "rgba(255,255,255,.8)", fontSize: 15, fontWeight: 500 }}>{c.value}</span>}
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 24, padding: 28, borderRadius: 16, background: C.glass, border: `1px solid ${C.glassBorder}` }}>
                  <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 18 }}>Common Questions</h4>
                  {[
                    { q: "What's your typical project timeline?", a: "Most projects run 4-12 weeks depending on scope. We'll give you an honest estimate upfront." },
                    { q: "Do you work with startups?", a: "Absolutely. We work with everyone from early-stage startups to enterprise teams." },
                    { q: "Can you augment our existing team?", a: "Yes — we can embed with your team or run independently, whichever works better." },
                  ].map((faq, i) => (
                    <div key={i} style={{ marginBottom: i < 2 ? 18 : 0, paddingBottom: i < 2 ? 18 : 0, borderBottom: i < 2 ? `1px solid ${C.glassBorder}` : "none" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.75)", marginBottom: 6 }}>{faq.q}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,.45)" }}>{faq.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </Wrap>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const fn = () => { setScrolled(window.scrollY > 50); setShowTop(window.scrollY > 600); };
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const go = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const renderPage = () => {
    switch (page) {
      case "services": return <ServicesPage go={go} />;
      case "about": return <AboutPage go={go} />;
      case "contact": return <ContactPage />;
      default: return <HomePage go={go} />;
    }
  };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: C.lightBg, color: C.text, overflowX: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Nav page={page} go={go} scrolled={scrolled} />
      {renderPage()}
      <Footer go={go} />
      <button className={`back-top ${showTop ? "show" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={20}/></button>
    </div>
  );
}
