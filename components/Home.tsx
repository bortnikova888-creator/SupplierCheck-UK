import React from 'react';
import SearchBar from './SearchBar';
import { Shield, FileSearch, Scale } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-4xl mx-auto">
      <div className="mb-10 animate-fade-in-up">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-100 rounded-full mb-6">
          <Shield className="h-12 w-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Supplier Due Diligence <span className="text-emerald-600">Simplifed</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
          Instantly generate comprehensive risk profiles for UK companies. Includes officer history, PSC data, and sanctions screening.
        </p>
      </div>

      <div className="w-full mb-16">
        <SearchBar />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <FileSearch className="h-8 w-8 text-blue-500 mb-4 mx-auto" />
          <h3 className="font-semibold text-slate-900 mb-2">Deep Dive Data</h3>
          <p className="text-sm text-slate-500">Access full filing history, officer appointments, and financial status updates.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <Scale className="h-8 w-8 text-purple-500 mb-4 mx-auto" />
          <h3 className="font-semibold text-slate-900 mb-2">Compliance Checks</h3>
          <p className="text-sm text-slate-500">Automated screening against disqualification registers and watchlists.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <Shield className="h-8 w-8 text-emerald-500 mb-4 mx-auto" />
          <h3 className="font-semibold text-slate-900 mb-2">Risk Assessment</h3>
          <p className="text-sm text-slate-500">Instant red flag indicators for complex ownership structures.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
