'use client';
import {useState} from 'react';

export default function DocumentUploadForm({companies,personnel}:{companies:{id:string,name:string}[];personnel:{id:string,fullName:string,companyId:string}[]}){
 const [companyId,setCompanyId]=useState(companies[0]?.id||''); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
 const people=personnel.filter(p=>p.companyId===companyId);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage('');const form=new FormData(e.currentTarget);const res=await fetch('/api/documents/upload',{method:'POST',body:form});const data=await res.json();setBusy(false);if(!res.ok){setMessage(data.error||'Upload failed.');return;}window.location.href=`/documents/${data.id}`;}
 return <form className="formGrid" onSubmit={submit}>
  <label>Company<select name="companyId" value={companyId} onChange={e=>setCompanyId(e.target.value)} required>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label>Personnel<select name="personnelId"><option value="">Company document</option>{people.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select></label>
  <label>Document name<input name="name" placeholder="e.g. Passport scan" /></label>
  <label>Category<select name="category" defaultValue="OTHER">{['PASSPORT','IDENTITY','EMPLOYMENT','VISA','WORK_PERMIT','MEDICAL','INSURANCE','PHOTO','OTHER'].map(x=><option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</select></label>
  <label>Issue date<input type="date" name="issueDate" /></label><label>Expiry date<input type="date" name="expiryDate" /></label>
  <label className="fullWidth">File<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></label>
  <p className="muted fullWidth">Demo/staging limit: 10 MB. Allowed: PDF, JPG, PNG, WebP.</p>
  {message&&<p className="error fullWidth">{message}</p>}
  <button className="primary" disabled={busy}>{busy?'Uploading…':'Upload document'}</button>
 </form>;
}
