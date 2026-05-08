import PatientHeader from './PatientHeader';

export default function PageIntro({ title, description, showPatient = true }) {
  return (
    <>
      {showPatient && <PatientHeader />}
      <div className="card mb-6 px-6 py-5 lg:px-7 lg:py-6">
        <p className="section-kicker">Clinical workspace</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 lg:text-[1.4rem]">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      </div>
    </>
  );
}
