'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileUser,
  Copy,
  Check,
  RefreshCw,
  Send,
  Briefcase,
  Download,
  Wand2,
} from 'lucide-react';

interface ResumeCoverLetterProps {
  onBack?: () => void;
}

type DocType = 'full-resume' | 'cover-letter';
type Tone = 'formal' | 'modern' | 'confident';

export default function ResumeCoverLetterTool({ onBack }: ResumeCoverLetterProps) {
  const [docType, setDocType] = useState<DocType>('full-resume');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState('2');
  const [applicantName, setApplicantName] = useState('');
  const [emailPhone, setEmailPhone] = useState('');
  const [education, setEducation] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState<Tone>('formal');

  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleTitles = [
    'NGO Executive / Trainer',
    'Web Developer',
    'Cybersecurity Analyst',
    'IT Instructor',
  ];

  const toneLabels: Record<Tone, string> = {
    formal: 'Formal & Traditional',
    modern: 'Modern & Concise',
    confident: 'Bold & Confident',
  };

  const buildPrompt = () => {
    const name = applicantName.trim() || 'Candidate';
    const target = companyName.trim() || 'the target company';
    const contact = emailPhone.trim() || 'Not specified';
    const skillList = skills.trim() || 'Not specified';
    const edu = education.trim() || 'Not specified';
    const jd = jobDescription.trim();

    const toneInstruction =
      tone === 'formal'
        ? 'Use a formal, traditional professional register with complete sentences and industry-standard phrasing.'
        : tone === 'modern'
        ? 'Use a modern, concise style: short punchy bullet points, active verbs, minimal filler words.'
        : 'Use a confident, achievement-forward style that foregrounds impact and results without sounding boastful.';

    const jdBlock = jd
      ? `\nJob Description to tailor against (mirror its key requirements and keywords naturally, do not copy verbatim):\n"""\n${jd}\n"""\n`
      : '';

    if (docType === 'full-resume') {
      return `You are an expert resume writer and former recruiter who specializes in ATS-friendly, achievement-driven resumes.

Write a complete, ready-to-use resume for the candidate below. Do not include any commentary, preamble, or explanation — output only the resume content.

CANDIDATE DETAILS
Name: ${name}
Target Job Title: ${jobTitle}
Target Company: ${target}
Contact Details: ${contact}
Key Skills: ${skillList}
Years of Experience: ${experienceYears}
Education: ${edu}
${jdBlock}
WRITING RULES
- ${toneInstruction}
- Every bullet under Work Experience must start with a strong action verb (e.g. "Led", "Built", "Reduced", "Designed") and, wherever the details allow, include a quantifiable result (%, numbers, time saved, revenue, users, scale). If real numbers aren't given, use plausible, clearly-labeled placeholders like "[X]%" rather than inventing hard facts as if they were confirmed.
- Keep bullets to one line each, no more than ~20 words.
- Avoid generic filler like "hardworking team player" — show it through accomplishments instead of claiming it.
- Naturally weave in keywords from the target job title (and job description, if provided) so the resume passes ATS keyword screening.
- If experience years is low (fresher/1 year), lean more heavily on projects, coursework, certifications, and transferable skills instead of padding fake work history.

OUTPUT FORMAT (use these exact section headers in all caps, each on its own line):
${name.toUpperCase()}
${contact}

OBJECTIVE
[2-3 sentence targeted summary tying the candidate's background to the ${jobTitle} role]

CORE SKILLS
[Comma or bullet separated list, grouped logically if possible e.g. Technical / Soft Skills]

WORK EXPERIENCE
[Reverse-chronological. If no real job history was given, create a section titled "PROJECTS & RELEVANT EXPERIENCE" instead, using realistic project-style entries derived from the skills provided]

EDUCATION
[Formatted cleanly]

ADDITIONAL INFORMATION
[Certifications, languages, tools, or relevant extras implied by the skills/education given]`;
    }

    return `You are an expert career coach who writes highly persuasive, tailored cover letters that get interviews.

Write a complete, ready-to-send cover letter for the candidate below. Do not include any commentary or explanation — output only the letter itself.

CANDIDATE DETAILS
Name: ${name}
Applying for: ${jobTitle}
Target Company: ${target}
Contact Details: ${contact}
Key Skills: ${skillList}
Years of Experience: ${experienceYears}
Education: ${edu}
${jdBlock}
WRITING RULES
- ${toneInstruction}
- Open with a specific, non-generic hook connected to the role or company — never start with "I am writing to apply for..."
- Middle paragraph(s): connect 2-3 concrete skills/experiences directly to what the role likely needs, with at least one specific example or outcome.
- Closing paragraph: confident call to action requesting an interview/next step.
- Keep it to 3-4 short paragraphs, under 350 words total.
- Include a proper formal salutation ("Dear Hiring Manager," unless a name is implied) and a professional sign-off with the candidate's name.
- Do not repeat the resume verbatim — this should read as a distinct, narrative complement to it.`;
  };

  const handleGenerate = async () => {
    if (!jobTitle.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setGeneratedOutput('');

    const prompt = buildPrompt();

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data?.text) {
        setGeneratedOutput(data.text.trim());
      } else if (data?.error) {
        setErrorMsg(data.error);
      } else {
        setErrorMsg('Could not generate the document. Please check your API configuration.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('AI server connection error. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedOutput) return;
    const blob = new Blob([generatedOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (applicantName.trim() || 'candidate').replace(/\s+/g, '_');
    a.href = url;
    a.download = `${safeName}_${docType === 'full-resume' ? 'resume' : 'cover_letter'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Lightweight renderer: makes ALL-CAPS section headers stand out instead of a flat <pre> block.
  const renderOutput = () => {
    const lines = generatedOutput.split('\n');
    return (
      <div className="space-y-1 text-xs leading-relaxed font-sans">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          const isHeader =
            trimmed.length > 1 &&
            trimmed.length < 40 &&
            trimmed === trimmed.toUpperCase() &&
            /[A-Z]/.test(trimmed) &&
            !/^[-•*\d]/.test(trimmed);

          if (isHeader) {
            return (
              <div
                key={i}
                className="pt-3 pb-1 mt-2 first:mt-0 font-bold text-violet-600 dark:text-violet-400 tracking-wide border-b border-violet-500/20"
              >
                {trimmed}
              </div>
            );
          }
          if (trimmed === '') return <div key={i} className="h-1" />;
          return (
            <div key={i} className="dark-text-main whitespace-pre-wrap">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Career Builder</span>
        </div>
        <h2 className="text-3xl font-bold dark-text-main">AI Resume & Cover Letter Builder</h2>
        <p className="dark-text-muted text-sm max-w-lg mx-auto">
          Generate complete, ATS-friendly resumes and tailored cover letters powered by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dark-card border rounded-2xl p-6 shadow-md space-y-4">
          <h3 className="text-lg font-bold dark-text-main flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-violet-500" />
            <span>Job & Personal Details</span>
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDocType('full-resume')}
              className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                docType === 'full-resume'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'dark-btn hover:border-violet-400'
              }`}
            >
              Full Resume
            </button>
            <button
              type="button"
              onClick={() => setDocType('cover-letter')}
              className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                docType === 'cover-letter'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'dark-btn hover:border-violet-400'
              }`}
            >
              Cover Letter
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold dark-text-main mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Sullab Sinha"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold dark-text-main mb-1">Target Job Title *</label>
              <input
                type="text"
                placeholder="e.g. IT Trainer / Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold dark-text-muted">Quick Job Titles:</span>
            <div className="flex flex-wrap gap-1">
              {sampleTitles.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setJobTitle(t)}
                  className="text-xs px-2 py-1 rounded-lg dark-btn border hover:border-violet-400 text-left cursor-pointer"
                >
                  💼 {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold dark-text-main mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="e.g. NIIT Foundation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold dark-text-main mb-1">Contact Info / Email</label>
              <input
                type="text"
                placeholder="e.g. email@gmail.com | Phone"
                value={emailPhone}
                onChange={(e) => setEmailPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main">Key Skills (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Training, Linux, OSINT, React"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold dark-text-main mb-1">Education / Degree</label>
              <input
                type="text"
                placeholder="e.g. Bachelor Degree"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold dark-text-main mb-1">Experience</label>
              <select
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-3 py-2 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="1">Fresher / 1 Year</option>
                <option value="2">2 - 3 Years</option>
                <option value="5">5+ Years</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-violet-500" />
              Writing Tone
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(toneLabels) as Tone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-1.5 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    tone === t
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'dark-btn hover:border-violet-400'
                  }`}
                >
                  {toneLabels[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold dark-text-main">
              Paste Job Description <span className="dark-text-muted font-normal">(optional, but improves matching)</span>
            </label>
            <textarea
              placeholder="Paste the job posting here so the AI can tailor keywords and requirements..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input border text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !jobTitle.trim()}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Document...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate {docType === 'full-resume' ? 'Full Resume' : 'Cover Letter'}</span>
              </>
            )}
          </button>
        </div>

        <div className="dark-card border rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold dark-text-main">Generated Document</h3>
              {generatedOutput && !loading && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    title="Regenerate"
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-violet-500 hover:text-white text-xs font-medium transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-violet-500 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-violet-500 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
                <p className="text-sm dark-text-muted font-medium">AI is crafting your document...</p>
              </div>
            ) : errorMsg ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-sm text-red-500 font-medium">{errorMsg}</p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : generatedOutput ? (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[500px] overflow-y-auto">
                {renderOutput()}
              </div>
            ) : (
              <div className="text-center py-20 dark-text-muted space-y-2">
                <FileUser className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">Your generated {docType === 'full-resume' ? 'resume' : 'cover letter'} will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
