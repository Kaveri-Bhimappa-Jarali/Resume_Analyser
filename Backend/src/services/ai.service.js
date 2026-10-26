import axios from "axios";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import puppeteer from "puppeteer";

/* ---------------- SAFE JSON PARSER ---------------- */

function extractJSON(text) {
  try {
    let cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("No JSON found");
    }

    const jsonString = cleaned.slice(start, end + 1);

    return JSON.parse(jsonString);
  } catch (err) {
    console.error("❌ AI RAW RESPONSE:\n", text);
    throw new Error("Invalid JSON returned by AI");
  }
}

/* ---------------- GEMINI REST CLIENT HELPER ---------------- */

async function callGemini(prompt) {
  const geminiApiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GOOGLE_GENAI_API_KEY is not configured in the environment variables.");
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`;
  
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  }, {
    headers: {
      "Content-Type": "application/json"
    },
    timeout: 60000
  });

  if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Invalid response received from Gemini API");
  }

  return response.data.candidates[0].content.parts[0].text;
}

/* ---------------- SCHEMA ---------------- */

const interviewReportSchema = z.object({
  matchScore: z.number(),
  title: z.string(),

  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    })
  ),

  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    })
  ),

  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),

  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()),
    })
  ),
});

function buildFallbackReport({ resumeAnalysis, jobDescription }) {
  const skills =
    resumeAnalysis?.resume_skills?.length > 0
      ? resumeAnalysis.resume_skills
      : ["JavaScript", "React", "Node.js", "SQL", "System Design", "Git"];
  const primarySkill = skills[0] || "Core Engineering";
  const secondarySkill = skills[1] || "Backend Architecture";
  const tertiarySkill = skills[2] || "Database Management";
  const rawGaps =
    resumeAnalysis?.skillGaps?.length > 0
      ? resumeAnalysis.skillGaps
      : [
          { skill: "System Scalability & Architecture", severity: "medium" },
          { skill: "Automated Testing & CI/CD", severity: "medium" },
          { skill: "Cloud Deployment & Observability", severity: "low" },
        ];

  const title =
    jobDescription?.split("\n")[0]?.trim()?.slice(0, 60) ||
    `${primarySkill} & ${secondarySkill} Technical Strategy`;

  return {
    matchScore: resumeAnalysis?.job_match_score ?? 72,
    title,
    technicalQuestions: [
      {
        question: `How do you architect and optimize production applications using ${primarySkill}?`,
        intention: `Assess practical depth, performance tuning, and architectural patterns in ${primarySkill}.`,
        answer: `Discuss modular design, state/data flow management, profiling bottlenecks, caching strategies, and error boundaries used in real-world ${primarySkill} projects.`,
      },
      {
        question: `Explain how ${secondarySkill} integrates with ${tertiarySkill} in a high-throughput environment.`,
        intention: `Evaluate cross-stack integration knowledge, data consistency, and latency handling.`,
        answer: `Cover connection pooling, asynchronous processing, schema indexing, payload validation, and retry/circuit-breaker patterns between ${secondarySkill} and ${tertiarySkill}.`,
      },
      {
        question: `What strategies do you use to secure APIs and protect sensitive data in your stack?`,
        intention: `Verify security awareness including authentication, authorization, and input sanitization.`,
        answer: `Detail JWT/session rotation, RBAC, rate limiting, CORS policies, parameterized queries, and encryption in transit and at rest.`,
      },
      {
        question: `Walk through how you debug a memory leak or sudden latency spike in production.`,
        intention: `Test diagnostic methodology, observability tooling, and systematic root-cause analysis.`,
        answer: `Explain capturing heap snapshots/flame graphs, inspecting APM metrics and structured logs, isolating recent deployments, reproducing under load, and deploying targeted fixes.`,
      },
      {
        question: `How do you design automated tests to ensure reliability before deployment?`,
        intention: `Check engineering rigor across unit, integration, and end-to-end testing layers.`,
        answer: `Describe the testing pyramid: fast unit tests for business logic, integration tests for API/database contracts, and CI pipeline gates prior to release.`,
      },
    ],
    behavioralQuestions: [
      {
        question: `Tell me about a challenging technical problem you solved using ${primarySkill} under a tight deadline.`,
        intention: `Evaluate problem prioritization, ownership, and delivery under pressure.`,
        answer: `Use the STAR method: outline the production constraint, how you broke down the root cause, the trade-offs communicated to stakeholders, and the measurable outcome.`,
      },
      {
        question: `Describe a time you disagreed with a teammate on an architectural decision. How was it resolved?`,
        intention: `Assess collaboration, objective communication, and team alignment.`,
        answer: `Focus on data-driven comparison, prototyping benchmarks, listening to maintainability concerns, and aligning on the best long-term solution for the team.`,
      },
      {
        question: `How do you approach learning a new technology or framework required for a project?`,
        intention: `Gauge adaptability and structured learning habits.`,
        answer: `Explain reading official documentation, building a focused proof-of-concept, reviewing production best practices, and iterating with code reviews.`,
      },
      {
        question: `Share an example of when you improved an existing codebase's performance or developer experience.`,
        intention: `Look for proactive engineering initiative and impact beyond assigned tickets.`,
        answer: `Highlight identifying a recurring bottleneck, refactoring legacy modules incrementally, adding test coverage, and documenting the improvements.`,
      },
      {
        question: `How do you communicate complex technical constraints to non-technical stakeholders?`,
        intention: `Verify cross-functional communication and business awareness.`,
        answer: `Translate technical trade-offs into user impact, timeline options, and risk mitigation rather than low-level implementation jargon.`,
      },
    ],
    skillGaps: rawGaps,
    preparationPlan: [
      {
        day: 1,
        focus: `${primarySkill} Core Internals & Architecture`,
        tasks: [
          `Review advanced ${primarySkill} patterns, lifecycle mechanics, and performance optimization`,
          `Audit your recent resume projects and prepare concise architectural walkthroughs`,
          `Practice 3 medium-to-hard technical questions focused on ${primarySkill}`,
        ],
      },
      {
        day: 2,
        focus: `${secondarySkill} & API System Design`,
        tasks: [
          `Study scalable service design, middleware pipelines, and error handling in ${secondarySkill}`,
          `Design a fault-tolerant REST/realtime architecture matching the target role`,
          `Review authentication, caching, and rate-limiting implementation details`,
        ],
      },
      {
        day: 3,
        focus: `${tertiarySkill}, Data Modeling & Gap Remediation`,
        tasks: [
          `Deep dive into query optimization, indexing strategies, and data consistency in ${tertiarySkill}`,
          `Address key identified skill gaps: ${rawGaps.map((g) => g.skill).slice(0, 2).join(", ") || "Testing & Cloud"}`,
          `Build or review a small module demonstrating clean data layer patterns`,
        ],
      },
      {
        day: 4,
        focus: `Testing, Security & Production Readiness`,
        tasks: [
          `Review unit and integration testing workflows and CI/CD deployment pipelines`,
          `Practice debugging scenarios: latency bottlenecks, race conditions, and error recovery`,
          `Refine resume bullet points to highlight quantifiable engineering metrics`,
        ],
      },
      {
        day: 5,
        focus: `Full Mock Interview & Behavioral Alignment`,
        tasks: [
          `Structure 5 STAR-method stories covering leadership, conflict resolution, and technical impact`,
          `Complete a full timed session in the AI Mock Interview simulator`,
          `Review final weak spots and prepare insightful questions for the interviewer`,
        ],
      },
    ],
  };
}

