
import React, { useState, useCallback } from 'react';
import { Partner } from '../types';
import { Plus, Trash2, Sparkles, Download, MapPin, Navigation, Edit } from 'lucide-react';
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

// Default Center (Jakarta) - adjust if needed
const defaultCenter = {
  lat: -6.200000,
  lng: 106.816666
};

// Dark Mode / Obsidian Map Style
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ],
};

// --- HELPERS ---

// 1. Parse "lat, lng" string to object
const parseCoordinates = (coordString: string) => {
  if (!coordString) return null;
  const parts = coordString.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return { lat: parts[0], lng: parts[1] };
};

// 2. Get Marker Color based on Status
const getMarkerIcon = (status: string) => {
  // Using standard Google colored pins for simplicity and reliability
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
  
  // Map State
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  
  // AI Hook
  const { run: runAnalysis, loading: analyzing } = useAIPartnerAnalysis();
  
  const [formState, setFormState] = useState<Partial<Partner>>({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    coordinates: '',
    joinedDate: new Date().toISOString().split('T')[0],
    volumeM3: 0,
    volumeM2: 0,
    volumeM1: 0,
    status: 'STAGNANT'
  });

  // Segmentation Logic
  const getStatus = (m1: number, m2: number) => {
    if (m1 > m2 * 1.1) return 'GROWTH';
    if (m1 < m2 * 0.8) return 'AT_RISK';
    return 'STAGNANT';
  };

  const handleSave = () => {
    if (!formState.name) return;
    const status = getStatus(Number(formState.volumeM1), Number(formState.volumeM2));
    const newPartner: Partner = {
        id: editingId || Math.random().toString(36).substring(7),
        name: formState.name || '',
        ownerName: formState.ownerName || '',
        phone: formState.phone || '',
        address: formState.address || '',
        coordinates: formState.coordinates || '',
        joinedDate: formState.joinedDate || '',
        volumeM3: Number(formState.volumeM3) || 0,
        volumeM2: Number(formState.volumeM2) || 0,
        volumeM1: Number(formState.volumeM1) || 0,
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
        volumeM3: 0, volumeM2: 0, volumeM1: 0
    });
  };

  const openEdit = (p: Partner) => {
      setEditingId(p.id);
      setFormState(p);
      setIsModalOpen(true);
      setActiveMarker(null); // Close InfoWindow if open
  };
  
  const handleAnalyze = async (e: React.MouseEvent, p: Partner) => {
      e.stopPropagation();
      const insight = await runAnalysis(p);
      if (insight) alert(`🤖 AI Business Insight untuk ${p.name}:\n\n${insight}`);
  };

  // Export to CSV for Google My Maps
  const handleExportCSV = () => {
    const headers = ['Name,Latitude,Longitude,Status,Volume,Description'];
    const rows = partners.map(p => {
       const coords = parseCoordinates(p.coordinates);
       const lat = coords ? coords.lat : 0;
       const lng = coords ? coords.lng : 0;
       return `"${p.name}",${lat},${lng},${p.status},${p.volumeM1},"${p.ownerName} - ${p.phone}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "anteraja_partners_ecosystem.csv");
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
             <p className="text-zinc-500 text-xs mt-1">Ecosystem Health Monitor</p>
          </div>
          <div className="flex gap-2">
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

       {activeTab === 'LIST' && (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {partners.map(p => (
                   <div key={p.id} onClick={() => openEdit(p)} className="glass-panel p-5 rounded-xl hover:bg-zinc-900/30 transition-all cursor-pointer group border border-transparent hover:border-white/10">
                       <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-inner
                                   ${p.status === 'GROWTH' ? 'bg-emerald-900/50 border border-emerald-500/30' : 
                                     p.status === 'AT_RISK' ? 'bg-red-900/50 border border-red-500/30' : 
                                     'bg-zinc-800 border border-zinc-700'}`}>
                                   {p.name.charAt(0)}
                               </div>
                               <div>
                                   <h3 className="text-sm font-semibold text-zinc-200">{p.name}</h3>
                                   <div className="flex items-center gap-2 mt-0.5">
                                       <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border 
                                           ${p.status === 'GROWTH' ? 'text-emerald-400 border-emerald-900 bg-emerald-900/20' : 
                                             p.status === 'AT_RISK' ? 'text-red-400 border-red-900 bg-red-900/20' : 
                                             'text-zinc-400 border-zinc-700 bg-zinc-800'}`}>
                                           {p.status.replace('_', ' ')}
                                       </span>
                                   </div>
                               </div>
                           </div>
                           {renderTrend(p)}
                       </div>
                       
                       <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                          <div>
                             <span className="block text-[9px] text-zinc-500 uppercase">M-2 Vol</span>
                             <span className="text-xs font-mono text-zinc-400">{p.volumeM3}</span>
                          </div>
                          <div>
                             <span className="block text-[9px] text-zinc-500 uppercase">M-1 Vol</span>
                             <span className="text-xs font-mono text-zinc-400">{p.volumeM2}</span>
                          </div>
                          <div>
                             <span className="block text-[9px] text-zinc-500 uppercase">Current</span>
                             <span className="text-xs font-mono text-white font-bold">{p.volumeM1}</span>
                          </div>
                       </div>
                       
                       <div className="mt-3 border-t border-white/5 pt-2 flex justify-end">
                           <AIButton 
                              onClick={(e) => handleAnalyze(e, p)} 
                              loading={analyzing} 
                              label="Analisa Bisnis" 
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
                    {partners.map(p => {
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
                                            <p className="text-xs text-gray-600 mb-2">{p.ownerName} • Vol: {p.volumeM1}</p>
                                            <div className="flex gap-2 mt-2">
                                                <button 
                                                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`, '_blank')}
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

       {/* Modal */}
       {isModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="glass-panel w-full max-w-lg p-6 rounded-xl shadow-2xl border border-white/10 animate-scale-up">
                  <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Partner' : 'New Partner'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Partner Name</label>
                          <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Owner</label>
                            <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" value={formState.ownerName} onChange={e => setFormState({...formState, ownerName: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Phone</label>
                            <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" value={formState.phone} onChange={e => setFormState({...formState, phone: e.target.value})} />
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Coordinates (Lat, Long)</label>
                          <div className="relative">
                            <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" placeholder="-6.200, 106.800" value={formState.coordinates} onChange={e => setFormState({...formState, coordinates: e.target.value})} />
                            <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
                          </div>
                          <p className="text-[9px] text-zinc-600 mt-1">Required for map placement.</p>
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
