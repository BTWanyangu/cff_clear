import React, { useState } from "react";
import Shell from "../components/Shell";
import { Card, Input, Select, Button } from "../components/UI";
import { lookupZip } from "../utils/zip";
import { ocrImageOrPDF } from "../utils/ocr";
import { parseContaminantValues } from "../utils/parsers";
import { auth, db, storage } from "../firebase";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const STATES = ["","AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function PublicUpload() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", street: "", suite: "", city: "", state: "", zip: "", email: "", phone: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onZipBlur() {
    if (form.zip?.length === 5) {
      try {
        const { city, state } = await lookupZip(form.zip);
        setForm(s => ({ ...s, city: s.city || city, state: s.state || state }));
      } catch (e) {}
    }
  }

  async function submit() {
    if (!file) return alert("Please attach a water report (PDF/image)");
    setBusy(true);
    try {
      await signInAnonymously(auth);

      const customerRef = await addDoc(collection(db, "customers"), {
        ...form,
        createdAt: serverTimestamp()
      });
      const customerId = customerRef.id;

      const storageRef = ref(storage, `reports/${customerId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      

      const extractedText = await ocrImageOrPDF(file);
      const parsed = parseContaminantValues(extractedText);

      await addDoc(collection(db, "reports"), {
        customerId,
        filename: file.name,
        storageUrl: url,
        extractedText: extractedText.slice(0, 70000),
        parsedValues: parsed,
        createdAt: serverTimestamp()
      });

      setDone(true);
    } catch (e: any) {
      console.error(e);
      alert("Upload failed: " + e?.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg px-4 py-12">
          <Card className="glass" title="Thanks — Report received">
            <p className="text-sm text-blue-900">We saved the report and will notify you when processed.</p>
            <div className="mt-4">
              <a className="text-sm text-blue-600 underline hover:text-blue-500" href="/">Submit another</a>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="glass-strong" title="Client Contact" subtitle="Only this page is visible to clients.">
          <div className="grid gap-6">
            {/* Form inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={(e:any)=>setForm({...form, firstName:e.target.value})} />
              <Input label="Last Name" value={form.lastName} onChange={(e:any)=>setForm({...form, lastName:e.target.value})} />
              <Input label="Street Address" value={form.street} onChange={(e:any)=>setForm({...form, street:e.target.value})} />
              <Input label="Suite/Apt" value={form.suite} onChange={(e:any)=>setForm({...form, suite:e.target.value})} />
              <Input label="City" value={form.city} onChange={(e:any)=>setForm({...form, city:e.target.value})} />
              <Select label="State" value={form.state} onChange={(e:any)=>setForm({...form, state:e.target.value})}>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Input label="Zip Code" value={form.zip} onBlur={onZipBlur} onChange={(e:any)=>setForm({...form, zip:e.target.value})} />
              <Input label="Email" value={form.email} onChange={(e:any)=>setForm({...form, email:e.target.value})} />
              <Input label="Phone" value={form.phone} onChange={(e:any)=>setForm({...form, phone:e.target.value})} />
            </div>

            {/* File upload */}
            <Button className="flex flex-col items-start gap-2 p-4 w-full bg-blue-100 text-blue-900 hover:bg-blue-200">
              Upload Water Report (PDF or image)
              <input
                className="mt-1 w-full text-sm text-blue-900"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e)=>setFile(e.target.files?.[0]||null)}
              />
            </Button>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
              <Button onClick={submit} disabled={busy} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white">
                {busy ? "Uploading…" : "Submit"}
              </Button>
              <span className="text-sm text-blue-900 sm:text-base">We’ll parse the report automatically.</span>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
