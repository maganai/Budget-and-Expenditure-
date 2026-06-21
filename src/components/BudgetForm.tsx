/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Trash2, 
  Calculator, 
  HelpCircle, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  X,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { BudgetEntry, ObjectHeadConfig, ObjectHeadType } from '../types';
import { MONTHS_ORDER } from '../utils/googleApi';

interface BudgetFormProps {
  historicalEntries: BudgetEntry[];
  onSave: (entry: BudgetEntry) => Promise<void>;
  isSaving: boolean;
  spreadsheetConnected: boolean;
}

const HEAD_CONFIGS: ObjectHeadConfig[] = [
  { key: 'salary', label: 'Salary', className: 'bg-blue-600', bgHex: '#2d89ef' },
  { key: 'oe', label: 'OE', className: 'bg-amber-500', bgHex: '#f39c12' },
  { key: 'te', label: 'TE', className: 'bg-purple-500', bgHex: '#9b59b6' },
  { key: 'pol', label: 'POL', className: 'bg-pink-500', bgHex: '#e84393' },
  { key: 'telephone', label: 'Telephone', className: 'bg-sky-500', bgHex: '#3498db' },
  { key: 'electricity', label: 'Electricity', className: 'bg-orange-600', bgHex: '#ff5722' },
  { key: 'mr', label: 'M&R', className: 'bg-teal-500', bgHex: '#00acc1' },
];

