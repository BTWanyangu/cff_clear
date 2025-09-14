import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import Tesseract from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return text.trim();
}

export async function ocrImageOrPDF(file: File) {
  // try text extraction for PDFs
  if (file.type === "application/pdf") {
    try {
      const text = await extractTextFromPDF(file);
      if (text && text.length > 50) return text;
    } catch (e) {
      // fallback to OCR
    }

    // render pages to canvas and run Tesseract per page
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let all = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, canvas, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/png");
      const { data } = await Tesseract.recognize(dataUrl, "eng");
      all += (data?.text || "") + "\n";
    }
    return all.trim();
  } else {
    const { data } = await Tesseract.recognize(file, "eng");
    return (data?.text || "").trim();
  }
}
