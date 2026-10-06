import React, { useRef } from 'react';
import { X, Download, Printer, ShieldAlert, Award, FileCheck, CheckCircle2 } from 'lucide-react';

interface RoRPdfModalProps {
  parcel: any;
  owners: any[];
  landRecord?: any;
  onClose: () => void;
}

export const RoRPdfModal: React.FC<RoRPdfModalProps> = ({
  parcel,
  owners,
  landRecord,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0B3B60]" />
            <h3 className="font-bold text-slate-900 text-base">Record of Rights (RoR 1B / RTC) — Demo Certified Copy</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#0B3B60] hover:bg-[#07263F] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 font-serif relative" ref={printRef}>
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none rotate-[-30deg]">
            <div className="text-6xl font-black text-slate-900 text-center tracking-widest leading-relaxed">
              DEMO ONLY<br />SYNTHETIC RECORD OF RIGHTS<br />NO LEGAL VALIDITY
            </div>
          </div>

          {/* Official Emblem & Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-6 relative">
            <div className="text-xs font-sans uppercase font-bold tracking-widest text-slate-600 mb-1">
              GOVERNMENT OF {parcel.state_name?.toUpperCase() || 'TELANGANA'}
            </div>
            <div className="text-sm font-sans font-semibold text-slate-700">
              REVENUE & LAND ADMINISTRATION DEPARTMENT
            </div>
            <div className="text-2xl font-bold font-serif text-slate-900 mt-2">
              RECORD OF RIGHTS (RoR 1-B CADASTRAL EXTRACT)
            </div>
            <div className="text-xs font-sans text-slate-500 mt-1 font-mono">
              Certified Digitally via GeoDhara DPI Architecture (SIH 2026 Prototype PS 26014)
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans border border-slate-300 p-4 rounded-lg bg-slate-50 mb-6">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Unique Land Parcel ID</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{parcel.ulpin}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Survey / Hissa No</span>
              <span className="font-bold text-slate-900 text-sm">{parcel.legacy_survey_no}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Village & Mandal</span>
              <span className="font-medium text-slate-900">{parcel.village}, {parcel.mandal}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">District & State</span>
              <span className="font-medium text-slate-900">{parcel.district} ({parcel.state_code})</span>
            </div>
          </div>

          {/* Area & Classification */}
          <div className="mb-6">
            <h4 className="font-sans font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1 mb-2">
              1. Extent & Classification Details
            </h4>
            <table className="w-full text-xs font-sans border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="border border-slate-300 p-2">Total Cadastral Area</th>
                  <th className="border border-slate-300 p-2">Geodesic PostGIS Area</th>
                  <th className="border border-slate-300 p-2">Land Classification</th>
                  <th className="border border-slate-300 p-2">Water / Soil Category</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold">{parcel.recorded_area_sqm} m² ({(parcel.recorded_area_sqm / 4046.86).toFixed(2)} Acres)</td>
                  <td className="border border-slate-300 p-2 font-mono text-emerald-800">{parcel.geodesic_area_sqm} m²</td>
                  <td className="border border-slate-300 p-2">Agricultural / Dry Land</td>
                  <td className="border border-slate-300 p-2">Black Cotton / Red Soil</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pattadar / Khatedar Ownership Details */}
          <div className="mb-6">
            <h4 className="font-sans font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1 mb-2">
              2. Title Holder(s) / Pattadar Record
            </h4>
            <table className="w-full text-xs font-sans border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="border border-slate-300 p-2">#</th>
                  <th className="border border-slate-300 p-2">Holder / Pattadar Name</th>
                  <th className="border border-slate-300 p-2">Passbook / Identifier</th>
                  <th className="border border-slate-300 p-2">Title Type</th>
                  <th className="border border-slate-300 p-2">Share %</th>
                  <th className="border border-slate-300 p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                    <td className="border border-slate-300 p-2 font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">{owner.person_name}</td>
                    <td className="border border-slate-300 p-2 font-mono">{owner.person_identifier}</td>
                    <td className="border border-slate-300 p-2">{owner.ownership_type}</td>
                    <td className="border border-slate-300 p-2 font-bold text-emerald-800">{parseFloat(owner.ownership_percentage).toFixed(1)}%</td>
                    <td className="border border-slate-300 p-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                        CURRENT TITLE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Statutory Notice & Security QR */}
          <div className="border-t-2 border-slate-900 pt-4 mt-8 flex items-center justify-between font-sans text-[11px] text-slate-600">
            <div>
              <div className="font-bold text-slate-900">DIGITALLY SIGNED & VERIFIED ON IMMUTABLE SHA-256 LEDGER</div>
              <div className="font-mono text-[10px] text-slate-500">Hash ID: {parcel.ulpin.toLowerCase()}-ror-cert-ver-{parcel.version}</div>
              <div className="text-[10px] text-rose-700 font-semibold mt-1">
                DISCLAIMER: DEMO PROTOTYPE ARTIFACT GENERATED FOR SIH 2026. NOT AN OFFICIAL LEGAL INSTRUMENT.
              </div>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 border-2 border-slate-800 p-1 rounded inline-flex items-center justify-center font-mono text-[9px] text-slate-800 font-bold bg-slate-100">
                [QR SECURE]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
