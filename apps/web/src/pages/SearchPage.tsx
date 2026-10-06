import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { CadastralMap } from '../components/gis/CadastralMap';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Layers,
  ChevronRight
} from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || 'ALL');
  const [surveyNo, setSurveyNo] = useState(searchParams.get('survey_no') || '');
  const [ownerName, setOwnerName] = useState(searchParams.get('owner') || '');
  const [village, setVillage] = useState(searchParams.get('village') || '');
  const [selectedUlpin, setSelectedUlpin] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const executeSearch = async () => {
    setIsLoading(true);
    try {
      const data = await api.searchParcels({
        q: searchQuery.trim() || undefined,
        legacy_survey_no: surveyNo.trim() || undefined,
        owner_name: ownerName.trim() || undefined,
        village: village.trim() || undefined,
        state: selectedState !== 'ALL' ? selectedState : undefined,
        limit: 50,
      });
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [selectedState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSelectParcel = (ulpin: string) => {
    setSelectedUlpin(ulpin);
    navigate(`/parcel/${ulpin}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Header & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#0B3B60]" />
              Unified Cross-State Cadastral Search
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Query across Telangana Dharani and Karnataka Bhoomi simultaneously by ULPIN, survey number, owner name, or village.
            </p>
          </div>
          <div className="text-xs font-mono font-semibold px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800">
            {total} Parcels Found
          </div>
        </div>

        {/* Filters Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Global Query / ULPIN</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. TSQXY9QM4KNXSZ, Kompally, Ramesh..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">State Jurisdiction</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B3B60]"
            >
              <option value="ALL">All States (TS & KA)</option>
              <option value="TS">Telangana (Dharani)</option>
              <option value="KA">Karnataka (Bhoomi)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Survey / Hissa No</label>
            <input
              type="text"
              value={surveyNo}
              onChange={(e) => setSurveyNo(e.target.value)}
              placeholder="e.g. 101/1, Sy-87/1"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0B3B60] hover:bg-[#07263F] disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Filter Parcels
            </button>
          </div>
        </form>
      </div>

      {/* Main Grid: Interactive Map (Left) + Search Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Cadastral Map View */}
        <div className="lg:col-span-7 h-[650px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <CadastralMap
            onSelectParcel={handleSelectParcel}
            selectedUlpin={selectedUlpin}
          />
        </div>

        {/* Results List */}
        <div className="lg:col-span-5 flex flex-col h-[650px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Search Results ({results.length})</span>
            <span className="text-[11px] text-slate-500">Click parcel to open 360° dossier</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#0B3B60]" />
                <span className="text-xs font-medium">Querying PostGIS spatial registry...</span>
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="text-center py-16 text-slate-500 space-y-3">
                <Layers className="w-10 h-10 mx-auto text-slate-400" />
                <div className="text-sm font-bold text-slate-700">No matching parcels found</div>
                <p className="text-xs max-w-xs mx-auto text-slate-500">
                  Try relaxing your search terms or clearing the state filter.
                </p>
              </div>
            )}

            {!isLoading && results.map((parcel) => (
              <div
                key={parcel.id}
                onClick={() => handleSelectParcel(parcel.ulpin)}
                className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#0B3B60] rounded-xl p-4 cursor-pointer transition shadow-sm group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#0B3B60] group-hover:underline">
                    {parcel.ulpin}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    parcel.risk_level === 'HIGH' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    parcel.risk_level === 'MEDIUM' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {parcel.risk_level}
                  </span>
                </div>

                <div className="text-xs text-slate-700 font-medium">
                  Survey No: <span className="font-bold text-slate-900">{parcel.legacy_survey_no}</span> ({parcel.state_name})
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{parcel.village}, {parcel.mandal}</span>
                  <span className="font-mono text-emerald-700 font-bold">{parcel.recorded_area_sqm} m²</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Owners: {parcel.current_owners?.map((o: any) => o.person_name || o.name).join(', ') || 'N/A'}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B60] group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
