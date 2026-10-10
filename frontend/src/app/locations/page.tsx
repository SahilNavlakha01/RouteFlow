'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthView from '@/components/AuthView';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { api } from '@/lib/api';
import {
  MapPin,
  Building,
  Plus,
  Trash2,
  X,
  Layers,
  Users,
} from 'lucide-react';

export default function LocationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Society Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [socName, setSocName] = useState('');
  const [socAddress, setSocAddress] = useState('');
  const [socBlocksStr, setSocBlocksStr] = useState('Block A, Block B');

  // Add Block to specific society modal
  const [targetSocId, setTargetSocId] = useState<number | null>(null);
  const [newBlockName, setNewBlockName] = useState('');

  const loadLocations = async () => {
    try {
      setLoading(true);
      const res = await api.getLocations();
      if (res?.societies) {
        setSocieties(res.societies);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadLocations();
    }
  }, [user]);

  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socName) return;

    try {
      const blocks = socBlocksStr
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);

      await api.createSociety({
        name: socName,
        address: socAddress,
        initialBlocks: blocks,
      });

      setModalOpen(false);
      setSocName('');
      setSocAddress('');
      setSocBlocksStr('Block A, Block B');
      loadLocations();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSocId || !newBlockName) return;

    try {
      await api.createBlock(targetSocId, { name: newBlockName });
      setTargetSocId(null);
      setNewBlockName('');
      loadLocations();
    } catch (err: any) {
      alert('Error adding wing: ' + err.message);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!confirm('Delete this block?')) return;
    try {
      await api.deleteBlock(id);
      loadLocations();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteSociety = async (id: number) => {
    if (!confirm('Are you sure you want to delete this society and all its blocks?')) return;
    try {
      await api.deleteSociety(id);
      loadLocations();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (authLoading) return null;
  if (!user) return null;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              Societies & Complex Map
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Organize your delivery routes by society buildings, wings, and towers.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Society / Complex</span>
          </button>
        </div>

        {/* Societies Cards */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : societies.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-stone-800">
            <Building className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">No societies mapped yet</div>
            <p className="text-xs text-stone-400 mt-1">Add your daily customer buildings to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {societies.map((soc) => (
              <div
                key={soc.id}
                className="glass-panel rounded-2xl p-5 border border-stone-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center font-bold text-amber-400">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{soc.name}</h3>
                        <p className="text-xs text-stone-400">{soc.address || 'Neighborhood Complex'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSociety(soc.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Wings / Blocks Tags */}
                  <div className="mt-4 pt-3 border-t border-stone-800/60">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center justify-between">
                      <span>Wings & Blocks ({soc.blocks?.length || 0})</span>
                      <button
                        onClick={() => setTargetSocId(soc.id)}
                        className="text-amber-400 hover:underline text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Wing
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {soc.blocks?.length === 0 ? (
                        <span className="text-xs text-stone-500 italic">No wings added yet</span>
                      ) : (
                        soc.blocks.map((block: any) => (
                          <div
                            key={block.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300"
                          >
                            <span>{block.name}</span>
                            <span className="text-[10px] text-stone-500">
                              ({block.customer_count || 0} flats)
                            </span>
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="text-stone-500 hover:text-rose-400 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800/40 text-xs text-stone-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{soc.customer_count || 0} resident customers</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* CREATE SOCIETY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Add Society / Apartment</h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSociety} className="space-y-3.5">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Society Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shivalik Greens, Radhe Residency"
                  value={socName}
                  onChange={(e) => setSocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Near Science City Road, Sola"
                  value={socAddress}
                  onChange={(e) => setSocAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">
                  Initial Blocks / Wings (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block A, Block B, Block C"
                  value={socBlocksStr}
                  onChange={(e) => setSocBlocksStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
                >
                  Save Society
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BLOCK MODAL */}
      {targetSocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-3">Add Wing / Tower</h3>
            <form onSubmit={handleAddBlock} className="space-y-3">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Wing / Block Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wing D, Tower 3"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTargetSocId(null)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
                >
                  Add Wing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
