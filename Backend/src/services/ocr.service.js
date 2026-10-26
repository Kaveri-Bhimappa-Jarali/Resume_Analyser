import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import puppeteer from "puppeteer";

const MIN_TEXT_LENGTH = 80;

async function extractPdfTextLayer(buffer) {
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
  }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    text += strings.join(" ") + " ";
  }

  return text.trim();
}

async function extractPdfParseText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text?.trim() || "";
  } finally {
    await parser.destroy();
  }
}

async function ocrImageBuffer(buffer) {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(buffer);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

async function renderPdfPagesToImages(buffer) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const base64 = buffer.toString("base64");

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        </head>
        <body>
          <canvas id="canvas"></canvas>
        </body>
      </html>
    `);

    await page.waitForFunction(() => typeof pdfjsLib !== "undefined");

    return page.evaluate(async (pdfBase64) => {
      const binary = atob(pdfBase64);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const images = [];
      const canvas = document.getElementById("canvas");

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const pdfPage = await pdf.getPage(pageNum);
        const viewport = pdfPage.getViewport({ scale: 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await pdfPage.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        }).promise;

        images.push(canvas.toDataURL("image/png"));
      }

      return images;
    }, base64);
  } finally {
    await browser.close();
  }
}

async function ocrPdfPages(buffer) {
  const pageImages = await renderPdfPagesToImages(buffer);
  const chunks = [];

  for (const dataUrl of pageImages) {
    const imgBuffer = Buffer.from(dataUrl.split(",")[1], "base64");
    const pageText = await ocrImageBuffer(imgBuffer);
    if (pageText) chunks.push(pageText);
  }

  return chunks.join("\n").trim();
}

/**
 * Extract text from resume uploads using pdfjs text-layer parsing,
 * pdf-parse fallback, and Tesseract OCR for scanned PDFs and images.
 */
export async function extractTextFromResume(buffer, mimetype) {
  if (!buffer?.length) {
    throw new Error("Empty file received.");
  }

  if (mimetype === "application/pdf") {
    const textLayer = await extractPdfTextLayer(buffer);

    if (textLayer.length >= MIN_TEXT_LENGTH) {
      return { text: textLayer, method: "pdf-text-layer" };
    }

    const parsedText = await extractPdfParseText(buffer);
    const parsedCombined = [textLayer, parsedText].filter(Boolean).join("\n").trim();

    if (parsedCombined.length >= MIN_TEXT_LENGTH) {
      return { text: parsedCombined, method: "pdf-parse" };
    }

    const ocrText = await ocrPdfPages(buffer);
    const combined = [parsedCombined, ocrText].filter(Boolean).join("\n").trim();

    if (!combined) {
      throw new Error(
        "Could not extract text from PDF. Try a clearer scan or a text-based PDF."
      );
    }

    return { text: combined, method: "ocr" };
  }

  if (mimetype?.startsWith("image/")) {
    const ocrText = await ocrImageBuffer(buffer);

    if (!ocrText) {
      throw new Error("Could not extract text from image.");
    }

    return { text: ocrText, method: "ocr" };
  }

  throw new Error("Unsupported file type. Upload a PDF or image (JPG, PNG, WEBP).");
}
