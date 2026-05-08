export default function PatientHeader() {
  return (
    <section className="card mb-6 p-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Demo Patient</p>
          <p className="text-lg font-bold text-slate-900">Juan Dela Cruz</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patient ID</p>
          <p className="font-semibold text-slate-700">NC-2026-001</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Room / Ward</p>
          <p className="font-semibold text-slate-700">Room 210 / Medical Ward</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Primary Diagnosis</p>
          <p className="font-semibold text-slate-700">Acute Gastroenteritis</p>
        </div>
      </div>
    </section>
  );
}
