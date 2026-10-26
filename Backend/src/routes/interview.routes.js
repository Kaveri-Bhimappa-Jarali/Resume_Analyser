import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import interviewController from "../controllers/interview.controller.js";
import upload from "../middlewares/file.middleware.js";

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description generate new interview report
 * @access private
 */
interviewRouter.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  interviewController.generateInterViewReportController
);

/**
 * @route GET /api/interview/report/:interviewId
 */
interviewRouter.get(
  "/report/:interviewId",
  authMiddleware,
  interviewController.getInterviewReportByIdController
);

/**
 * @route GET /api/interview/
 */
interviewRouter.get(
  "/",
  authMiddleware,
  interviewController.getAllInterviewReportsController
);

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 */
interviewRouter.post(
  "/resume/pdf/:interviewReportId",
  authMiddleware,
  interviewController.generateResumePdfController
);

/**
 * @route POST /api/interview/:interviewId/practice
 */
interviewRouter.post(
  "/:interviewId/practice",
  authMiddleware,
  interviewController.handlePracticeRespondController
);

export default interviewRouter;