import * as functions from "firebase-functions";
import nodemailer from "nodemailer";

const smtpUser = functions.config().smtp?.user;
const smtpPass = functions.config().smtp?.pass;
const smtpHost = functions.config().smtp?.host || "smtp.gmail.com";
const smtpPort = Number(functions.config().smtp?.port || 465);
const fromAddress = functions.config().smtp?.from || smtpUser;

if (!smtpUser || !smtpPass) {
  console.warn("SMTP config not set. Use `firebase functions:config:set smtp.user=... smtp.pass=...`");
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass }
});

export const sendReportEmail = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    const { to, subject, text, html } = req.body;
    if (!to) {
      res.status(400).send("Missing 'to' field");
      return;
    }

    const mail = {
      from: fromAddress,
      to,
      subject: subject || "CFF CLEAR Report",
      text: text || "",
      html: html || `<pre>${text || ""}</pre>`
    };

    const info = await transporter.sendMail(mail);
    res.status(200).json({ success: true, info });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ success: false, error: e?.message });
  }
});