/* ---------------- INTERVIEW REPORT ---------------- */

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
  resumeAnalysis,
}) {
  const fallback = buildFallbackReport({ resumeAnalysis, jobDescription });

  const skillsHint = resumeAnalysis?.resume_skills?.length
    ? `\nDetected Skills (from ML analysis): ${resumeAnalysis.resume_skills.join(", ")}`
    : "";

  const matchHint =
    resumeAnalysis?.job_match_score != null
      ? `\nJob Match Score (from ML analysis): ${resumeAnalysis.job_match_score}%`
      : "";

  const prompt = `
You are an expert AI interview coach.

Return ONLY valid JSON matching this schema:
${JSON.stringify(zodToJsonSchema(interviewReportSchema))}

Rules:
- Do NOT include markdown formatting wrappers outside of the JSON block
- Do NOT include conversational explanations
- ALWAYS include ALL fields in the JSON object
- technicalQuestions: minimum 5
- behavioralQuestions: minimum 5
- preparationPlan: 5 days
- Use the ML analysis hints below when generating skillGaps and matchScore

Candidate Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
${skillsHint}${matchHint}
`;

  try {
    const text = await callGemini(prompt);
    const parsed = extractJSON(text);
    const validated = interviewReportSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("⚠️ Schema validation error:", validated.error);

      return {
        matchScore: parsed.matchScore ?? fallback.matchScore,
        title: parsed.title || fallback.title,
        technicalQuestions:
          parsed.technicalQuestions?.length > 0
            ? parsed.technicalQuestions
            : fallback.technicalQuestions,
        behavioralQuestions:
          parsed.behavioralQuestions?.length > 0
            ? parsed.behavioralQuestions
            : fallback.behavioralQuestions,
        skillGaps:
          parsed.skillGaps?.length > 0 ? parsed.skillGaps : fallback.skillGaps,
        preparationPlan:
          parsed.preparationPlan?.length > 0
            ? parsed.preparationPlan
            : fallback.preparationPlan,
      };
    }

    return validated.data;
  } catch (error) {
    console.error("❌ AI GENERATION FAILED:", error.message);
    return fallback;
  }
}

