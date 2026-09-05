'use client';
import {useState} from 'react';

export default function ComplianceEditForm({type,id,record}:{type:string;id:string;record:any}){
  const [form,setForm]=useState({referenceNumber:record.visaNumber||record.permitNumber||record.policyNumber||'',type:record.visaType||record.permitType||record.medicalType||record.coverageType||'',provider:record.provider||'',issueDate:(record.issueDate||record.completionDate||record.startDate)?.slice?.(0,10)||'',expiryDate:record.expiryDate?.slice?.(0,10)||'',status:record.status||'PENDING',notes:record.notes||''});
  const [message,setMessage]=useState(''); const [saving,setSaving]=useState(false);
  const set=(key:string,value:string)=>setForm(x=>({...x,[key]:value}));
  async function save(e:React.FormEvent){e.preventDefault();setSaving(true);setMessage('');const r=await fetch(`/api/compliance/${type}/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await r.json();setSaving(false);setMessage(r.ok?'Record updated.':d.error||'Unable to update record.');}
  async function remove(){if(!confirm('Delete this TEST compliance record?'))return;const r=await fetch(`/api/compliance/${type}/${id}`,{method:'DELETE'});if(r.ok)location.href='/compliance';else{const d=await r.json();setMessage(d.error||'Unable to delete record.');}}
  return <form className="formGrid" onSubmit={save}>
    <label>Reference number<input value={form.referenceNumber} onChange={e=>set('referenceNumber',e.target.value)}/></label>
    <label>Record type<input value={form.type} onChange={e=>set('type',e.target.value)}/></label>
    {type==='insurance'&&<label>Provider<input value={form.provider} onChange={e=>set('provider',e.target.value)}/></label>}
    <label>Issue / start / completion date<input type="date" value={form.issueDate} onChange={e=>set('issueDate',e.target.value)}/></label>
    <label>Expiry date<input type="date" value={form.expiryDate} onChange={e=>set('expiryDate',e.target.value)}/></label>
    <label>Status<select value={form.status} onChange={e=>set('status',e.target.value)}><option value="VALID">Valid</option><option value="EXPIRING_SOON">Expiring Soon</option><option value="EXPIRED">Expired</option><option value="PENDING">Pending</option><option value="NOT_REQUIRED">Not Required</option></select></label>
    <label className="full">Notes<textarea value={form.notes} onChange={e=>set('notes',e.target.value)}/></label>
    <div className="formActions"><button className="primary" disabled={saving}>{saving?'Saving...':'Save Changes'}</button><button type="button" className="dangerButton" onClick={remove}>Delete TEST Record</button>{message&&<span className="success">{message}</span>}</div>
  </form>;
}
