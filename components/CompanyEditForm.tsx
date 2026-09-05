'use client';
import { useState } from 'react';

export default function CompanyEditForm({ company }: { company: any }) {
  const [form, setForm] = useState({
    name: company.name ?? '',
    registrationNumber: company.registrationNumber ?? '',
    address: company.address ?? '',
    contactEmail: company.contactEmail ?? '',
    contactPhone: company.contactPhone ?? '',
    status: company.status,
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    const res = await fetch(`/api/companies/${company.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? 'Company updated.' : (data.error || 'Unable to update company.'));
  }

  async function remove() {
    if (!confirm('Delete this TEST company and its related demo records?')) return;
    const res = await fetch(`/api/companies/${company.id}`, { method: 'DELETE' });
    if (res.ok) window.location.href = '/companies';
    else { const data = await res.json(); setMessage(data.error || 'Unable to delete company.'); }
  }

  return <form className='formGrid' onSubmit={save}>
    <label>Company name<input value={form.name} onChange={e=>update('name',e.target.value)} required /></label>
    <label>Registration number<input value={form.registrationNumber} onChange={e=>update('registrationNumber',e.target.value)} /></label>
    <label>Contact email<input type='email' value={form.contactEmail} onChange={e=>update('contactEmail',e.target.value)} /></label>
    <label>Contact phone<input value={form.contactPhone} onChange={e=>update('contactPhone',e.target.value)} /></label>
    <label className='full'>Address<textarea value={form.address} onChange={e=>update('address',e.target.value)} rows={3} /></label>
    <label className='checkboxLabel'><input type='checkbox' checked={form.status} onChange={e=>update('status',e.target.checked)} /> Active company</label>
    <div className='formActions full'><button className='primary' disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button><button type='button' className='dangerButton' onClick={remove}>Delete TEST company</button></div>
    {message && <p className='formMessage full'>{message}</p>}
  </form>;
}