/* ---------------- PDF GENERATION ---------------- */

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

/* ---------------- RESUME PDF ---------------- */

async function generateResumePdf({
  resume,
  selfDescription,
  jobDescription,
}) {
  const resumePdfSchema = z.object({
    html: z.string(),
  });

  const prompt = `
You are a professional resume writer.

Return ONLY valid JSON matching this schema:
${JSON.stringify(zodToJsonSchema(resumePdfSchema))}

Rules:
- Do NOT include markdown outside of the JSON block
- Generate a beautiful, clean, ATS-friendly HTML resume inside the 'html' field.

Candidate Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

  try {
    const text = await callGemini(prompt);
    const jsonContent = extractJSON(text);
    const validated = resumePdfSchema.safeParse(jsonContent);

    if (!validated.success) {
      throw new Error("Invalid resume JSON format");
    }

    return await generatePdfFromHtml(validated.data.html);
  } catch (error) {
    console.error("❌ RESUME PDF FAILED:", error.message);
    throw new Error("Resume generation failed");
  }
}

/* ---------------- INTERVIEW PRACTICE ---------------- */

const practiceEvaluationSchema = z.object({
  feedback: z.string(),
  score: z.number().min(1).max(10),
  finalSummary: z.string().optional(),
});

async function evaluateInterviewAnswer({
  resume,
  jobDescription,
  questionText,
  userAnswer,
  isFinished,
}) {
  const prompt = `
You are an expert interviewer evaluating a candidate's response to an interview question.

Candidate Resume Context:
${resume}

Job Description Context:
${jobDescription}

Question: "${questionText}"
Candidate's Answer: "${userAnswer}"

Please evaluate this answer.
Instructions:
- Rate the answer from 1 to 10 based on standard industry expectations.
- Provide a brief, constructive feedback (under 3 sentences) explaining what was good, what was missing (such as key technologies or methodologies), or how to improve.
${
  isFinished
    ? "- Since this is the final question, also provide a final summary of their performance and mock interview readiness (maximum 4-5 sentences) summarizing their strengths and areas of development."
    : ""
}

Return ONLY valid JSON matching this schema:
${JSON.stringify(zodToJsonSchema(practiceEvaluationSchema))}
`;

  try {
    const text = await callGemini(prompt);
    const parsed = extractJSON(text);
    return parsed;
  } catch (error) {
    console.error("❌ PRACTICE EVALUATION FAILED:", error.message);
    return {
      feedback: "Failed to generate AI evaluation. Please try again.",
      score: 5,
      finalSummary: isFinished ? "Practice session completed." : undefined,
    };
  }
}

export { generateInterviewReport, generateResumePdf, evaluateInterviewAnswer };