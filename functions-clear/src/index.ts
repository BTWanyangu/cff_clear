import * as functions from "firebase-functions";
import { sendReportEmail } from "./SendReportEmail";


// Deploy as HTTPS function
export const sendReportEmailFn = functions.https.onRequest(sendReportEmail);
