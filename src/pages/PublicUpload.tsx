import { useState } from "react";
import Shell from "../components/Shell";
import { Card, Input, Select, Button } from "../components/UI";
import { lookupZip } from "../utils/zip";
import { ocrImageOrPDF } from "../utils/ocr";
import { parseContaminantValues } from "../utils/parsers";
import { auth, db, storage } from "../firebase";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

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
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <Card className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Thanks — Report Received</h2>
                <p className="text-gray-600 mb-6">We saved the report and will notify you when processed.</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  Submit Another Report
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="min-h-screen bg-white flex items-center justify-center rounded-xl p-4">        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Water Quality Report Upload</h1>
            <p className="text-gray-600">Submit your water quality report for analysis</p>
          </div>

          <Card className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Client Information</h2>
              <p className="text-sm text-gray-600">Please provide your contact details</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Input 
                label="First Name" 
                value={form.firstName} 
                onChange={(e:any)=>setForm({...form, firstName:e.target.value})}
          
              />
              <Input 
                label="Last Name" 
                value={form.lastName} 
                onChange={(e:any)=>setForm({...form, lastName:e.target.value})}
          
              />
              <Input 
                label="Street Address" 
                value={form.street} 
                onChange={(e:any)=>setForm({...form, street:e.target.value})}
          
              />
              <Input 
                label="Suite/Apt" 
                value={form.suite} 
                onChange={(e:any)=>setForm({...form, suite:e.target.value})}
          
              />
              <Input 
                label="City" 
                value={form.city} 
                onChange={(e:any)=>setForm({...form, city:e.target.value})}
          
              />
              <Select 
                label="State" 
                value={form.state} 
                onChange={(e:any)=>setForm({...form, state:e.target.value})}
          
              >
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Input 
                label="Zip Code" 
                value={form.zip} 
                onBlur={onZipBlur} 
                onChange={(e:any)=>setForm({...form, zip:e.target.value})}
          
              />
              <Input 
                label="Email" 
                type="email"
                value={form.email} 
                onChange={(e:any)=>setForm({...form, email:e.target.value})}
          
              />
              <Input 
                label="Phone" 
                value={form.phone} 
                onChange={(e:any)=>setForm({...form, phone:e.target.value})}
          
              />
            </div>

            {/* File upload */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Water Report</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  id="file-upload"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e)=>setFile(e.target.files?.[0]||null)}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  </svg>
                  <p className="text-sm text-gray-600 mb-1">
                    {file ? file.name : "Click to upload water report (PDF or image)"}
                  </p>
                  <p className="text-xs text-gray-500">We'll parse the report automatically</p>
                </label>
              </div>
            </div>

            {/* Submit button */}
            <Button 
              onClick={submit} 
              disabled={busy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              ) : "Submit Report"}
            </Button>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

