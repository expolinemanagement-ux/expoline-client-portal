'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddComplianceForm() {
  const router = useRouter();
  const [people, setPeople] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/personnel')
      .then((response) => response.json())
      .then(setPeople)
      .catch(() => setPeople([]));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const response = await fetch('/api/compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    setMessage(response.ok ? 'Compliance record saved to PostgreSQL.' : json.error || 'Unable to save record.');

    if (response.ok) {
      form.reset();
      router.push('/compliance');
      router.refresh();
    }
  }

  return (
    <form className="formGrid" onSubmit={submit}>
      <label>
        Personnel
        <select name="personnelId" required>
          <option value="">Select personnel</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName} — {person.company.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Record Type
        <select name="recordType" defaultValue="Visa">
          <option>Visa</option>
          <option>Work Permit</option>
          <option>Medical</option>
          <option>Insurance</option>
        </select>
      </label>
      <label>
        Reference Number
        <input name="referenceNumber" placeholder="TEST-VISA / TEST-PERMIT / TEST-POLICY" />
      </label>
      <label>
        Issue / Completion Date
        <input name="issueDate" type="date" />
      </label>
      <label>
        Expiry Date
        <input name="expiryDate" type="date" />
      </label>
      <label>
        Status
        <select name="status" defaultValue="PENDING">
          <option value="PENDING">Pending</option>
          <option value="VALID">Valid</option>
          <option value="EXPIRING_SOON">Expiring Soon</option>
          <option value="EXPIRED">Expired</option>
          <option value="NOT_REQUIRED">Not Required</option>
        </select>
      </label>
      <label className="full">
        Notes
        <textarea name="notes" placeholder="Optional notes" />
      </label>
      <div className="formActions">
        <button className="primary" type="submit">Save Record</button>
        {message && <span className="success">{message}</span>}
      </div>
    </form>
  );
}