export default function BudgetForm({
  historicalEntries,
  onSave,
  isSaving,
  spreadsheetConnected
}: BudgetFormProps) {
  // 1. Basic Information state
  const [block, setBlock] = useState('Sopore');
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [month, setMonth] = useState('April');
  const [majorHead, setMajorHead] = useState('');
  const [schemeName, setSchemeName] = useState('');

  // 2. Current Month Expenditures
  const [expenditures, setExpenditures] = useState<Record<ObjectHeadType, string>>({
    salary: '',
    oe: '',
    te: '',
    pol: '',
    telephone: '',
    electricity: '',
    mr: '',
  });

  // 3. User overridden previous month balances
  const [previousAmounts, setPreviousAmounts] = useState<Record<ObjectHeadType, string>>({
    salary: '',
    oe: '',
    te: '',
    pol: '',
    telephone: '',
    electricity: '',
    mr: '',
  });

  // 4. Track whether previous amounts are auto-populated or user typed
  const [isAutoPopulated, setIsAutoPopulated] = useState(false);

  // 5. Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Parse input helper
  const parseNumVal = (val: string): number => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // Calculate live current totals
  const currentTotal: number = (Object.values(expenditures) as string[]).reduce(
    (sum, val) => sum + parseNumVal(val), 
    0
  );

  // Automatically calculate "Up To Previous Month" from Sheets history
  useEffect(() => {
    if (!historicalEntries || historicalEntries.length === 0) {
      setIsAutoPopulated(false);
      return;
    }

    const currentMonthIndex = MONTHS_ORDER.indexOf(month);
    
    // Find submissions matching same Block, FY, Major Head, Scheme
    const matches = historicalEntries.filter(entry => {
      const matchBlock = entry.block === block;
      const matchFY = entry.financialYear === financialYear;
      const matchHead = entry.majorHead.trim().toLowerCase() === majorHead.trim().toLowerCase();
      const matchScheme = entry.schemeName.trim().toLowerCase() === schemeName.trim().toLowerCase();
      return matchBlock && matchFY && matchHead && matchScheme;
    });

    if (matches.length > 0) {
      // Sum the monthly expenditures for months prior to the selected month
      const initialSums: Record<ObjectHeadType, number> = {
        salary: 0,
        oe: 0,
        te: 0,
        pol: 0,
        telephone: 0,
        electricity: 0,
        mr: 0
      };

      let foundPrevious = false;
      matches.forEach(entry => {
        const entryMonthIndex = MONTHS_ORDER.indexOf(entry.month);
        // Only sum if the entry is before the currently selected month chronologically
        if (entryMonthIndex >= 0 && entryMonthIndex < currentMonthIndex) {
          initialSums.salary += entry.salary;
          initialSums.oe += entry.oe;
          initialSums.te += entry.te;
          initialSums.pol += entry.pol;
          initialSums.telephone += entry.telephone;
          initialSums.electricity += entry.electricity;
          initialSums.mr += entry.mr;
          foundPrevious = true;
        }
      });

      if (foundPrevious) {
        const newPrev: Record<ObjectHeadType, string> = {
          salary: initialSums.salary.toString(),
          oe: initialSums.oe.toString(),
          te: initialSums.te.toString(),
          pol: initialSums.pol.toString(),
          telephone: initialSums.telephone.toString(),
          electricity: initialSums.electricity.toString(),
          mr: initialSums.mr.toString(),
        };
        setPreviousAmounts(newPrev);
        setIsAutoPopulated(true);
        return;
      }
    }

    // No historical submissions prior to current month found, reset unless user has customized
    // We only reset to blank if it was formerly auto-populated, leaving user-typed numbers alone
    if (isAutoPopulated) {
      setPreviousAmounts({
        salary: '',
        oe: '',
        te: '',
        pol: '',
        telephone: '',
        electricity: '',
        mr: '',
      });
      setIsAutoPopulated(false);
    }
  }, [block, financialYear, month, majorHead, schemeName, historicalEntries]);

  // Handle number input changes
  const handleExpenditureChange = (key: ObjectHeadType, value: string) => {
    // Only allow positive numbers or empty string
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setExpenditures(prev => ({ ...prev, [key]: value }));
    }
  };

  const handlePreviousChange = (key: ObjectHeadType, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPreviousAmounts(prev => ({ ...prev, [key]: value }));
      setIsAutoPopulated(false); // Flag as user-customized now
    }
  };

  // Clear Form handler
  const handleClearForm = () => {
    if (window.confirm("Are you sure you want to clear all form fields?")) {
      setExpenditures({
        salary: '',
        oe: '',
        te: '',
        pol: '',
        telephone: '',
        electricity: '',
        mr: '',
      });
      setPreviousAmounts({
        salary: '',
        oe: '',
        te: '',
        pol: '',
        telephone: '',
        electricity: '',
        mr: '',
      });
      setMajorHead('');
      setSchemeName('');
      setIsAutoPopulated(false);
    }
  };

  const handlePreSaveCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetConnected) {
      alert("Please connect a Google Sheets backend before saving.");
      return;
    }
    if (!majorHead.trim()) {
      alert("Please specify the Major Head.");
      return;
    }
    if (!schemeName.trim()) {
      alert("Please specify the Scheme Name.");
      return;
    }
    // Proceed to open custom confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);

    const entryToSave: BudgetEntry = {
      block,
      financialYear,
      month,
      majorHead: majorHead.trim(),
      schemeName: schemeName.trim(),
      
      // Current month expenditures
      salary: parseNumVal(expenditures.salary),
      oe: parseNumVal(expenditures.oe),
      te: parseNumVal(expenditures.te),
      pol: parseNumVal(expenditures.pol),
      telephone: parseNumVal(expenditures.telephone),
      electricity: parseNumVal(expenditures.electricity),
      mr: parseNumVal(expenditures.mr),
      total: currentTotal,

      // Up to previous month cumulative balances
      salaryPrev: parseNumVal(previousAmounts.salary),
      oePrev: parseNumVal(previousAmounts.oe),
      tePrev: parseNumVal(previousAmounts.te),
      polPrev: parseNumVal(previousAmounts.pol),
      telephonePrev: parseNumVal(previousAmounts.telephone),
      electricityPrev: parseNumVal(previousAmounts.electricity),
      mrPrev: parseNumVal(previousAmounts.mr),

      // Total Cumulative (Previous + Current)
      salaryCum: parseNumVal(previousAmounts.salary) + parseNumVal(expenditures.salary),
      oeCum: parseNumVal(previousAmounts.oe) + parseNumVal(expenditures.oe),
      teCum: parseNumVal(previousAmounts.te) + parseNumVal(expenditures.te),
      polCum: parseNumVal(previousAmounts.pol) + parseNumVal(expenditures.pol),
      telephoneCum: parseNumVal(previousAmounts.telephone) + parseNumVal(expenditures.telephone),
      electricityCum: parseNumVal(previousAmounts.electricity) + parseNumVal(expenditures.electricity),
      mrCum: parseNumVal(previousAmounts.mr) + parseNumVal(expenditures.mr),
    };

    try {
      await onSave(entryToSave);
      
      // Only clear current month expenditures to make rolling submission faster
      setExpenditures({
        salary: '',
        oe: '',
        te: '',
        pol: '',
        telephone: '',
        electricity: '',
        mr: '',
      });
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the statement.");
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handlePreSaveCheck} className="space-y-8">
        
        {/* Card 1: Basic Information */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative z-10">
          <div className="bg-white/[0.02] px-6 py-4 flex items-center gap-2 border-b border-white/5 text-white">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold tracking-wider text-base sm:text-lg uppercase">BASIC OFFICE INFORMATION</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Block</label>
                <select 
                  value={block} 
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="Sopore" className="bg-[#0c0e17] text-white">Sopore</option>
                  <option value="Pattan" className="bg-[#0c0e17] text-white">Pattan</option>
                  <option value="Tangmarg" className="bg-[#0c0e17] text-white">Tangmarg</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Financial Year</label>
                <select 
                  value={financialYear} 
                  onChange={(e) => setFinancialYear(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="2025-26" className="bg-[#0c0e17] text-white">2025-26</option>
                  <option value="2026-27" className="bg-[#0c0e17] text-white">2026-27</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Month</label>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition cursor-pointer"
                >
                  {MONTHS_ORDER.map((m) => (
                    <option key={m} value={m} className="bg-[#0c0e17] text-white">{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Major Head</label>
                <input 
                  type="text" 
                  value={majorHead}
                  onChange={(e) => setMajorHead(e.target.value)}
                  placeholder="e.g. 2210 Medical" 
                  required
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Name of Scheme</label>
                <input 
                  type="text" 
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  placeholder="e.g. Health Sub Centres" 
                  required
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:border-indigo-500 outline-none transition"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Card 2: Expenditures During Month */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative z-10">
          <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5 flex items-center justify-between text-white flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold tracking-wider text-base sm:text-lg uppercase">EXPENDITURE DURING MONTH</h2>
            </div>
            <span className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-xs font-bold font-mono">In Rupees (₹)</span>
          </div>

          <div className="p-6">
            <p className="text-xs text-slate-400 mb-6 font-semibold">
              Enter individual expenditure amounts for the month of <strong className="text-white font-extrabold">{month}</strong>. Leave zeroes for untouched object heads.
            </p>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border border-white/10 bg-black/20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.01] text-slate-400 text-xs font-bold tracking-wider divide-x divide-white/5 border-b border-white/10">
                    <th className="p-4 text-left font-bold uppercase tracking-wider">Classification</th>
                    {HEAD_CONFIGS.map((config) => (
                      <th key={config.key} className="p-4 font-bold text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-white text-[10px] uppercase font-black tracking-widest ${config.className}`}>
                          {config.label}
                        </span>
                      </th>
                    ))}
                    <th className="p-4 font-extrabold text-indigo-400 bg-indigo-600/10 text-center uppercase tracking-widest leading-none border-l border-white/15">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="divide-x divide-white/5">
                    <td className="p-4 font-bold text-slate-300 text-xs bg-white/[0.01]">Expenditure (₹)</td>
                    {HEAD_CONFIGS.map((config) => (
                      <td key={config.key} className="p-3">
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={expenditures[config.key]}
                          onChange={(e) => handleExpenditureChange(config.key as ObjectHeadType, e.target.value)}
                          placeholder="0"
                          className="w-full text-center font-bold text-white bg-black/40 border border-white/10 focus:border-indigo-550 px-2 py-3 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 transition text-sm"
                        />
                      </td>
                    ))}
                    <td className="p-3 bg-indigo-600/15 text-center border-l border-white/15">
                      <span className="text-sm font-black text-indigo-400 font-mono">
                        ₹ {currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Grid View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HEAD_CONFIGS.map((config) => (
                <div key={config.key} className="bg-white/[0.01] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.className}`} />
                    <span className="font-bold text-slate-300 text-sm">{config.label}</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expenditures[config.key]}
                    onChange={(e) => handleExpenditureChange(config.key as ObjectHeadType, e.target.value)}
                    placeholder="₹ 0"
                    className="w-32 text-right font-semibold text-white bg-black/40 border border-white/10 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
              ))}
              
              {/* Grand Total Row for Mobile */}
              <div className="sm:col-span-2 bg-indigo-600/15 border border-indigo-500/20 rounded-xl p-5 flex items-center justify-between gap-4 mt-2 shadow-[0_0_15px_rgba(79,70,229,0.15)]">
                <span className="font-extrabold text-indigo-300 text-sm uppercase tracking-wider">Grand Total (Current Month)</span>
                <span className="font-black text-xl text-indigo-400 font-mono">
                  ₹ {currentTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Buttons Area */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
              <button 
                type="button"
                onClick={handleClearForm}
                className="inline-flex items-center gap-1.5 border border-rose-500/20 text-rose-450 hover:bg-rose-500/10 hover:text-rose-400 font-semibold py-3 px-6 rounded-xl text-sm transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Clear Form
              </button>
              
              <button 
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.5)] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Statement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Statement
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
        {/* Card 3: Cumulative Expenditure Statement */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative z-10 animate-fade-in">
          <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5 flex items-center justify-between text-white flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold tracking-wider text-base sm:text-lg uppercase">CUMULATIVE EXPENDITURE STATEMENT</h2>
            </div>
            
            {/* Show whether we auto-filled from Sheet backend */}
            {isAutoPopulated ? (
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <CheckCircle className="w-3.5 h-3.5" /> Sync Auto-Calculated
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                <AlertCircle className="w-3.5 h-3.5" /> Manual Override Allowed
              </span>
            )}
          </div>

          <div className="p-6">
            <p className="text-xs text-slate-400 mb-6 font-semibold">
              Details for the current Financial Year budget progression. The {isAutoPopulated ? 'system has auto-calculated' : 'user can fill'} cumulative totals "Up To Previous Month" below.
            </p>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white/[0.01] text-slate-400 text-xs font-bold tracking-wider divide-x divide-white/5 border-b border-white/10">
                    <th className="p-4 font-bold uppercase tracking-widest">OBJECT HEAD</th>
                    <th className="p-4 text-center font-bold uppercase tracking-widest">UP TO PREVIOUS MONTH (₹)</th>
                    <th className="p-4 text-center font-bold uppercase tracking-widest">CURRENT MONTH (₹)</th>
                    <th className="p-4 text-center bg-indigo-600/10 font-bold uppercase tracking-widest border-l border-white/10">CUMULATIVE EXPENDITURE (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 text-xs">
                  {HEAD_CONFIGS.map((config) => {
                    const currentVal = parseNumVal(expenditures[config.key]);
                    const prevVal = parseNumVal(previousAmounts[config.key]);
                    const cumulativeVal = prevVal + currentVal;

                    return (
                      <tr key={config.key} className="hover:bg-white/5 transition divide-x divide-white/5">
                        <td className="p-4 font-bold flex items-center gap-3">
                          <div className={`w-3.5 h-3.5 rounded-md ${config.className} shrink-0`} />
                          <span className="text-sm">{config.label}</span>
                        </td>
                        <td className="p-3 text-center">
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={previousAmounts[config.key]}
                            onChange={(e) => handlePreviousChange(config.key as ObjectHeadType, e.target.value)}
                            placeholder="0"
                            className="bg-black/40 hover:bg-black/60 border border-white/10 text-white text-center py-2 px-3 rounded-lg text-xs outline-none max-w-[150px] font-semibold focus:border-indigo-500 transition"
                          />
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-slate-500 bg-white/[0.01]">
                          {currentVal.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-center font-mono font-black text-indigo-400 bg-indigo-650/10 border-l border-white/10">
                          {cumulativeVal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-4 mt-6 flex items-start gap-2.5 shadow-inner">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                <strong className="text-slate-300">How "Up To Previous Month" works:</strong> When you specify a Block, Year, Scheme Name, and Major Head, this application automatically looks up previous submissions from this Google Sheet tab, sums them up, and fills in the Previous Month values! You can also type into the fields manually.
              </p>
            </div>
          </div>
        </div>

      </form>

      {/* Save Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-55 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[rgba(10,12,22,0.95)] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.4)] max-w-md w-full overflow-hidden transform duration-300 backdrop-blur-xl relative">
            <div className="bg-white/[0.02] px-6 py-4 flex justify-between items-center border-b border-white/10 text-white">
              <h3 className="font-bold flex items-center gap-2 text-base uppercase tracking-wider text-white">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" /> Confirm Save
              </h3>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-400 text-sm leading-relaxed font-semibold">
                You are about to save the budget expenditure statement to the linked Google Sheet with the following data:
              </p>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs space-y-2 text-slate-300 font-mono">
                <div className="grid grid-cols-2 border-b border-white/5 pb-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Block:</span>
                  <span className="font-bold text-white text-right">{block}</span>
                </div>
                <div className="grid grid-cols-2 border-b border-white/5 pb-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Financial Year:</span>
                  <span className="font-bold text-white text-right">{financialYear}</span>
                </div>
                <div className="grid grid-cols-2 border-b border-white/5 pb-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Month:</span>
                  <span className="font-bold text-white text-right">{month}</span>
                </div>
                <div className="grid grid-cols-2 border-b border-white/5 pb-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Major Head:</span>
                  <span className="font-bold text-white text-right truncate" title={majorHead}>{majorHead}</span>
                </div>
                <div className="grid grid-cols-2 pt-0.5">
                  <span className="font-extrabold text-indigo-400 uppercase tracking-widest text-[10px]">Total Monthly Sum:</span>
                  <span className="font-extrabold text-indigo-300 text-right">₹ {currentTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 border border-white/10 text-slate-300 hover:bg-white/5 font-semibold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-[0_0_15px_rgba(79,70,229,0.3)] transition cursor-pointer"
                >
                  Confirm & Write Row
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
