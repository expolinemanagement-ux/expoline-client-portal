'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RequestMessages({ requestId, initialMessages }: { requestId: string; initialMessages: any[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true); setError('');
    const res = await fetch(`/api/requests/${requestId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Unable to send message.');
    else { setMessages([...messages, data]); setBody(''); router.refresh(); }
    setBusy(false);
  }
  return <section className="panel"><div className="pageHeading"><div><h2>Conversation</h2><p>Client ↔ Expoline messages for this request.</p></div></div><div className="messageList">{messages.length===0?<p className="muted">No messages yet. Start the conversation below.</p>:messages.map((item)=><div className="messageBubble" key={item.id}><strong>{item.sender.name}</strong><small>{new Date(item.createdAt).toLocaleString()}</small><p>{item.body}</p></div>)}</div><form onSubmit={send} className="messageComposer"><textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={5000} placeholder="Write a message..." rows={4}/><div className="formActions"><button className="primary" disabled={busy||!body.trim()}>{busy?'Sending...':'Send message'}</button>{error&&<span>{error}</span>}</div></form></section>;
}
