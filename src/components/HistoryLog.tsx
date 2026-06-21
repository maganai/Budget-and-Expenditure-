/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  MapPin, 
  Layers, 
  Activity, 
  RefreshCw 
} from 'lucide-react';
import { BudgetEntry } from '../types';

interface HistoryLogProps {
  entries: BudgetEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function HistoryLog({ entries, isLoading, onRefresh }: HistoryLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlock, setFilterBlock] = useState('All');

  // Filter logic
  const filteredEntries = entries.filter(e => {
    const matchesSearch = 
      e.schemeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.majorHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.month.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBlock = filterBlock === 'All' || e.block === filterBlock;

    return matchesSearch && matchesBlock;
  });

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative z-10 animate-fade-in">
      
      {/* Header section */}
      <div className="border-b border-white/5 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.01]">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            Recent Google Sheet Submissions
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Real-time spreadsheet rows fetched directly from your active Google Sheets backend.
          </p>
        </div>

        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-black/40 border border-white/15 hover:bg-white/5 text-slate-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync History'}
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-black/30 p-4 border-b border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Scheme or Major Head..."
            className="w-full bg-black/50 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition placeholder-slate-650"
          />
        </div>

        <div>
          <select
            value={filterBlock}
            onChange={(e) => setFilterBlock(e.target.value)}
            className="w-full bg-black/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="All" className="bg-[#0c0e17] text-white">All Blocks</option>
            <option value="Sopore" className="bg-[#0c0e17] text-white">Sopore Block</option>
            <option value="Pattan" className="bg-[#0c0e17] text-white">Pattan Block</option>
            <option value="Tangmarg" className="bg-[#0c0e17] text-white">Tangmarg Block</option>
          </select>
        </div>

        <div className="text-right flex items-center justify-end text-xs font-bold text-indigo-400 px-2 uppercase tracking-wider font-mono">
          {filteredEntries.length} record{filteredEntries.length === 1 ? '' : 's'} found
        </div>
      </div>

      {/* Main logs display */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-xs font-semibold">Fetching Google Sheet logs...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-16 text-center text-slate-400">
          <FileSpreadsheet className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">No submissions match current filters.</p>
          <p className="text-xs mt-1 text-slate-500 font-semibold">Submit your first Budget Statement to populate this log list!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs bg-black/20">
            <thead>
              <tr className="bg-white/[0.01] text-slate-450 font-bold uppercase tracking-wider divide-x divide-white/5 border-b border-white/10">
                <th className="p-4">Submission Details</th>
                <th className="p-4">Location & Term</th>
                <th className="p-4">Classification & Scheme</th>
                <th className="p-4 text-right">Month Expend</th>
                <th className="p-4 text-right bg-indigo-600/10 border-l border-white/5">Cumulative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEntries.map((e, index) => {
                // Calculate cumulative sum across object heads
                const cumSum = e.salaryCum + e.oeCum + e.teCum + e.polCum + e.telephoneCum + e.electricityCum + e.mrCum;

                return (
                  <tr key={e.id || index} className="hover:bg-white/5 transition divide-x divide-white/5">
                    
                    {/* Submission Details */}
                    <td className="p-4">
                      <p className="font-extrabold text-indigo-300 font-mono text-[10px] uppercase truncate max-w-[120px]" title={e.id}>
                        {e.id || 'Not set'}
                      </p>
                      <p className="text-[10px] text-slate-450 mt-0.5 font-semibold font-mono">{e.timestamp}</p>
                      <p className="text-[9px] font-bold text-indigo-450 mt-1 truncate max-w-[150px] font-mono" title={e.submittedBy}>
                        By: {e.submittedBy}
                      </p>
                    </td>

                    {/* Location & Term */}
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-bold text-white">{e.block}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{e.month} ({e.financialYear})</span>
                      </div>
                    </td>

                    {/* Classification & Scheme */}
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-bold text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded text-[10px] border border-indigo-500/15 font-mono">{e.majorHead}</span>
                      </div>
                      <p className="font-bold text-[#e0e4f0] line-clamp-1 truncate max-w-[200px]" title={e.schemeName}>
                        {e.schemeName}
                      </p>
                    </td>

                    {/* Total Expenditure During Month */}
                    <td className="p-4 text-right font-mono">
                      <p className="text-[#f1f3f9] font-black text-sm">
                        ₹ {e.total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">Monthly</span>
                    </td>

                    {/* Cumulative Expenditure */}
                    <td className="p-4 text-right font-mono bg-indigo-650/10 border-l border-white/5">
                      <p className="text-indigo-400 font-black text-sm">
                        ₹ {cumSum.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest block mt-0.5">Year to Date</span>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
