import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCompanyDossier } from '../lib/hooks';
import { 
  AlertTriangle, Download, Printer, ExternalLink, 
  MapPin, Calendar, Briefcase, FileText, CheckCircle, 
  AlertCircle, Building, Users, Scale, History, FileCode 
} from 'lucide-react';
import { Dossier, FlagSeverity, Officer, PSC } from '../types';

// --- Helper Components ---

const SectionHeader: React.FC<{ icon?: React.ElementType; title: string }> = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-2 mb-6 break-inside-avoid mt-8 first:mt-0">
    {Icon && <Icon className="h-5 w-5 text-slate-700" />}
    <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">{title}</h2>
  </div>
);

const Section: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`break-inside-avoid ${className}`}>
    {children}
  </section>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-slate-50 border border-slate-200 rounded p-4 text-center text-slate-500 text-sm italic">
    {message}
  </div>
);

const SeverityBadge: React.FC<{ severity: FlagSeverity }> = ({ severity }) => {
  const colors = {
    [FlagSeverity.HIGH]: 'bg-red-100 text-red-800 border-red-200',
    [FlagSeverity.MEDIUM]: 'bg-amber-100 text-amber-800 border-amber-200',
    [FlagSeverity.LOW]: 'bg-blue-100 text-blue-800 border-blue-200',
    [FlagSeverity.INFO]: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${colors[severity]} uppercase tracking-wider`}>
      {severity}
    </span>
  );
};

const ExternalLinkButton: React.FC<{ href: string; label?: string }> = ({ href, label = 'View Evidence' }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline print:text-black print:no-underline"
  >
    {label} <ExternalLink className="h-3 w-3 no-print" />
    <span className="hidden print:inline text-[8px] text-slate-500 ml-1">({href})</span>
  </a>
);

// --- Section Components ---

const KeyFlagsTable: React.FC<{ flags: Dossier['riskFlags'] }> = ({ flags }) => {
  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-sm text-emerald-800">
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">No significant risk flags identified in this screening.</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 rounded-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2 w-24">Severity</th>
            <th className="px-4 py-2 w-1/4">Risk Factor</th>
            <th className="px-4 py-2">Analysis</th>
            <th className="px-4 py-2 w-32 text-right">Evidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {flags.map((flag) => (
            <tr key={flag.id} className="bg-white">
              <td className="px-4 py-3 align-top">
                <SeverityBadge severity={flag.severity} />
              </td>
              <td className="px-4 py-3 align-top font-semibold text-slate-900">
                {flag.title}
              </td>
              <td className="px-4 py-3 align-top text-slate-600">
                {flag.explanation}
              </td>
              <td className="px-4 py-3 align-top text-right">
                {flag.evidenceUrl ? (
                  <ExternalLinkButton href={flag.evidenceUrl} />
                ) : (
                  <span className="text-slate-300 text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const OfficerList: React.FC<{ officers: Officer[] }> = ({ officers }) => {
  if (officers.length === 0) return <EmptyState message="No current or historic officer data available." />;

  // Stable sort: Resigned last (nulls first), then Appointed desc, then Name asc
  const sorted = [...officers].sort((a, b) => {
    if (a.resignedOn && !b.resignedOn) return 1;
    if (!a.resignedOn && b.resignedOn) return -1;
    
    const dateDiff = new Date(b.appointedOn).getTime() - new Date(a.appointedOn).getTime();
    if (dateDiff !== 0) return dateDiff;
    
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sorted.map((officer, idx) => (
        <div key={idx} className={`p-4 border rounded-sm ${officer.resignedOn ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-300 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-slate-900">{officer.name}</h4>
            {officer.resignedOn && <span className="text-[10px] uppercase font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">Resigned</span>}
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div className="grid grid-cols-3 gap-1">
              <span className="text-slate-400">Role:</span>
              <span className="col-span-2 font-medium text-slate-800">{officer.role}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="text-slate-400">Nationality:</span>
              <span className="col-span-2">{officer.nationality}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <span className="text-slate-400">Appointed:</span>
              <span className="col-span-2">{officer.appointedOn}</span>
            </div>
            {officer.resignedOn && (
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-400">Resigned:</span>
                <span className="col-span-2">{officer.resignedOn}</span>
              </div>
            )}
            {officer.birthYear && (
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-400">Born:</span>
                <span className="col-span-2">{officer.birthMonth}/{officer.birthYear}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const PSCList: React.FC<{ pscs: PSC[] }> = ({ pscs }) => {
  if (pscs.length === 0) return <EmptyState message="No Persons with Significant Control (PSC) recorded." />;

  // Stable sort: Ceased last (nulls first), then Notified desc, then Name asc
  const sorted = [...pscs].sort((a, b) => {
    if (a.ceasedOn && !b.ceasedOn) return 1;
    if (!a.ceasedOn && b.ceasedOn) return -1;
    
    const dateDiff = new Date(b.notifiedOn).getTime() - new Date(a.notifiedOn).getTime();
    if (dateDiff !== 0) return dateDiff;

    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-3">
      {sorted.map((psc, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-white border border-slate-200 rounded-sm">
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 text-sm mb-1">{psc.name}</h4>
            <div className="text-xs text-slate-500 mb-2">
              National: {psc.nationality} • Notified: {psc.notifiedOn} {psc.ceasedOn && `• Ceased: ${psc.ceasedOn}`}
            </div>
            <div className="flex flex-wrap gap-2">
              {psc.natureOfControl.map((control, i) => (
                <span key={i} className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-[10px] rounded border border-slate-200">
                  {control}
                </span>
              ))}
            </div>
          </div>
          {psc.ceasedOn && (
            <span className="shrink-0 px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded border border-slate-200">
              Ceased Control
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Main View ---

const DossierView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useCompanyDossier(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
        <p className="text-slate-600 font-medium tracking-wide">Compiling Due Diligence Report...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-white border border-red-200 rounded shadow-sm text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Report Generation Failed</h2>
        <p className="text-slate-600 mb-6">{(error as Error)?.message || 'Unable to retrieve company data.'}</p>
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:underline">
          &larr; Return to Search
        </Link>
      </div>
    );
  }

  const { dossier, report } = data;
  const { company } = dossier;

  // Aggregate Evidence
  const evidenceList: { label: string; url: string; context: string }[] = [];
  dossier.riskFlags.forEach((f, i) => {
    if (f.evidenceUrl) evidenceList.push({ label: `Flag #${i + 1}: ${f.title}`, url: f.evidenceUrl, context: 'Risk Assessment' });
  });
  if (dossier.modernSlavery?.url) {
    evidenceList.push({ label: 'Modern Slavery Statement', url: dossier.modernSlavery.url, context: 'Compliance' });
  }

  return (
    <div className="max-w-[210mm] mx-auto bg-white min-h-screen shadow-xl print:shadow-none print:w-full">
      
      {/* Action Bar (Screen Only) */}
      <div className="no-print bg-slate-100 border-b border-slate-200 p-4 sticky top-16 z-40 flex justify-between items-center">
        <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 font-medium">&larr; New Search</Link>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium hover:bg-slate-50 text-slate-700">
            <Printer className="h-4 w-4" /> Print
          </button>
          
          {report.htmlUrl && (
            <a href={report.htmlUrl} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium hover:bg-slate-50 text-slate-700">
              <FileCode className="h-4 w-4" /> HTML
            </a>
          )}
          
          {report.pdfUrl && (
             <a href={report.pdfUrl} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-700">
              <Download className="h-4 w-4" /> PDF
            </a>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="p-12 print:p-0">
        
        {/* Report Header */}
        <header className="border-b-4 border-slate-900 pb-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Due Diligence Dossier</div>
              <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
            </div>
            <div className={`px-3 py-1 text-sm font-bold uppercase tracking-wider border ${company.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {company.status}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Company Number</div>
              <div className="font-mono font-medium text-slate-900">{company.companyNumber}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Incorporated</div>
              <div className="font-medium text-slate-900">{company.incorporationDate}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Type</div>
              <div className="font-medium text-slate-900 capitalize">{company.type.replace(/-/g, ' ')}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Generated</div>
              <div className="font-medium text-slate-900">{new Date(dossier.generatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </header>

        {/* Executive Summary / Risk */}
        <Section className="mb-10">
          <SectionHeader icon={AlertCircle} title="Key Risk Indicators" />
          <KeyFlagsTable flags={dossier.riskFlags} />
        </Section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Company Details Column */}
          <div className="lg:col-span-1 space-y-8">
            <Section>
              <SectionHeader icon={Building} title="Registered Office" />
              <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 border border-slate-100 rounded-sm">
                <div className="font-medium">{company.registeredOffice.line1}</div>
                {company.registeredOffice.line2 && <div>{company.registeredOffice.line2}</div>}
                <div>{company.registeredOffice.town}</div>
                <div>{company.registeredOffice.postcode}</div>
                <div className="text-slate-500 mt-1">{company.registeredOffice.country}</div>
              </div>
            </Section>

            <Section>
              <SectionHeader icon={Briefcase} title="SIC Codes" />
              <ul className="text-sm space-y-2">
                {company.sicCodes.map((code, i) => (
                  <li key={i} className="bg-slate-50 p-3 border border-slate-100 rounded-sm text-slate-700">
                    {code}
                  </li>
                ))}
              </ul>
            </Section>
            
            <Section>
              <SectionHeader icon={Scale} title="Modern Slavery" />
              {dossier.modernSlavery ? (
                <div className={`p-4 border rounded-sm ${dossier.modernSlavery.compliant ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className={`h-4 w-4 ${dossier.modernSlavery.compliant ? 'text-emerald-600' : 'text-red-600'}`} />
                    <span className="font-bold text-sm text-slate-900">Statement Available</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <p>Signed: {dossier.modernSlavery.signedBy}</p>
                    <p>Date: {dossier.modernSlavery.dateSigned}</p>
                    <p>Status: <span className="font-semibold">{dossier.modernSlavery.compliant ? 'Compliant' : 'Non-Compliant'}</span></p>
                  </div>
                  <ExternalLinkButton href={dossier.modernSlavery.url} label="Download Statement" />
                </div>
              ) : (
                 <EmptyState message="No Modern Slavery Statement found." />
              )}
            </Section>
          </div>

          {/* People Column */}
          <div className="lg:col-span-2 space-y-8">
            <Section>
              <SectionHeader icon={Users} title="Officers & Directors" />
              <OfficerList officers={dossier.officers} />
            </Section>

            <Section>
              <SectionHeader icon={History} title="Significant Control (PSC)" />
              <PSCList pscs={dossier.pscs} />
            </Section>
          </div>
        </div>

        {/* Evidence Appendix */}
        <Section className="mt-12 pt-8 border-t-2 border-slate-200">
          <SectionHeader icon={FileText} title="Evidence Appendix" />
          {evidenceList.length > 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-sm overflow-hidden">
               <table className="w-full text-sm">
                 <thead className="bg-slate-100 text-xs text-slate-500 uppercase border-b border-slate-200">
                   <tr>
                     <th className="px-4 py-2 text-left w-12">#</th>
                     <th className="px-4 py-2 text-left">Document / Source</th>
                     <th className="px-4 py-2 text-left">Context</th>
                     <th className="px-4 py-2 text-right">Link</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200">
                   {evidenceList.map((item, idx) => (
                     <tr key={idx} className="hover:bg-slate-100">
                       <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                       <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                       <td className="px-4 py-3 text-slate-500 text-xs">{item.context}</td>
                       <td className="px-4 py-3 text-right">
                         <ExternalLinkButton href={item.url} label="Open Source" />
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          ) : (
            <EmptyState message="No external evidence documents linked to this report." />
          )}
        </Section>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-8 no-print">
          Generated by SupplierCheck UK • Confidential • {new Date().getFullYear()}
        </footer>

      </div>
    </div>
  );
};

export default DossierView;