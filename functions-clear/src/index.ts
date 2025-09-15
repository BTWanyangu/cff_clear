import * as functions from "firebase-functions";

export const sendReportEmail = functions.https.onRequest((req, res) => {
  res.send("Email function works!");
});

