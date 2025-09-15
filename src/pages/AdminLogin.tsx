import React, { useState } from "react";
import Shell from "../components/Shell";
import { Card, Input, Button } from "../components/UI";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/admin");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        <Card title="Admin Login">
          <form onSubmit={submit} className="grid gap-3">
            <Input label="Email" value={email} onChange={(e:any)=>setEmail(e.target.value)} />
            <Input label="Password" type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)} />
            {err && <div className="text-red-400 text-sm">{err}</div>}
            <div className="mt-2">
              <Button type="submit">Sign in</Button>
            </div>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
