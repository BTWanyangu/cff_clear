import  { useEffect, useState, useMemo } from "react";
import Shell from "../components/Shell";
import { Card, Button, Input, Select } from "../components/UI";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { parseContaminantValues } from "../utils/parsers";
import { computeClearScore, computeWaterMainScore } from "../utils/scoring";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [waterMain, setWaterMain] = useState({ ageYears: 40, material: "cast_iron", upgradedPct: 10 });
  const limits = { "Lead (ppm)": 0.015, "Copper (ppm)": 1.3, "Nitrate (ppm)": 10, "Arsenic (ppb)": 10, "PFOA (ppt)": 4, "PFOS (ppt)": 4, "pH": 8.5 };
  const navigate=useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async(snap) => {
      const rows: any[] = [];
      const customerIds=new Set<string>()

      snap.forEach(d=>{
          // const reportData={id:d.id, ...d.data()}
          //  rows.push(reportData)
       const data=d.data()
       rows.push({id:d.id,...data})
    //TODO: Ensure that the the reportData.id works with the customer id not report id
    if(data.customerId){
      customerIds.add(data.customerId)
    }
      })
    // snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
      setReports(rows);

    
    });
    return () => unsub();
  }, []);

  const handleSignOut=async()=>{
    try{
      await signOut(auth)
      navigate("/admin/login")
    }catch(error){
      console.error("Error signing out:",error)
    }
    
  }

  async function openReport(r: any) {
    setSelected(r);
    const c = await getDoc(doc(db, "customers", r.customerId));
    setCustomer({ id: c.id, ...(c.data() as any) });
    // parse if needed
    const parsed = r.parsedValues || parseContaminantValues(r.extractedText || "");
    // update zipStats (light aggregation)
    await setDoc(doc(db, "zipStats", (c.data() as any).zip), { lastUpdated: new Date().toISOString() }, { merge: true });
    // persist parsed back (optional)
    try { await setDoc(doc(db, "reports", r.id), { parsedValues: parsed }, { merge: true }); } catch {}
  }

  const parsed = selected?.parsedValues || {};
  const clear = useMemo(()=>computeClearScore(parsed, limits), [selected]);
  const mainScore = useMemo(()=>computeWaterMainScore(waterMain), [waterMain]);

  async function sendEmail() {
    if (!customer?.email) return alert("No customer email");
    try {
      // POST to cloud function
      await fetch("/sendReportEmail", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          to: customer.email,
          subject: `CFF CLEAR Report for ${customer.firstName} ${customer.lastName}`,
          text: `Your CLEAR Score: ${clear.score}\nWater Main Score: ${mainScore}`
        })
      });
      alert("Email request sent");
    } catch (e: any) {
      alert("Email failed: " + e?.message);
    }
  }

  if (!ready) return <Shell><p>Loading…</p></Shell>;
  if (!user) return <Shell><p>Please sign in via /admin/login</p></Shell>;

  return (
    <Shell>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <div className="flex-1" />
        <Button onClick={handleSignOut}>Sign out</Button>
      </div>

      {!selected ? (
        <Card title="Recent Uploads">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-400">
                <tr>
                  <th className="p-2">When</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">File</th>
                  </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="cursor-pointer hover:bg-neutral-800/40" onClick={()=>openReport(r)}>
                    <td className="p-2">{r.createdAt?.toDate?.().toLocaleString?.() || "—"}</td>
                    <td className="p-2">{r.customerId}</td>
                    <td className="p-2 underline">{r.filename}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <Button onClick={()=>setSelected(null)}>← Back</Button>
            <div className="flex-1" />
            <Button onClick={()=>window.print()}>Print / Save PDF</Button>
            <Button onClick={sendEmail}>Email (via server)</Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Customer">
              <div className="text-sm text-neutral-300">
                <p className="font-medium">{customer?.firstName} {customer?.lastName}</p>
                <p>{customer?.street} {customer?.suite}</p>
                <p>{customer?.city}, {customer?.state} {customer?.zip}</p>
                <p>{customer?.email} · {customer?.phone}</p>
              </div>
            </Card>

            <Card title="Parsed Values">
              <div className="text-sm text-neutral-300">
                {Object.keys(parsed).length ? (
                  <ul className="space-y-1">
                    {Object.entries(parsed).map(([k,v]) => <li key={k} className="flex justify-between"><span>{k}</span><span>{String(v)}</span></li>)}
                  </ul>
                ) : <p className="text-neutral-400">No values detected yet.</p>}
              </div>
            </Card>

            <Card title="ZIP Intelligence">
              <div className="text-sm text-neutral-300">
                <p className="text-neutral-400">Historical data can be shown here (zipStats)</p>
              </div>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title="Water Main Infrastructure">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Age of mains (years)" type="number" value={waterMain.ageYears} onChange={(e:any)=>setWaterMain({...waterMain, ageYears:Number(e.target.value)})} />
                <Select label="Primary material" value={waterMain.material} onChange={(e:any)=>setWaterMain({...waterMain, material:e.target.value})}>
                  <option value="lead">Lead</option>
                  <option value="galvanized">Galvanized</option>
                  <option value="cast_iron">Cast Iron</option>
                  <option value="ductile_iron">Ductile Iron</option>
                  <option value="copper">Copper</option>
                  <option value="pvc">PVC</option>
                  <option value="hdpe">HDPE</option>
                  <option value="unknown">Unknown</option>
                </Select>
                <Input label="% upgraded in last 10y" type="number" value={waterMain.upgradedPct} onChange={(e:any)=>setWaterMain({...waterMain, upgradedPct:Number(e.target.value)})} />
                <div>
                  <div className="text-sm text-neutral-300">Water Main C.L.E.A.R. Score</div>
                  <div className="mt-2 text-3xl font-bold text-amber-300">{computeWaterMainScore(waterMain)}</div>
                </div>
              </div>
            </Card>

            <Card title="Overall CLEAR Score">
              <div className="flex items-center gap-6">
                <div className="rounded-xl p-6 text-4xl font-bold text-lime-300">{clear.score}</div>
                <div>
                  <div className="text-sm text-neutral-300">Penalties:</div>
                  <ul className="list-disc pl-5 text-xs text-neutral-400">
                    {clear.penalties.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </Shell>
  );
}


