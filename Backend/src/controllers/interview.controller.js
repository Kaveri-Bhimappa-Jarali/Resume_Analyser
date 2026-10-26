import {
  generateInterviewReport,
  generateResumePdf,
  evaluateInterviewAnswer,
} from "../services/ai.service.js";

import interviewReportModel from "../models/interviewReport.model.js";
import { extractTextFromResume } from "../services/ocr.service.js";
import { analyzeResume } from "../services/resume.service.js";

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
  try {
    const { selfDescription, jobDescription, mode = "full" } = req.body;

    if (!req.file && !selfDescription?.trim()) {
      return res.status(400).json({
        message: "Please upload a resume file or provide a profile description.",
      });
    }

    /* ---------------- OCR / TEXT EXTRACTION ---------------- */

    let resumeText = selfDescription || "";
    if (req.file) {
      const extracted = await extractTextFromResume(
        req.file.buffer,
        req.file.mimetype
      );
      resumeText = extracted.text;
      console.log(`Resume text extracted via ${extracted.method}`);
    }

    /* ---------------- ML ANALYSIS ---------------- */

    let resumeAnalysis;

    try {
      resumeAnalysis = await analyzeResume(resumeText, jobDescription);
      console.log("Resume Analysis:", resumeAnalysis);
    } catch (error) {
      console.error("Resume ML Service Error:", error);

      // fallback instead of crash
      resumeAnalysis = {
        resume_skills: [],
        recommended_jobs: [],
        career_paths: [],
        skillGaps: [],
        live_jobs: [],
        job_match_score: 0,
        failed: true,
      };
    }

    const matchScore = resumeAnalysis?.job_match_score ?? 0;

    /* ---------------- AI STRATEGY & ROADMAP GENERATION ---------------- */

    const interViewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
      resumeAnalysis,
    });

    const title =
      jobDescription?.split("\n")[0]?.trim()?.slice(0, 60) ||
      interViewReportByAi?.title ||
      (mode === "analysis" ? "Resume Analysis Report" : "Interview Strategy Report");

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      title,
      resume: resumeText,
      selfDescription,
      jobDescription,

      resumeAnalysis: {
        resume_skills: resumeAnalysis.resume_skills || [],
        recommended_jobs: resumeAnalysis.recommended_jobs || [],
        career_paths: resumeAnalysis.career_paths || [],
      },

      matchScore: matchScore || interViewReportByAi.matchScore || 0,

      skillGaps:
        interViewReportByAi.skillGaps?.length > 0
          ? interViewReportByAi.skillGaps
          : resumeAnalysis.skillGaps || [],

      technicalQuestions: interViewReportByAi.technicalQuestions || [],

      behavioralQuestions: interViewReportByAi.behavioralQuestions || [],

      preparationPlan: interViewReportByAi.preparationPlan || [],

      live_jobs: resumeAnalysis.live_jobs || resumeAnalysis.liveJobs || [],
    });

    res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("Generate Interview Report Error:", error);

    res.status(500).json({
      message: "Server error while generating interview report",
      error: error.message,
    });
  }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found.",
      });
    }

    // Backfill technical questions, behavioral questions, and preparation roadmap for older reports if missing
    if (
      !interviewReport.technicalQuestions?.length ||
      !interviewReport.preparationPlan?.length
    ) {
      const generated = await generateInterviewReport({
        resume: interviewReport.resume || "",
        selfDescription: interviewReport.selfDescription || "",
        jobDescription: interviewReport.jobDescription || "",
        resumeAnalysis: {
          resume_skills: interviewReport.resumeAnalysis?.resume_skills || [],
          job_match_score: interviewReport.matchScore || 0,
          skillGaps: interviewReport.skillGaps || [],
        },
      });

      if (!interviewReport.technicalQuestions?.length) {
        interviewReport.technicalQuestions = generated.technicalQuestions || [];
      }
      if (!interviewReport.behavioralQuestions?.length) {
        interviewReport.behavioralQuestions = generated.behavioralQuestions || [];
      }
      if (!interviewReport.preparationPlan?.length) {
        interviewReport.preparationPlan = generated.preparationPlan || [];
      }
      if (!interviewReport.skillGaps?.length && generated.skillGaps?.length) {
        interviewReport.skillGaps = generated.skillGaps;
      }

      await interviewReport.save();
    }

    res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("Get Interview Report Error:", error);

    res.status(500).json({
      message: "Server error while fetching interview report",
      error: error.message,
    });
  }
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
  const interviewReports = await interviewReportModel
    .find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .select(
      "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
    );

  res.status(200).json({
    message: "Interview reports fetched successfully.",
    interviewReports,
  });
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params;

    const interviewReport =
      await interviewReportModel.findById(interviewReportId);

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found.",
      });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Generate Resume PDF Error:", error);

    res.status(500).json({
      message: "Server error while generating resume PDF",
      error: error.message,
    });
  }
}

/**
 * @description Controller to evaluate a mock interview answer.
 */
async function handlePracticeRespondController(req, res) {
  try {
    const { interviewId } = req.params;
    const { type, currentQuestionIndex, userAnswer } = req.body;

    if (userAnswer === undefined || userAnswer === null || userAnswer.trim() === "") {
      return res.status(400).json({
        message: "User answer is required.",
      });
    }

    const report = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });

    if (!report) {
      return res.status(404).json({
        message: "Interview report not found.",
      });
    }
    const questions = type === "technical" ? report.technicalQuestions : report.behavioralQuestions;
    
    if (!questions || questions.length === 0) {
      return res.status(400).json({
        message: "No questions generated for this category.",
      });
    }

    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
      return res.status(400).json({
        message: "Invalid question index.",
      });
    }

    const questionText = questions[currentQuestionIndex].question;
    const isFinished = currentQuestionIndex === questions.length - 1;

    const evaluation = await evaluateInterviewAnswer({
      resume: report.resume,
      jobDescription: report.jobDescription,
      questionText,
      userAnswer,
      isFinished,
    });

    return res.status(200).json({
      success: true,
      feedback: evaluation.feedback,
      score: evaluation.score,
      isFinished,
      finalSummary: evaluation.finalSummary || null,
      nextQuestion: isFinished ? null : questions[currentQuestionIndex + 1].question,
    });
  } catch (error) {
    console.error("Evaluate Practice Answer Controller Error:", error);
    return res.status(500).json({
      message: "Server error while evaluating practice answer.",
      error: error.message,
    });
  }
}

export default {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
  handlePracticeRespondController,
};
