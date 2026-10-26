import axios from "axios";

const ML_API = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

async function testMlService() {
  console.log("Testing ML service at:", ML_API);

  const health = await axios.get(ML_API);
  console.log("Health:", health.data);

  const analyze = await axios.post(`${ML_API}/analyze`, {
    resume:
      "Full stack developer skilled in JavaScript, React, Node.js, Express, and MongoDB.",
    job_description: "Seeking a MERN stack developer with React and Node experience.",
  });
  console.log("Analyze score:", analyze.data.job_match_score);
  console.log("Skills:", analyze.data.resume_analysis?.detected_skills);

  const moderate = await axios.post(`${ML_API}/moderate`, {
    text: "thanks for sharing interview preparation tips",
  });
  console.log("Moderation:", moderate.data);

  console.log("ML service tests passed.");
}

testMlService().catch((error) => {
  console.error("ML service test failed:", error.response?.data || error.message);
  process.exit(1);
});
