'use client';
import React from 'react';
import type { Tenant } from './types';

interface SidebarProps {
  tenants: Tenant[];
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  loadingTenants: boolean;
  setIsTenantModalOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ tenants, selectedTenantId, setSelectedTenantId, loadingTenants, setIsTenantModalOpen }) => (
  <aside className="w-80 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
    <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-zinc-950">
          B
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            Balos SaaS
          </h1>
          <span className="text-xs text-zinc-500 font-medium">Kenyan SME Inventory</span>
        </div>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        <span>Registered Tenants</span>
        <button
          onClick={() => setIsTenantModalOpen(true)}
          className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 normal-case text-xs font-normal"
        >
          + Add New
        </button>
      </div>
      {loadingTenants ? (
        <div className="py-8 text-center text-sm text-zinc-600">Loading tenants...</div>
      ) : tenants.length === 0 ? (
        <div className="py-8 text-center text-sm text-zinc-600">No tenants registered.</div>
      ) : (
        tenants.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTenantId(t.id)}
            className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 border flex items-center justify-between group ${selectedTenantId === t.id ? 'bg-zinc-800 border-zinc-700 text-zinc-50 font-medium shadow-md shadow-black/30' : 'bg-transparent border-transparent hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'}`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className={`h-2 w-2 rounded-full shrink-0 ${selectedTenantId === t.id ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              <span className="truncate text-sm">{t.name}</span>
            </div>
            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500 font-mono truncate shrink-0 ml-2">..{t.id.slice(-6)}</span>
          </button>
        ))
      )}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-xs text-zinc-500 leading-normal flex items-start gap-2.5">
          <svg className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <span className="font-semibold text-zinc-400 block mb-0.5">Tenant Isolation Enabled</span>
            All queries automagically scoped using <code className="text-emerald-400 font-mono">x-tenant-id</code>.
          </div>
        </div>
      </div>
    </div>
  </aside>
);
