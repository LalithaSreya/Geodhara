import React, { createContext, useContext, useState, useEffect } from 'react';

export type StateJurisdictionCode = 'TS' | 'KA' | 'ALL';

export interface StateMetadata {
  code: StateJurisdictionCode;
  name: string;
  portalName: string;
  cadastralModel: string;
  districtFocus: string;
  seedParcelsCount: number;
  icon: string;
  accentColor: string;
  badgeColor: string;
  description: string;
}

export const STATE_METADATA_MAP: Record<StateJurisdictionCode, StateMetadata> = {
  TS: {
    code: 'TS',
    name: 'Telangana',
    portalName: 'Dharani Land Portal',
    cadastralModel: 'Pattadar & Rythu Passbook',
    districtFocus: 'Medchal-Malkajgiri',
    seedParcelsCount: 36,
    icon: '🏛️',
    accentColor: 'from-emerald-600 to-teal-500',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Telangana State Dharani Land Administration. Supports Pattadar passbooks, Khata numbers, and Medchal survey plots.',
  },
  KA: {
    code: 'KA',
    name: 'Karnataka',
    portalName: 'Bhoomi RTC Portal',
    cadastralModel: 'Khatedar & RTC / Hissa',
    districtFocus: 'Devanahalli (Bengaluru Rural)',
    seedParcelsCount: 28,
    icon: '🌾',
    accentColor: 'from-blue-600 to-cyan-500',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'Karnataka State Bhoomi RTC cadastral registry. Supports Khatedar titles, RTC extracts, Hissa numbers, and Mutation Register (MR).',
  },
  ALL: {
    code: 'ALL',
    name: 'Pan-India Federation',
    portalName: 'National Cadastral DPI Backbone',
    cadastralModel: 'Standardized ULPIN Domain Model',
    districtFocus: 'Multi-State Federation (TS + KA)',
    seedParcelsCount: 64,
    icon: '🌐',
    accentColor: 'from-purple-600 to-indigo-500',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Unified cross-state digital public infrastructure standardizing heterogeneous state land records into a single 14-char ULPIN registry.',
  },
};

interface StateJurisdictionContextType {
  selectedState: StateJurisdictionCode;
  currentStateMeta: StateMetadata;
  setSelectedState: (state: StateJurisdictionCode) => void;
  hasSelectedStateInitially: boolean;
  setHasSelectedStateInitially: (selected: boolean) => void;
}

const StateJurisdictionContext = createContext<StateJurisdictionContextType | undefined>(undefined);

const STORAGE_KEY = 'geodhara_selected_state';
const INITIAL_FLAG_KEY = 'geodhara_has_selected_state';

export const StateJurisdictionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedState, setSelectedStateInternal] = useState<StateJurisdictionCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as StateJurisdictionCode;
    return saved && ['TS', 'KA', 'ALL'].includes(saved) ? saved : 'TS';
  });

  const [hasSelectedStateInitially, setHasSelectedStateInitiallyInternal] = useState<boolean>(() => {
    return localStorage.getItem(INITIAL_FLAG_KEY) === 'true';
  });

  const setSelectedState = (state: StateJurisdictionCode) => {
    setSelectedStateInternal(state);
    localStorage.setItem(STORAGE_KEY, state);
    localStorage.setItem(INITIAL_FLAG_KEY, 'true');
    setHasSelectedStateInitiallyInternal(true);
  };

  const setHasSelectedStateInitially = (selected: boolean) => {
    setHasSelectedStateInitiallyInternal(selected);
    localStorage.setItem(INITIAL_FLAG_KEY, selected ? 'true' : 'false');
  };

  return (
    <StateJurisdictionContext.Provider
      value={{
        selectedState,
        currentStateMeta: STATE_METADATA_MAP[selectedState],
        setSelectedState,
        hasSelectedStateInitially,
        setHasSelectedStateInitially,
      }}
    >
      {children}
    </StateJurisdictionContext.Provider>
  );
};

export const useStateJurisdiction = () => {
  const context = useContext(StateJurisdictionContext);
  if (!context) {
    throw new Error('useStateJurisdiction must be used within a StateJurisdictionProvider');
  }
  return context;
};
