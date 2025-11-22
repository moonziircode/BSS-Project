
import React, { useState } from 'react';
import { Partner } from '../types';
import { Users, TrendingUp, AlertCircle, Minus, Map as MapIcon, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

interface PartnerManagerProps {
  partners: Partner[];
  onSavePartner: (p: Partner) => void;
  onDeletePartner: (id: string) => void;
}

const PartnerManager: React.FC<PartnerManagerProps> = ({ partners, onSavePartner, onDeletePartner }) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'MAP'>('LIST');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  const mapData = partners.map(p => {
      const [lat, long] = p.coordinates.split(',').map(s => parseFloat(s.trim()));
      return { ...p, x: long || 0, y: lat || 0, z: p.volumeM1 };
  }).filter(p => p.x !== 0);

  return (
    <div className="space-y-6">
       <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
             <h2 className="text-3xl font-light text-white tracking-tight">Partners</h2>
             <p className="text-zinc-500 text-xs mt-1">Ecosystem Health Monitor</p>
          </div>
          <div className="flex gap-2">
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
                   </div>
               ))}
           </div>
       )}

       {activeTab === 'MAP' && (
           <div className="glass-panel p-4 rounded-xl h-[500px] relative">
               <h3 className="absolute top-4 left-4 text-xs font-bold bg-black/50 px-2 py-1 rounded text-zinc-400 z-10">Geo-Spatial Distribution</h3>
               {mapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" name="Longitude" domain={['auto', 'auto']} tick={{fontSize: 10}} hide />
                        <YAxis type="number" dataKey="y" name="Latitude" domain={['auto', 'auto']} tick={{fontSize: 10}} hide />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} name="Volume" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({payload}) => {
                            if (payload && payload[0]) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-black border border-zinc-700 p-2 rounded text-xs text-white">
                                        <p className="font-bold">{d.name}</p>
                                        <p>Vol: {d.volumeM1}</p>
                                    </div>
                                )
                            }
                            return null;
                        }} />
                        <Scatter name="Partners" data={mapData} fill="#8884d8">
                            {mapData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.status === 'GROWTH' ? '#10b981' : entry.status === 'AT_RISK' ? '#ef4444' : '#71717a'} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
               ) : (
                   <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Add coordinates (lat,long) to partners to see map</div>
               )}
           </div>
       )}

       {/* Modal */}
       {isModalOpen && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="glass-panel w-full max-w-lg p-6 rounded-xl shadow-2xl border border-white/10">
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
                          <input className="w-full bg-black border border-white/10 rounded p-2 text-sm text-white" placeholder="-6.200, 106.800" value={formState.coordinates} onChange={e => setFormState({...formState, coordinates: e.target.value})} />
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
