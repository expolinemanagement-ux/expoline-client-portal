'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddRequestForm() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const res = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json();
    setMessage(res.ok ? 'Request created successfully.' : json.error || 'Unable to create request.');
    if (res.ok) { form.reset(); router.push('/requests'); router.refresh(); }
  }

  return <form className="formGrid" onSubmit={submit}>
    <label>Request Title<input name="title" required placeholder="e.g. Updated passport copy" /></label>
    <label>Company<select name="companyName" required><option value="">Select company</option><option>Demo Construction Company</option><option>Demo Hospitality Group</option><option>Demo Marine Services</option><option>Demo Resort Operations</option></select></label>
    <label>Personnel Name<input name="personnelName" placeholder="Optional personnel name" /></label>
    <label>Priority<select name="priority"><option>Normal</option><option>Low</option><option>High</option><option>Urgent</option></select></label>
    <label>Status<select name="status"><option>Pending</option><option>Submitted</option><option>Under Review</option></select></label>
    <label>Due Date<input name="dueDate" type="date" /></label>
    <label className="full">Description<textarea name="description" placeholder="Explain the document or action required" /></label>
    <div className="formActions"><button className="primary" type="submit">Create Request</button>{message && <span className="success">{message}</span>}</div>
  </form>;
}