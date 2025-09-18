import * as admin from "firebase-admin";
import fetch from "node-fetch";
import PDFDocument from "pdfkit";
import getStream from "get-stream";
import { PassThrough } from "stream";
import cors from "cors";
import * as functions from "firebase-functions";

admin.initializeApp();

const corsHandler = cors({ origin: true });

interface SendReportEmailRequestBody {
  to: string;
  subject: string;
  reportId: string;
}

export const sendReportEmail = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method Not Allowed" });
      return;
    }

    const body = req.body as SendReportEmailRequestBody;

    const { to, subject, reportId } = body;

    if (!to || !reportId) {
      res.status(400).json({ error: "Missing 'to' or 'reportId'" });
      return;
    }

    try {
      // 1. Get report from Firestore
      const reportDoc = await admin.firestore().collection("reports").doc(reportId).get();

      if (!reportDoc.exists) throw new Error("Report not found");

      const data = reportDoc.data();
      const text = data?.extractedText;
;

      if (!text) throw new Error("Report has no text content");

      // 2. Generate PDF as readable stream
      const pdfDoc = new PDFDocument();
      const stream = new PassThrough();
      pdfDoc.pipe(stream);

      pdfDoc.fontSize(14).text("CFF C.L.E.A.R. System Report", { align: "center" });
      pdfDoc.moveDown();
      pdfDoc.fontSize(10).text(text, { align: "left" });
      pdfDoc.end();

      // Convert stream → Buffer

      const pdfBuffer: Buffer = await (getStream as unknown as { buffer: (s: NodeJS.ReadableStream) => Promise<Buffer> }).buffer(stream);

      // 3. Send with Trigger Email
      const response = await fetch("https://api.triggermail.io/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TRIGGER_API_KEY}`,
        },
        body: JSON.stringify({
          to,
          subject,
          text: "Please find your CFF CLEAR System Report attached.",
          attachments: [
            {
              filename: `Report_${reportId}.pdf`,
              content: pdfBuffer.toString("base64"),
              encoding: "base64",
              type: "application/pdf",
              disposition: "attachment",
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Trigger Email failed: ${response.statusText}`);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Email error:", err.message,err.stack);
      res.status(500).json({ error: err.message });
    }
  });
});
