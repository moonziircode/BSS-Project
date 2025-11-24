
import React, { useState, useMemo, useRef } from 'react';
import { Partner } from '../types';
import { Plus, Trash2, Sparkles, Download, MapPin, Navigation, Edit, Upload, Filter, Search, X, MoreHorizontal, FileSpreadsheet } from 'lucide-react';
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
  height: '600px', // Taller map for better visibility
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
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  ],
};

// --- HELPERS ---
const parseCoordinates = (coordString: string) => {
  if (!coordString) return null;
  // Remove spaces and split
  const parts = coordString.replace(/\s/g, '').split(',');
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

const getMarkerIcon = (status: string) => {
  switch (status) {
    case 'GROWTH': return "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
    case 'AT_RISK': return "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
    default: return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
  }
};

// CSV Line Parser (Handles quotes correctly)
const parseCSVLine = (text: string) => {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
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
  
  const defaultFormState: Partial<Partner> = {
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
  };

  const [formState, setFormState] = useState<Partial<Partner>>(defaultFormState);

  // --- CSV IMPORT LOGIC (IMPROVED) ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/); // Handle both \n and \r\n
      if (lines.length < 2) return;

      // Header Mapping (Case Insensitive)
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]+/g, ''));
      
      const findIndex = (keywords: string[]) => {
        return headers.findIndex(h => keywords.some(k => h.includes(k.toLowerCase())));
      };

      const idxName = findIndex(['external store name', 'nama toko', 'store name']);
      const idxService = findIndex(['service type', 'layanan']);
      const idxFirst = findIndex(['first name', 'nama depan']);
      const idxLast = findIndex(['last name', 'nama belakang']);
      const idxCity = findIndex(['city', 'kota']);
      const idxDistrict = findIndex(['district', 'kecamatan']);
      const idxZip = findIndex(['zip', 'kode pos']);
      const idxAddress = findIndex(['address', 'alamat']);
      const idxProv = findIndex(['province', 'provinsi']);
      const idxLong = findIndex(['longitude', 'long']);
      const idxLat = findIndex(['latitude', 'lat']);
      const idxDate = findIndex(['registered date', 'tanggal registrasi']);
      const idxNia = findIndex(['nia']);
      const idxNik = findIndex(['nik']);
      const idxPhone = findIndex(['telp', 'phone', 'hp']);
      const idxUz = findIndex(['uz', 'zona']);
      const idxStaging = findIndex(['staging']);
      const idxOpen = findIndex(['opening', 'buka']);
      const idxClose = findIndex(['closing', 'tutup']);

      let importCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = parseCSVLine(line);
        
        // Safety check for critical fields
        const name = idxName > -1 ? row[idxName] : '';
        if (!name) continue;

        // Combine Lat/Long accurately
        let coordinates = '';
        if (idxLat > -1 && idxLong > -1 && row[idxLat] && row[idxLong]) {
            // Clean up coordinate strings
            const lat = row[idxLat].replace(/[^\d.-]/g, '');
            const lng = row[idxLong].replace(/[^\d.-]/g, '');
            if (lat && lng) {
                coordinates = `${lat}, ${lng}`;
            }
        }

        const newPartner: Partner = {
           id: Math.random().toString(36).substring(7),
           name: name.replace(/['"]+/g, ''),
           serviceType: idxService > -1 ? row[idxService] : 'Reguler',
           ownerName: `${idxFirst > -1 ? row[idxFirst] : ''} ${idxLast > -1 ? row[idxLast] : ''}`.trim().replace(/['"]+/g, ''),
           city: idxCity > -1 ? row[idxCity] : '',
           district: idxDistrict > -1 ? row[idxDistrict] : '',
           zipCode: idxZip > -1 ? row[idxZip] : '',
           address: idxAddress > -1 ? row[idxAddress] : '',
           province: idxProv > -1 ? row[idxProv] : '',
           coordinates: coordinates,
           joinedDate: idxDate > -1 ? row[idxDate] : new Date().toISOString().split('T')[0],
           nia: idxNia > -1 ? row[idxNia] : '',
           nik: idxNik > -1 ? row[idxNik] : '',
           phone: idxPhone > -1 ? row[idxPhone] : '',
           uz: idxUz > -1 ? row[idxUz] : '',
           stagingCode: idxStaging > -1 ? row[idxStaging] : '',
           openingHour: idxOpen > -1 ? row[idxOpen] : '',
           closingHour: idxClose > -1 ? row[idxClose] : '',
           // Default metrics
           volumeM3: 0,
           volumeM2: 0,
           volumeM1: 0,
           status: 'STAGNANT'
        };

        onSavePartner(newPartner);
        importCount++;
      }
      
      alert(`Import Success: ${importCount} partners added.`);
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

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormState(defaultFormState);
    setIsModalOpen(true);
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
    setEditingId(null);
    setFormState(defaultFormState);
  };

  const openEdit = (p: Partner) => {
      setEditingId(p.id);
      setFormState(p);
      setIsModalOpen(true);
      setActiveMarker(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this partner?")) {
        onDeletePartner(id);
    }
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

  return (
    <div className="space-y-6 pb-20">
       <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
          <div>
             <h2 className="text-3xl font-light text-white tracking-tight">Partner Ecosystem</h2>
             <p className="text-zinc-500 text-xs mt-1">
                 {filteredPartners.length} Active Partners • {uniqueCities.length} Cities
             </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap justify-end">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button onClick={() => fileInputRef.current?.click()} className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:text-white hover:border-zinc-600 transition-colors">
                <Upload size={14}/> Import CSV
            </button>
            <button onClick={handleExportCSV} className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 hover:text-white hover:border-zinc-600 transition-colors">
                <Download size={14}/> Export
            </button>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex">
                <button onClick={() => setActiveTab('LIST')} className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${activeTab === 'LIST' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>List</button>
                <button onClick={() => setActiveTab('MAP')} className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${activeTab === 'MAP' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Map</button>
            </div>
            <button onClick={handleOpenAdd} className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors shadow-glow">
                <Plus size={14}/> Add New
            </button>
          </div>
       </header>

       {/* FILTERS */}
       <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md relative">
                <input 
                    className="w-full bg-black border border-white/10 rounded-lg pl-9 pr-2 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-white transition-colors" 
                    placeholder="Search Partner Name, NIA, or Owner..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
              </div>
              
              <div className="flex items-center gap-2 cursor-pointer ml-4" onClick={() => setShowFilters(!showFilters)}>
                  <Filter size={14} className={showFilters ? "text-white" : "text-zinc-500"} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${showFilters ? "text-white" : "text-zinc-500"}`}>Filters</span>
              </div>
          </div>
          
          {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-down border-t border-white/5 pt-4">
                  <div>
                      <label className="block text-[9px] text-zinc-500 uppercase mb-1">City</label>
                      <select className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                          <option value="ALL">All Cities</option>
                          {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-[9px] text-zinc-500 uppercase mb-1">District</label>
                      <select className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
                          <option value="ALL">All Districts</option>
                          {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-[9px] text-zinc-500 uppercase mb-1">Service Type</label>
                      <select className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white outline-none" value={filterService} onChange={e => setFilterService(e.target.value)}>
                          <option value="ALL">All Services</option>
                          {uniqueServiceTypes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-[9px] text-zinc-500 uppercase mb-1">Health Status</label>
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
           <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
               <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                       <thead className="bg-zinc-900/50 text-zinc-500 text-[10px] uppercase tracking-wider border-b border-white/10">
                           <tr>
                               <th className="px-6 py-4 font-bold">Partner Name</th>
                               <th className="px-6 py-4 font-bold">NIA / Type</th>
                               <th className="px-6 py-4 font-bold">Location</th>
                               <th className="px-6 py-4 font-bold">Coordinates</th>
                               <th className="px-6 py-4 font-bold">Volume (M1)</th>
                               <th className="px-6 py-4 font-bold">Status</th>
                               <th className="px-6 py-4 font-bold text-right">Actions</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                           {filteredPartners.length === 0 ? (
                               <tr><td colSpan={7} className="text-center py-10 text-zinc-600 text-sm italic">No partners found matching criteria.</td></tr>
                           ) : (
                               filteredPartners.map(p => (
                                   <tr key={p.id} className="group hover:bg-zinc-900/30 transition-colors">
                                       <td className="px-6 py-3">
                                           <div className="font-semibold text-sm text-zinc-200">{p.name}</div>
                                           <div className="text-[10px] text-zinc-500">{p.ownerName}</div>
                                       </td>
                                       <td className="px-6 py-3">
                                           <div className="font-mono text-xs text-zinc-300">{p.nia || '-'}</div>
                                           <div className="text-[10px] text-zinc-500">{p.serviceType}</div>
                                       </td>
                                       <td className="px-6 py-3">
                                           <div className="text-xs text-zinc-300">{p.district}</div>
                                           <div className="text-[10px] text-zinc-500">{p.city}</div>
                                       </td>
                                       <td className="px-6 py-3">
                                            {p.coordinates ? (
                                                <div className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-900/10 px-2 py-0.5 rounded w-fit border border-blue-900/30">
                                                    <MapPin size={10} /> Has Coords
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-zinc-600 italic">Missing</span>
                                            )}
                                       </td>
                                       <td className="px-6 py-3">
                                           <div className="text-sm font-bold text-white font-mono">{p.volumeM1}</div>
                                           <div className="h-0.5 w-12 bg-zinc-800 mt-1 rounded-full overflow-hidden">
                                               <div className={`h-full ${p.status === 'GROWTH' ? 'bg-emerald-500' : p.status === 'AT_RISK' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: '100%' }}></div>
                                           </div>
                                       </td>
                                       <td className="px-6 py-3">
                                           <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                               p.status === 'GROWTH' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                               p.status === 'AT_RISK' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                               'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                           }`}>
                                               {p.status}
                                           </span>
                                       </td>
                                       <td className="px-6 py-3 text-right">
                                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <button onClick={() => openEdit(p)} className="p-2 bg-zinc-800 hover:bg-white hover:text-black rounded-md text-zinc-400 transition-all" title="Edit">
                                                   <Edit size={14} />
                                               </button>
                                               <button onClick={() => handleDelete(p.id)} className="p-2 bg-zinc-800 hover:bg-red-900 hover:text-red-400 rounded-md text-zinc-400 transition-all" title="Delete">
                                                   <Trash2 size={14} />
                                               </button>
                                               <AIButton onClick={(e) => handleAnalyze(e, p)} loading={analyzing} label="" icon={Sparkles} size="sm" variant="secondary" />
                                           </div>
                                       </td>
                                   </tr>
                               ))
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {activeTab === 'MAP' && (
           <div className="glass-panel p-1 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
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
                             <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white focus:border-white transition-colors" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                          </div>
                          <div className="col-span-2 md:col-span-1">
                             <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">NIA</label>
                             <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white uppercase focus:border-white transition-colors" value={formState.nia} onChange={e => setFormState({...formState, nia: e.target.value})} />
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
                          <div className="flex-1 flex gap-3">
                              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-zinc-900 text-zinc-400 rounded-lg text-xs font-bold border border-zinc-800 hover:bg-zinc-800">Cancel</button>
                              <button onClick={handleSave} className="flex-1 py-3 bg-white text-black rounded-lg text-xs font-bold hover:bg-zinc-200 shadow-glow transition-all">Save Partner</button>
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
