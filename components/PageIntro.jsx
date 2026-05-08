import PatientHeader from './PatientHeader';

export default function PageIntro({ title, description, showPatient = true }) {
  return (
    <>
      {showPatient && <PatientHeader />}
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </>
  );
}
