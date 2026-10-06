import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { api } from '../../api/client';
import { 
  Layers, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  Satellite, 
  Filter, 
  RefreshCw, 
  Compass, 
  Info,
  Maximize2,
  Search,
  CheckCircle,
  Eye,
  GitBranch,
  Map as MapIcon
} from 'lucide-react';

interface CadastralMapProps {
  onSelectParcel: (ulpin: string) => void;
  selectedUlpin?: string | null;
}

export const CadastralMap: React.FC<CadastralMapProps> = ({
  onSelectParcel,
  selectedUlpin,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const stateBoundariesLayerRef = useRef<L.GeoJSON | null>(null);
  const neighboursLayerRef = useRef<L.GeoJSON | null>(null);

  const [parcelsData, setParcelsData] = useState<any>(null);
  const [activeBasemap, setActiveBasemap] = useState<'osm' | 'satellite'>('satellite');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [showStateBoundaries, setShowStateBoundaries] = useState<boolean>(true);
  const [showNeighbours, setShowNeighbours] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [parcelCount, setParcelCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [neighbourParcels, setNeighbourParcels] = useState<any[]>([]);

  // Tile layer instances
  const osmLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [17.588, 78.488], // Telangana Medchal cluster
      zoom: 14,
      zoomControl: true,
    });

    osmLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    satelliteLayerRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USGS, GIS User Community',
        maxZoom: 19,
      }
    );

    satelliteLayerRef.current.addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !osmLayerRef.current || !satelliteLayerRef.current) return;

    if (activeBasemap === 'satellite') {
      map.removeLayer(osmLayerRef.current);
      satelliteLayerRef.current.addTo(map);
    } else {
      map.removeLayer(satelliteLayerRef.current);
      osmLayerRef.current.addTo(map);
    }
  }, [activeBasemap]);

  // Load state boundaries
  const fetchStateBoundaries = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      const data = await api.getStateBoundaries();
      if (stateBoundariesLayerRef.current) {
        map.removeLayer(stateBoundariesLayerRef.current);
      }

      const layer = L.geoJSON(data, {
        style: (feature: any) => ({
          color: feature?.properties?.code === 'TS' ? '#3B82F6' : '#10B981',
          weight: 2,
          dashArray: '5, 5',
          fillColor: feature?.properties?.code === 'TS' ? '#3B82F6' : '#10B981',
          fillOpacity: 0.04,
        }),
        onEachFeature: (feature, l) => {
          l.bindTooltip(`<b>${feature.properties.name} (${feature.properties.code})</b>`, {
            permanent: false,
            direction: 'center',
            className: 'bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg border border-slate-700',
          });
        },
      });

      stateBoundariesLayerRef.current = layer;
      if (showStateBoundaries) {
        layer.addTo(map);
      }
    } catch {
      // Ignore boundary loading errors
    }
  }, [showStateBoundaries]);

  useEffect(() => {
    fetchStateBoundaries();
  }, [fetchStateBoundaries]);

  // Toggle state boundaries visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = stateBoundariesLayerRef.current;
    if (!map || !layer) return;

    if (showStateBoundaries) {
      if (!map.hasLayer(layer)) layer.addTo(map);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showStateBoundaries]);

  // Load parcels from API
  const fetchParcels = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedState !== 'ALL') {
        params.state = selectedState;
      }
      const data = await api.getParcels(params);
      setParcelsData(data);
      setParcelCount(data.features?.length || 0);
    } catch (err) {
      console.error('Failed to load parcels:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  // Load neighbours if selectedUlpin and showNeighbours
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (neighboursLayerRef.current) {
      map.removeLayer(neighboursLayerRef.current);
      neighboursLayerRef.current = null;
    }

    if (!selectedUlpin || !showNeighbours) {
      setNeighbourParcels([]);
      return;
    }

    api.getNeighbours(selectedUlpin).then((res) => {
      const neighbours = res.data?.neighbours || [];
      setNeighbourParcels(neighbours);

      const features = neighbours.map((n: any) => ({
        type: 'Feature',
        id: n.id,
        geometry: typeof n.geometry === 'string' ? JSON.parse(n.geometry) : n.geometry,
        properties: {
          ulpin: n.ulpin,
          legacy_survey_no: n.legacy_survey_no,
          state_code: n.state_code,
          is_neighbour: true,
        },
      }));

      const nLayer = L.geoJSON({ type: 'FeatureCollection', features } as any, {
        style: {
          color: '#F59E0B',
          weight: 3,
          dashArray: '4, 4',
          fillColor: '#F59E0B',
          fillOpacity: 0.25,
        },
        onEachFeature: (feature, layer) => {
          layer.bindTooltip(`Neighbouring Parcel: ${feature.properties.ulpin} (Sy: ${feature.properties.legacy_survey_no})`, {
            permanent: false,
            className: 'bg-amber-950 text-amber-200 text-xs px-2 py-1 rounded border border-amber-600',
          });
          layer.on('click', () => onSelectParcel(feature.properties.ulpin));
        },
      });

      neighboursLayerRef.current = nLayer;
      nLayer.addTo(map);
    }).catch(() => {});
  }, [selectedUlpin, showNeighbours, onSelectParcel]);

  // Render GeoJSON Parcels Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !parcelsData) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const getParcelColor = (props: any) => {
      if (props.ulpin === selectedUlpin) return '#3B82F6'; // Selected: Royal Blue
      if (props.risk_level === 'HIGH' || props.active_litigations > 0 || props.active_encumbrances > 0) return '#EF4444'; // Red
      if (props.risk_level === 'MEDIUM' || props.pending_alerts > 0) return '#F59E0B'; // Yellow/Amber
      return '#10B981'; // Green: Clean
    };

    const layer = L.geoJSON(parcelsData, {
      filter: (feature) => {
        if (riskFilter === 'ALL') return true;
        if (riskFilter === 'HIGH') return feature.properties.risk_level === 'HIGH' || feature.properties.active_litigations > 0;
        if (riskFilter === 'MEDIUM') return feature.properties.risk_level === 'MEDIUM' || feature.properties.pending_alerts > 0;
        if (riskFilter === 'CLEAN') return feature.properties.risk_level === 'CLEAN' && feature.properties.active_litigations === 0 && feature.properties.active_encumbrances === 0;
        return true;
      },
      style: (feature) => {
        const isSelected = feature?.properties?.ulpin === selectedUlpin;
        const color = getParcelColor(feature?.properties);
        return {
          color: isSelected ? '#60A5FA' : color,
          weight: isSelected ? 4 : 2,
          fillColor: color,
          fillOpacity: isSelected ? 0.6 : 0.35,
        };
      },
      onEachFeature: (feature, l) => {
        const props = feature.properties;
        const ownersText = props.current_owners?.map((o: any) => o.person_name || o.name).join(', ') || 'N/A';

        l.bindTooltip(`
          <div class="font-sans">
            <div class="font-bold text-xs text-white">${props.ulpin}</div>
            <div class="text-[11px] text-slate-300">Survey: ${props.legacy_survey_no} | ${props.village}</div>
            <div class="text-[10px] text-emerald-400">Area: ${props.recorded_area_sqm} m²</div>
          </div>
        `, {
          sticky: true,
          className: 'bg-slate-900/95 text-white p-2 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md',
        });

        l.on({
          click: () => onSelectParcel(props.ulpin),
          mouseover: (e) => {
            const target = e.target;
            if (props.ulpin !== selectedUlpin) {
              target.setStyle({ fillOpacity: 0.7, weight: 3 });
            }
          },
          mouseout: (e) => {
            const target = e.target;
            if (props.ulpin !== selectedUlpin) {
              target.setStyle({ fillOpacity: 0.35, weight: 2 });
            }
          },
        });
      },
    });

    geojsonLayerRef.current = layer;
    layer.addTo(map);

    // Zoom to selected parcel if available
    if (selectedUlpin && parcelsData.features) {
      const selectedFeature = parcelsData.features.find((f: any) => f.properties.ulpin === selectedUlpin);
      if (selectedFeature) {
        const bounds = L.geoJSON(selectedFeature).getBounds();
        map.fitBounds(bounds, { maxZoom: 17, padding: [50, 50] });
      }
    }
  }, [parcelsData, selectedUlpin, riskFilter, onSelectParcel]);

  // Handle Quick Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await api.searchParcels({ q: searchQuery.trim(), limit: 10 });
      setSearchResults(res.results || []);
      if (res.results && res.results.length === 1) {
        onSelectParcel(res.results[0].ulpin);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const zoomToState = (stateCode: 'TS' | 'KA' | 'ALL') => {
    setSelectedState(stateCode);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (stateCode === 'TS') {
      map.flyTo([17.588, 78.488], 14, { duration: 1.2 });
    } else if (stateCode === 'KA') {
      map.flyTo([13.245, 77.712], 14, { duration: 1.2 });
    } else {
      map.flyTo([15.5, 78.0], 7, { duration: 1.5 });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Search Bar (Cross-State) */}
        <div className="pointer-events-auto flex-1 max-w-md bg-slate-900/90 backdrop-blur-md rounded-xl p-1.5 shadow-2xl border border-slate-700/80">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ULPIN, Survey #, Owner, or Village (TS / KA)..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none py-1"
            />
            {isSearching ? (
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin mr-2" />
            ) : (
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                Search
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800 max-h-56 overflow-y-auto space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold px-2">Matched Parcels ({searchResults.length}):</div>
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onSelectParcel(r.ulpin);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-slate-800/90 rounded-lg text-xs flex items-center justify-between transition"
                >
                  <div>
                    <span className="font-mono font-bold text-emerald-400">{r.ulpin}</span>
                    <span className="text-[11px] text-slate-300 ml-2">Sy: {r.legacy_survey_no} ({r.state_name})</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    r.risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    r.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {r.risk_level}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* State Cluster Switchers & GIS Layer Toggles */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-2xl border border-slate-700/80">
          <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Cluster:</span>
            <button
              onClick={() => zoomToState('TS')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                selectedState === 'TS' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Telangana (Medchal)
            </button>
            <button
              onClick={() => zoomToState('KA')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                selectedState === 'KA' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Karnataka (Devanahalli)
            </button>
            <button
              onClick={() => zoomToState('ALL')}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                selectedState === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All
            </button>
          </div>

          {/* Boundaries Toggle */}
          <button
            onClick={() => setShowStateBoundaries(!showStateBoundaries)}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition ${
              showStateBoundaries ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle State Administrative Boundaries"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Boundaries</span>
          </button>

          {/* Neighbours Toggle */}
          <button
            onClick={() => setShowNeighbours(!showNeighbours)}
            disabled={!selectedUlpin}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition ${
              !selectedUlpin ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500' :
              showNeighbours ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Highlight Spatially Adjacent Cadastral Parcels"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Neighbours</span>
          </button>

          {/* Basemap Switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveBasemap('satellite')}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition ${
                activeBasemap === 'satellite' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Satellite className="w-3 h-3" /> Satellite
            </button>
            <button
              onClick={() => setActiveBasemap('osm')}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 font-medium transition ${
                activeBasemap === 'osm' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" /> Streets
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Bottom GIS Legend & Status */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-2">
        <div className="flex items-center justify-between gap-4 font-semibold text-slate-300">
          <span>Cadastral GIS Legend</span>
          <span className="text-slate-400 text-[11px] font-mono">{parcelCount} parcels loaded</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/80 border border-emerald-400 inline-block" />
            <span className="text-slate-300">Clean / Clear Title</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500/80 border border-amber-400 inline-block" />
            <span className="text-slate-300">Satellite Alert / Mismatch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500/80 border border-rose-400 inline-block" />
            <span className="text-slate-300">Litigation / Stay / Encumbered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500 border-2 border-white inline-block" />
            <span className="text-blue-300 font-semibold">Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
