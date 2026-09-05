'use client';
import { useState } from 'react';

export default function AddCompanyForm() {
  const [saved, setSaved] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaved('');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const res = await fetch('/api/companies', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
    const json = await res.json(); setSaved(res.ok ? 'Company saved to PostgreSQL.' : (json.error || 'Unable to save company.'));
    if (res.ok) form.reset();
  }
  return <form className="formGrid" onSubmit={submit}>
    <label>Company Name<input name="name" required placeholder="Company name"/></label>
    <label>Registration Number<input name="registrationNumber" placeholder="Registration number"/></label>
    <label>Contact Email<input name="contactEmail" type="email" placeholder="hr@company.com"/></label>
    <label>Contact Phone<input name="contactPhone" placeholder="+960 ..."/></label>
    <label className="full">Address<input name="address" placeholder="Company address"/></label>
    <div className="formActions"><button className="primary" type="submit">Save Company</button>{saved&&<span className="success">{saved}</span>}</div>
  </form>;
}
