import { useEffect, useState, useMemo } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [waterMain, setWaterMain] = useState({ ageYears: 40, material: "cast_iron", upgradedPct: 10 });
  const [isEmailSending, setIsEmailSending] = useState(false);
  const limits = { "Lead (ppm)": 0.015, "Copper (ppm)": 1.3, "Nitrate (ppm)": 10, "Arsenic (ppb)": 10, "PFOA (ppt)": 4, "PFOS (ppt)": 4, "pH": 8.5 };
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, async (snap) => {
      const rows: any[] = [];
      const customerIds = new Set<string>();

      snap.forEach((d) => {
        const data = d.data();
        rows.push({ id: d.id, ...data });
        if (data.customerId) {
          customerIds.add(data.customerId);
        }
      });

      // fetch customer details in parallel
      const customerMap: Record<string, any> = {};
      await Promise.all(
        Array.from(customerIds).map(async (cid) => {
          const cDoc = await getDoc(doc(db, "customers", cid));
          if (cDoc.exists()) {
            customerMap[cid] = { id: cDoc.id, ...cDoc.data() };
          }
        })
      );

      // attach customer info to reports
      const withNames = rows.map((r) => ({
        ...r,
        customer: customerMap[r.customerId] || null,
      }));

      setReports(withNames);
    });

    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/admin/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  async function openReport(r: any) {
    setSelected(r);
    if (r.customer) {
      setCustomer(r.customer);
    } else {
      const c = await getDoc(doc(db, "customers", r.customerId));
      setCustomer({ id: c.id, ...(c.data() as any) });
    }

    const parsed = r.parsedValues || parseContaminantValues(r.extractedText || "");
    await setDoc(doc(db, "zipStats", (r.customer).zip), { lastUpdated: new Date().toISOString() }, { merge: true });
    try { 
      await setDoc(doc(db, "reports", r.id), { parsedValues: parsed }, { merge: true }); 
    } catch {}
  }

  const parsed = selected?.parsedValues || {};
  const clear = useMemo(() => computeClearScore(parsed, limits), [selected]);
  const mainScore = useMemo(() => computeWaterMainScore(waterMain), [waterMain]);

  async function sendEmail() {
    if (!customer?.email) return alert("No customer email found");
    
    setIsEmailSending(true);
    try {
      await fetch("https://sendreportemailfn-uwamcgnufq-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customer.email,
          subject: `CFF CLEAR Report for ${customer.firstName} ${customer.lastName}`,
          text: `Dear ${customer.firstName},\n\nAttached is your CFF CLEAR Report.\n\nRegards,\nCFF Team`,
          reportId: customer.reportId

        })
      });
      // alert("Email sent successfully!");
    } catch (e: any) {
      alert("Email failed: " + e?.message);
    } finally {
      setIsEmailSending(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-green-100 to-green-50 border-green-200";
    if (score >= 60) return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200";
    if (score >= 40) return "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-200";
    return "bg-gradient-to-r from-red-100 to-red-50 border-red-200";
  };

//   const filteredReports = reports.filter(report => {
//     const matchesSearch = !searchTerm || 
//       report.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       report.customerId?.toLowerCase().includes(searchTerm.toLowerCase());
//     return matchesSearch;
//   });

  if (!ready) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md w-full backdrop-blur-sm bg-white/90 border border-gray-200 shadow-xl rounded-xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">Please sign in to access the admin dashboard</p>
              <Button 
                onClick={() => navigate("/admin/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
              >
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50/30">
        {!selected ? (
          <div className="space-y-8 p-6">
            {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Water Quality Dashboard</h1>
                <p className="text-gray-600">Manage and review water quality reports</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                </div>
                <Button 
                  onClick={handleSignOut}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg px-4 py-2 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">📊</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Recent Uploads</p>
                    <p className="text-2xl font-bold text-gray-800">{reports.filter(r => {
                      const date = r.createdAt?.toDate?.();
                      return date && (Date.now() - date.getTime()) < 24 * 60 * 60 * 1000;
                    }).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-xl">📈</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Active Customers</p>
                    <p className="text-2xl font-bold text-gray-800">{new Set(reports.map(r => r.customerId)).size}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xl">👥</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-500 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Recent Water Quality Reports</h2>
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Search reports..." 
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    // className="w-64 border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                </div>
              </div>
              
              {reports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-700 border-r border-gray-200">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-700 border-r border-gray-200">Customer</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-700">File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r, index) => (
                        <tr 
                          key={r.id} 
                          className="border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => openReport(r)}
                        >
                          <td className="p-4 border-r border-gray-100">
                            <div className="text-sm text-gray-800 font-medium">
                              {r.createdAt?.toDate?.().toLocaleDateString() || "—"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {r.createdAt?.toDate?.().toLocaleTimeString() || ""}
                            </div>
                          </td>
                          <td className="p-4 border-r border-gray-100">
                            <div className="text-sm font-medium text-gray-800">
                              {r.customer 
                                ? `${r.customer.firstName} ${r.customer.lastName}`.toUpperCase()
                                : 'Unknown Customer'
                              }
                            </div>
                            <div className="text-xs text-gray-500">{r.customer?.email || r.customerId}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                              {r.filename}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4 text-gray-300">📊</div>
                  <p className="text-gray-600 mb-2 font-medium">No reports available</p>
                  <p className="text-sm text-gray-500">Reports will appear here once customers upload their water quality data</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 p-6">
            {/* Report Header */}
            <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => setSelected(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg px-4 py-2"
                >
                  ← Back to Dashboard
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Water Quality Report</h1>
                  <p className="text-gray-600">
                    Generated on {selected.createdAt?.toDate?.().toLocaleDateString() || 'Unknown date'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => window.print()}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2"
                >
                  Print / Save PDF
                </Button>
                <Button 
                  onClick={sendEmail}
                  disabled={isEmailSending || !customer?.email}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2"
                >
                  {isEmailSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : 'Send Email'}
                </Button>
              </div>
            </div>

            {/* Customer & Report Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Customer Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-bold text-gray-800 mb-2">
                      {customer?.firstName} {customer?.lastName}
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{customer?.street} {customer?.suite}</p>
                      <p>{customer?.city}, {customer?.state} {customer?.zip}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium">{customer?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{customer?.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Test Results
                </h3>
                {Object.keys(parsed).length ? (
                  <div className="space-y-3">
                    {Object.entries(parsed).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm text-gray-600">{key}</span>
                        <span className="text-sm font-medium text-gray-800">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3 text-gray-300">🔬</div>
                    <p className="text-gray-600 font-medium">No test values detected</p>
                    <p className="text-xs text-gray-500 mt-1">Values will appear after processing</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                  ZIP Intelligence
                </h3>
                <div className="text-center py-8">
                  <div className="text-4xl mb-3 text-gray-300">🗺️</div>
                  <p className="text-gray-600 font-medium mb-2">Historical Data</p>
                  <p className="text-sm text-gray-500">ZIP: {customer?.zip}</p>
                </div>
              </div>
            </div>

            {/* Scores Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  Water Infrastructure Assessment
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age of mains (years)</label>
                      <Input 
                        type="number" 
                        value={waterMain.ageYears} 
                        onChange={(e: any) => setWaterMain({...waterMain, ageYears: Number(e.target.value)})}
                        className="bg-white border-gray-300 text-gray-800 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary material</label>
                      <Select 
                        value={waterMain.material} 
                        onChange={(e: any) => setWaterMain({...waterMain, material: e.target.value})}
                        className="bg-white border-gray-300 text-gray-800 rounded-lg"
                      >
                        <option value="lead">Lead</option>
                        <option value="galvanized">Galvanized</option>
                        <option value="cast_iron">Cast Iron</option>
                        <option value="ductile_iron">Ductile Iron</option>
                        <option value="copper">Copper</option>
                        <option value="pvc">PVC</option>
                        <option value="hdpe">HDPE</option>
                        <option value="unknown">Unknown</option>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">% upgraded in last 10 years</label>
                    <Input 
                      type="number" 
                      value={waterMain.upgradedPct} 
                      onChange={(e: any) => setWaterMain({...waterMain, upgradedPct: Number(e.target.value)})}
                      className="bg-white border-gray-300 text-gray-800 rounded-lg"
                    />
                  </div>
                  
                  <div className={`rounded-xl p-6 border-2 ${getScoreBg(mainScore)}`}>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 mb-2">Water Main C.L.E.A.R. Score</p>
                      <div className={`text-4xl font-bold ${getScoreColor(mainScore)}`}>{mainScore}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                  Overall C.L.E.A.R. Score
                </h3>
                <div className="space-y-6">
                  <div className={`rounded-xl p-8 border-2 ${getScoreBg(clear.score)}`}>
                    <div className="text-center">
                      <div className={`text-5xl font-bold mb-2 ${getScoreColor(clear.score)}`}>
                        {clear.score}
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        {clear.score >= 80 ? 'Excellent' : clear.score >= 60 ? 'Good' : 'Needs Attention'}
                      </p>
                    </div>
                  </div>

                  {clear.penalties && clear.penalties.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Assessment Notes:</h4>
                      <div className="space-y-2">
                        {clear.penalties.map((penalty: string, index: number) => (
                          <div key={index} className="flex items-start space-x-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <span className="text-amber-600">⚠️</span>
                            <span>{penalty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}