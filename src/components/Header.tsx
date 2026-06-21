/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative z-10">
      {/* Decorative background visual elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center p-3">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold">
                Department of Health & Family Welfare
              </span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-indigo-300 font-mono">v4.2.0-STABLE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider mt-1 text-white uppercase">
              BUDGET & EXPENDITURE STATEMENT
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-1">
              Office of the Block Medical Officer • Sopore
            </p>
          </div>
        </div>
        
        <div className="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3 shadow-[0_0_15px_rgba(79,70,229,0.1)] self-stretch md:self-auto justify-center">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="text-left text-xs">
            <p className="font-bold text-white uppercase tracking-wider">Secured Portal</p>
            <p className="text-slate-500">Google Workspace Sync Active</p>
          </div>
        </div>
      </div>
    </header>
  );
}
