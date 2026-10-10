'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthView from '@/components/AuthView';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { api } from '@/lib/api';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Shirt,
  Utensils,
  ShoppingBag,
  CheckCircle,
} from 'lucide-react';

export default function ServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('General');

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await api.getServices();
      if (res?.services) {
        setServices(res.services);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadServices();
    }
  }, [user]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormUnit('pcs');
    setFormPrice('');
    setFormCategory('General');
    setModalOpen(true);
  };

  const openEditModal = (service: any) => {
    setEditingId(service.id);
    setFormName(service.name);
    setFormUnit(service.unit);
    setFormPrice(String(service.price));
    setFormCategory(service.category || 'General');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      alert('Service name and price are required');
      return;
    }

    try {
      const payload = {
        name: formName,
        unit: formUnit,
        price: parseFloat(formPrice) || 0,
        category: formCategory,
      };

      if (editingId) {
        await api.updateService(editingId, payload);
      } else {
        await api.createService(payload);
      }

      setModalOpen(false);
      loadServices();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this service from your catalog?')) return;
    try {
      await api.deleteService(id);
      loadServices();
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  if (authLoading) return null;
  if (!user) return null;

  const currency = user.currency || '₹';

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Service & Item Catalog
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Define your pricing per piece, kg, meal or plate for one-tap daily entry.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Service</span>
          </button>
        </div>

        {/* Services List Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-stone-800">
            <Layers className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">No services in catalog</div>
            <p className="text-xs text-stone-400 mt-1">Add items like Ironing, Dry Clean, or Meals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {services.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-2xl p-4 border border-stone-800/80 flex items-center justify-between gap-3 hover:border-stone-700 transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-0.5">
                    {item.category || 'Service'}
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <div className="text-base font-extrabold text-amber-400 mt-1">
                    {currency}{parseFloat(item.price).toFixed(0)}
                    <span className="text-xs font-normal text-stone-400 ml-1">
                      / {item.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">
                {editingId ? 'Edit Service' : 'Add New Service / Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Service / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ironing / Pressing, Dry Cleaning, Tiffin Meal"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-300 mb-1">Price ({currency}) *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 8 or 120"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-300 mb-1">Billing Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="meal">Meal / Tiffin</option>
                    <option value="pack">Pack / Box</option>
                    <option value="ltr">Liter (ltr)</option>
                    <option value="service">Service / Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Ironing, Washing, Dry Clean, Lunch"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
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
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
