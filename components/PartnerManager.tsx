
import React, { useState, useMemo, useRef } from 'react';
import { Partner } from '../types';
import { Plus, Trash2, Sparkles, Download, MapPin, Navigation, Edit, Upload, Filter, Search, X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useAIPartnerAnalysis } from '../services/ai/aiHooks';
import { AIButton } from './AI/AIButtons';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

interface PartnerManagerProps {
  partners: Partner[];
  onSavePartner: (p: Partner) => void;
  onDeletePartner: (id: string) => void;
}

// --- MAP CONFIGURATION ---
const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.75rem',
};

const defaultCenter = {
  lat: -6.200000,
  lng: 106.816666
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
  ],
};

// --- HELPERS ---
const parseCoordinates = (coordString: string) => {
  if (!coordString) return null;
  const parts = coordString.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { lat: parts[0], lng: parts[1] };
};

const getMarkerIcon = (status: string) => {
  switch (status) {
    case 'GROWTH': return "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
    case 'AT_RISK': return "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
    default: return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  }
};

const PartnerManager: React.FC<PartnerManagerProps> = ({ partners, onSavePartner, onDeletePartner }) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'MAP'>('LIST');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('ALL');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterService, setFilterService] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const { run: runAnalysis, loading: analyzing } = useAIPartnerAnalysis();
  
  const [formState, setFormState] = useState<Partial<Partner>>({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    coordinates: '',
    nia: '',
    uz: '',
    serviceType: 'Reguler',
    stagingCode: '',
    joinedDate: new Date().toISOString().split('T')[0],
    volumeM3: 0,
    volumeM2: 0,
    volumeM1: 0,
    status: 'STAGNANT'
  });

  // --- CSV IMPORT LOGIC ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Expected Headers based on user request
      // External Store Name, Service Type, First Name, Last Name, City, District, Zip Code, Address, Province, Longitude, Latitude, Registered Date, NIA, NIK, No. Telp, UZ, Staging Code, Opening Hour, Closing Hour

      const getColIndex = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

      const idxName = getColIndex('External Store Name');
      const idxService = getColIndex('Service Type');
      const idxFirst = getColIndex('First Name');
      const idxLast = getColIndex('Last Name');
      const idxCity = getColIndex('City');
      const idxDistrict = getColIndex('District');
      const idxZip = getColIndex('Zip Code');
      const idxAddress = getColIndex('Address');
      const idxProv = getColIndex('Province');
      const idxLong = getColIndex('Longitude');
      const idxLat = getColIndex('Latitude');
      const idxDate = getColIndex('Registered Date');
      const idxNia = getColIndex('NIA');
      const idxNik = getColIndex('NIK');
      const idxPhone = getColIndex('No. Telp');
      const idxUz = getColIndex('UZ');
      const idxStaging = getColIndex('Staging Code');
      const idxOpen = getColIndex('Opening Hour');
      const idxClose = getColIndex('Closing Hour');

      let importCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Handle CSV split respecting quotes (basic implementation)
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/"/g, ''));
        
        if (row.length < 5) continue; // Skip invalid rows

        const newPartner: Partner = {
           id: Math.random().toString(36).substring(7),
           name: row[idxName] || 'Unknown',
           serviceType: row[idxService] || 'Reguler',
           ownerName: `${row[idxFirst] || ''} ${row[idxLast] || ''}`.trim(),
           city: row[idxCity] || '',
           district: row[idxDistrict] || '',
           zipCode: row[idxZip] || '',
           address: row[idxAddress] || '',
           province: row[idxProv] || '',
           // Combine Lat/Long
           coordinates: (row[idxLat] && row[idxLong]) ? `${row[idxLat]}, ${row[idxLong]}` : '',
           joinedDate: row[idxDate] || new Date().toISOString().split('T')[0],
           nia: row[idxNia] || '',
           nik: row[idxNik] || '',
           phone: row[idxPhone] || '',
           uz: row[idxUz] || '',
           stagingCode: row[idxStaging] || '',
           openingHour: row[idxOpen] || '',
           closingHour: row[idxClose] || '',
           // Default metrics
           volumeM3: 0,
           volumeM2: 0,
           volumeM1: 0,
           status: 'STAGNANT'
        };

        onSavePartner(newPartner);
        importCount++;
      }
      
      alert(`Successfully imported ${importCount} partners.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // --- FILTER LOGIC ---
  const uniqueCities = useMemo(() => Array.from(new Set(partners.map(p => p.city).filter(Boolean))).sort(), [partners]);
  const uniqueDistricts = useMemo(() => Array.from(new Set(partners.map(p => p.district).filter(Boolean))).sort(), [partners]);
  const uniqueServiceTypes = useMemo(() => Array.from(new Set(partners.map(p => p.serviceType).filter(Boolean))).sort(), [partners]);

  const filteredPartners = useMemo(() => {
     return partners.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
                            (p.nia || '').toLowerCase().includes(search.toLowerCase());
        const matchCity = filterCity === 'ALL' || p.city === filterCity;
        const matchDistrict = filterDistrict === 'ALL' || p.district === filterDistrict;
        const matchService = filterService === 'ALL' || p.serviceType === filterService;
        const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
        
        return matchSearch && matchCity && matchDistrict && matchService && matchStatus;
     });
  }, [partners, search, filterCity, filterDistrict, filterService, filterStatus]);

  const getStatus = (m1: number, m2: number) => {
    if (m1 > m2 * 1.1) return 'GROWTH';
    if (m1 < m2 * 0.8) return 'AT_RISK';
    return 'STAGNANT';
  };

  const handleSave = () => {
    if (!formState.name) return;
    const status = getStatus(Number(formState.volumeM1), Number(formState.volumeM2));
    const newPartner: Partner = {
        ...(formState as Partner),
        id: editingId || Math.random().toString(36).substring(7),
        status: status
    };
    onSavePartner(newPartner);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormState({
        name: '', ownerName: '', phone: '', address: '', coordinates: '', 
        nia: '', city: '', district: '', serviceType: 'Reguler',
        volumeM3: 0, volumeM2: 0, volumeM1: 0
    });
  };

  const openEdit = (p: Partner) => {
      setEditingId(p.id);
      setFormState(p);
      setIsModalOpen(true);
      setActiveMarker(null);
  };
  
  const handleAnalyze = async (e: React.MouseEvent, p: Partner) => {
      e.stopPropagation();
      const insight = await runAnalysis(p);
      if (insight) alert(`🤖 AI Business Insight untuk ${p.name}:\n\n${insight}`);
  };

  const handleExportCSV = () => {
    const headers = ['Name,NIA,Service Type,City,District,Latitude,Longitude,Status,Volume,Owner'];
    const rows = filteredPartners.map(p => {
       const coords = parseCoordinates(p.coordinates);
       const lat = coords ? coords.lat : 0;
       const lng = coords ? coords.lng : 0;
       return `"${p.name}","${p.nia}","${p.serviceType}","${p.city}","${p.district}",${lat},${lng},${p.status},${p.volumeM1},"${p.ownerName}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "anteraja_partners_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTrend = (p: Partner) => {
      const data = [
          { name: 'M-2', val: p.volumeM3 },
          { name: 'M-1', val: p.volumeM2 },
          { name: 'Now', val: p.volumeM1 },
      ];
      return (
          <div className="h-[60px] w-[120px]">
             <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data}>
                     <Line type="monotone" dataKey="val" stroke={p.status === 'GROWTH' ? '#10b981' : p.status === 'AT_RISK' ? '#ef4444' : '#71717a'} strokeWidth={2} dot={false} />
                 </LineChart>
             </ResponsiveContainer>
          </div>
      );
  };

  return (
    <div className="space-y-6">
       <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
          <div>
             <h2 className="text-3xl font-light text-white tracking-tight">Partners</h2>
             <p className="text-zinc-500 text-xs mt-1">
                 {filteredPartners.length} Partners Found • Ecosystem Health Monitor
             </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Import Button */}
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button onClick={() => fileInputRef.current?.click()} className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:text-white hover:border-zinc-600">
                <Upload size={14}/> Import CSV
            </button>
            <button onClick={handleExportCSV} className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:text-white hover:border-zinc-600">
                <Download size={14}/> CSV
            </button>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex">
                <button onClick={() => setActiveTab('LIST')} className={`px-3 py-1.5 text-xs font-medium rounded ${activeTab === 'LIST' ? 'bg-white text-black' : 'text-zinc-500'}`}>List</button>
                <button onClick={() => setActiveTab('MAP')} className={`px-3 py-1.5 text-xs font-medium rounded ${activeTab === 'MAP' ? 'bg-white text-black' : 'text-zinc-500'}`}>Map</button>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                <Plus size={14}/> Add
            </button>
          </div>
       </header>

       {/* EXCEL STYLE FILTERS */}
       <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} className="text-zinc-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Advanced Filters</span>
              {showFilters ? <span className="text-[9px] text-zinc-500 ml-2">(Hide)</span> : <span className="text-[9px] text-zinc-500 ml-2">(Show)</span>}
          </div>
          
          {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in-down">
                  <div className="col-span-2 md:col-span-1">
                      <div className="relative">
                        <input 
                            className="w-full bg-black border border-white/10 rounded-lg pl-8 pr-2 py-2 text-xs text-white" 
                            placeholder="Search Name / NIA..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"/>
                      </div>
                  </div>
                  <div>
                      <select className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                          <option value="ALL">All Cities</option>
                          {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div>
                      <select className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
                          <option value="ALL">All Districts</option>
                          {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                  </div>
                  <div>
                      <select className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" value={filterService} onChange={e => setFilterService(e.target.value)}>
                          <option value="ALL">All Services</option>
                          {uniqueServiceTypes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div>
                      <select className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                          <option value="ALL">All Status</option>
                          <option value="GROWTH">Growth (Green)</option>
                          <option value="STAGNANT">Stagnant (Yellow)</option>
                          <option value="AT_RISK">At Risk (Red)</option>
                      </select>
                  </div>
              </div>
          )}
       </div>

       {activeTab === 'LIST' && (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {filteredPartners.map(p => (
                   <div key={p.id} onClick={() => openEdit(p)} className="glass-panel p-5 rounded-xl hover:bg-zinc-900/30 transition-all cursor-pointer group border border-transparent hover:border-white/10">
                       <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-inner text-xs
                                   ${p.status === 'GROWTH' ? 'bg-emerald-900/50 border border-emerald-500/30' : 
                                     p.status === 'AT_RISK' ? 'bg-red-900/50 border border-red-500/30' : 
                                     'bg-zinc-800 border border-zinc-700'}`}>
                                   {(p.nia || '').slice(-2) || p.name.charAt(0)}
                               </div>
                               <div>
                                   <h3 className="text-sm font-semibold text-zinc-200 line-clamp-1" title={p.name}>{p.name}</h3>
                                   <div className="flex items-center gap-2 mt-0.5">
                                       <span className="text-[9px] px-1.5 py-0.5 rounded font-bold border border-zinc-800 bg-zinc-900 text-zinc-400">
                                           {p.nia}
                                       </span>
                                       <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-500">
                                           {p.city}
                                       </span>
                                   </div>
                               </div>
                           </div>
                           {renderTrend(p)}
                       </div>
                       
                       <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                          <div>
                             <span className="block text-[9px] text-zinc-500 uppercase">Service</span>
                             <span className="text-xs font-mono text-zinc-400 truncate">{p.serviceType}</span>
                          </div>
                          <div>
                             <span className="block text-[9px] text-zinc-500 uppercase">District</span>
                             <span className="text-xs font-mono text-zinc-400 truncate">{p.district}</span>
                          </div>
                          <div>
                             <span className="block text-[9px] text-zinc-500 uppercase">Current Vol</span>
                             <span className="text-xs font-mono text-white font-bold">{p.volumeM1}</span>
                          </div>
                       </div>
                       
                       <div className="mt-3 border-t border-white/5 pt-2 flex justify-end">
                           <AIButton 
                              onClick={(e) => handleAnalyze(e, p)} 
                              loading={analyzing} 
                              label="Analisa" 
                              size="sm" 
                              variant="secondary" 
                              icon={Sparkles} 
                           />
                       </div>
                   </div>
               ))}
           </div>
       )}

       {activeTab === 'MAP' && (
           <div className="glass-panel p-1 rounded-xl overflow-hidden border border-white/10">
               <LoadScript googleMapsApiKey="AIzaSyBNuH9od-jt15CJ5skLrhZ7VqUUyrPedLU">
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={defaultCenter}
                    zoom={11}
                    options={mapOptions}
                  >
                    {filteredPartners.map(p => {
                        const coords = parseCoordinates(p.coordinates);
                        if (!coords) return null;
                        
                        return (
                            <Marker
                                key={p.id}
                                position={coords}
                                icon={getMarkerIcon(p.status)}
                                onClick={() => setActiveMarker(p.id)}
                            >
                                {activeMarker === p.id && (
                                    <InfoWindow 
                                        position={coords} 
                                        onCloseClick={() => setActiveMarker(null)}
                                        options={{ pixelOffset: new (window as any).google.maps.Size(0, -30) }}
                                    >
                                        <div className="p-2 text-black max-w-[200px]">
                                            <h3 className="font-bold text-sm">{p.name}</h3>
                                            <p className="text-[10px] text-gray-500 font-bold mb-1">{p.nia} - {p.serviceType}</p>
                                            <p className="text-xs text-gray-600 mb-2">{p.address} ({p.district})</p>
                                            <p className="text-xs text-gray-800 font-medium">Vol: {p.volumeM1}</p>
                                            <div className="flex gap-2 mt-2">
                                                <button 
                                                  onClick={() => window.open(p.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank')}
                                                  className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 flex-1 flex items-center justify-center gap-1 text-[10px]"
                                                  title="Navigate"
                                                >
                                                    <Navigation size={12}/> Nav
                                                </button>
                                                <button 
                                                  onClick={() => openEdit(p)}
                                                  className="bg-gray-200 text-gray-800 p-1.5 rounded hover:bg-gray-300 flex-1 flex items-center justify-center gap-1 text-[10px]"
                                                  title="Edit"
                                                >
                                                    <Edit size={12}/> Edit
                                                </button>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </Marker>
                        );
                    })}
                  </GoogleMap>
               </LoadScript>
           </div>
       )}

       {/* Edit/Add Modal */}
       {isModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="glass-panel w-full max-w-2xl p-6 rounded-xl shadow-2xl border border-white/10 animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Partner' : 'New Partner'}</h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="text-zinc-500 hover:text-white" size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 md:col-span-1">
                             <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">External Store Name</label>
                             <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                             <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">NIA</label>
                             <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white uppercase" value={formState.nia} onChange={e => setFormState({...formState, nia: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Service Type</label>
                            <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" value={formState.serviceType} onChange={e => setFormState({...formState, serviceType: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">UZ</label>
                            <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white uppercase" value={formState.uz} onChange={e => setFormState({...formState, uz: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Staging Code</label>
                            <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white uppercase" value={formState.stagingCode} onChange={e => setFormState({...formState, stagingCode: e.target.value})} />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Owner Name</label>
                            <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" value={formState.ownerName} onChange={e => setFormState({...formState, ownerName: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Phone</label>
                            <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" value={formState.phone} onChange={e => setFormState({...formState, phone: e.target.value})} />
                          </div>
                      </div>

                      <div className="bg-zinc-900/30 p-3 rounded-lg border border-white/5">
                          <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-2">Location Details</label>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <input placeholder="City" className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white" value={formState.city} onChange={e => setFormState({...formState, city: e.target.value})} />
                              </div>
                              <div>
                                <input placeholder="District" className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white" value={formState.district} onChange={e => setFormState({...formState, district: e.target.value})} />
                              </div>
                          </div>
                          <input placeholder="Full Address" className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white mb-3" value={formState.address} onChange={e => setFormState({...formState, address: e.target.value})} />
                          
                          <div className="grid grid-cols-2 gap-3">
                             <div className="relative">
                                <input className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white" placeholder="Lat, Long (e.g -6.2, 106.8)" value={formState.coordinates} onChange={e => setFormState({...formState, coordinates: e.target.value})} />
                                <MapPin size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"/>
                             </div>
                             <div className="relative">
                                <input className="w-full bg-black border border-white/10 rounded p-2 text-xs text-white" placeholder="Google Maps Link (Optional)" value={formState.googleMapsLink} onChange={e => setFormState({...formState, googleMapsLink: e.target.value})} />
                                <Navigation size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"/>
                             </div>
                          </div>
                      </div>
                      
                      <div className="bg-zinc-900/50 p-3 rounded border border-white/10">
                          <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-2">Volume History</label>
                          <div className="grid grid-cols-3 gap-3">
                              <div>
                                  <span className="text-[9px] text-zinc-500">Month -2</span>
                                  <input type="number" className="w-full bg-black border border-white/10 rounded p-1 text-sm text-white" value={formState.volumeM3} onChange={e => setFormState({...formState, volumeM3: Number(e.target.value)})} />
                              </div>
                              <div>
                                  <span className="text-[9px] text-zinc-500">Month -1</span>
                                  <input type="number" className="w-full bg-black border border-white/10 rounded p-1 text-sm text-white" value={formState.volumeM2} onChange={e => setFormState({...formState, volumeM2: Number(e.target.value)})} />
                              </div>
                              <div>
                                  <span className="text-[9px] text-zinc-500">Current</span>
                                  <input type="number" className="w-full bg-black border border-white/10 rounded p-1 text-sm text-white" value={formState.volumeM1} onChange={e => setFormState({...formState, volumeM1: Number(e.target.value)})} />
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                          {editingId && <button onClick={() => { onDeletePartner(editingId); setIsModalOpen(false); }} className="p-2 text-red-500 hover:bg-red-900/20 rounded"><Trash2 size={16}/></button>}
                          <div className="flex-1 flex gap-3">
                              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-zinc-400 text-xs font-bold">Cancel</button>
                              <button onClick={handleSave} className="flex-1 py-2 bg-white text-black rounded text-xs font-bold hover:bg-zinc-200">Save</button>
                          </div>
                      </div>
                  </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default PartnerManager;
