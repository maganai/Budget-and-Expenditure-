/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Plus, 
  RefreshCw, 
  Loader2, 
  LogOut, 
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Share2,
  Clipboard,
  Check,
  Users
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SpreadsheetInfo } from '../types';
import { listSpreadsheets, createSpreadsheet } from '../utils/googleApi';

interface SheetConnectorProps {
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  spreadsheet: SpreadsheetInfo | null;
  onSelectSpreadsheet: (sheet: SpreadsheetInfo) => void;
  accessToken: string | null;
  contributorMode?: boolean;
  ownerEmail?: string;
  onExitContributorMode?: () => void;
}

export default function SheetConnector({
  user,
  needsAuth,
  isLoggingIn,
  onLogin,
  onLogout,
  spreadsheet,
  onSelectSpreadsheet,
  accessToken,
  contributorMode = false,
  ownerEmail = '',
  onExitContributorMode
}: SheetConnectorProps) {
  const [sheetsList, setSheetsList] = useState<SpreadsheetInfo[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [customSheetName, setCustomSheetName] = useState('Budget & Expenditure Statement - Sopore');
  const [showSheetsDropdown, setShowSheetsDropdown] = useState(false);
  const [showShareWidget, setShowShareWidget] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load existing spreadsheets when authenticated
  const loadSpreadsheets = async () => {
    if (!accessToken) return;
    setIsLoadingSheets(true);
    try {
      const list = await listSpreadsheets(accessToken);
      setSheetsList(list);
    } catch (err) {
      console.error('Error listing sheets', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadSpreadsheets();
    } else {
      setSheetsList([]);
    }
  }, [accessToken]);

  const handleCreateNewSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !customSheetName.trim()) return;
    
    setIsCreatingSheet(true);
    try {
      const newSheet = await createSpreadsheet(accessToken, customSheetName.trim());
      onSelectSpreadsheet(newSheet);
      setShowSheetsDropdown(false);
      // Refresh list
      loadSpreadsheets();
    } catch (err) {
      alert('Failed to create sheet. Please try again.');
      console.error(err);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Google Sign-in Button following official rules
  if (needsAuth || !user) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl p-8 text-center max-w-2xl mx-auto my-6 backdrop-blur-md relative z-10 text-slate-450">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-indigo-600/10 rounded-full border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Database className="w-10 h-10 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white font-sans tracking-tight">Connect Google Sheets Backend</h2>
        <p className="text-slate-400 mt-2 mb-6 max-w-md mx-auto text-sm leading-relaxed">
          Sign in with your Google Account to automatically sync, store, and compute the budget statements directly in your own Google spreadsheets.
        </p>

        {/* Dynamic Iframe Warning Box */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 max-w-lg mx-auto text-left flex gap-3 text-xs leading-relaxed text-slate-350">
          <span className="text-lg leading-none select-none">⚠️</span>
          <div>
            <strong className="text-amber-400 block mb-0.5 font-bold uppercase tracking-wide">OAuth Sandbox Notice:</strong>
            Standard browsers block secure Google Auth popups inside embedded iframe previews (e.g. within AI Studio's layout). If you notice popups are closed or fail to open, click <strong className="text-white">"Open App in New Tab"</strong> below to login directly!
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <button 
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-850 font-bold py-3.5 px-6 border border-slate-300 rounded-xl shadow-md cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            <span className="font-semibold text-sm">
              {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => window.open(window.location.href, '_blank')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#121420] hover:bg-[#1a1d2e] text-indigo-300 font-bold py-3.5 px-6 border border-white/10 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="font-semibold text-sm">Open App in New Tab</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-md shadow-2xl relative z-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* User Details & Connected status */}
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-12 h-12 rounded-full border-2 border-indigo-500/30 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 font-bold">
              {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{user.displayName || 'Authorized User'}</span>
              {contributorMode ? (
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.1)] font-mono">
                  Contributor Mode
                </span>
              ) : (
                <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-550/20 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Linked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Current Linked Sheet or Selection Options */}
        <div className="flex-1 max-w-xl">
          {spreadsheet ? (
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(79,70,229,0.05)]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-indigo-400 font-bold">
                    {contributorMode ? `${ownerEmail || 'Shared'}'s Linked Sheet` : 'Active Backend Sheet'}
                  </p>
                  <p className="font-bold text-white truncate text-sm lg:text-base">{spreadsheet.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a 
                  href={spreadsheet.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition shadow-[0_0_10px_rgba(79,70,229,0.3)] cursor-pointer"
                >
                  Open Sheet <ExternalLink className="w-3 h-3" />
                </a>

                {contributorMode ? (
                  <button 
                    onClick={onExitContributorMode}
                    className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer"
                  >
                    Exit Share Mode
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setShowShareWidget(!showShareWidget);
                        setShowSheetsDropdown(false);
                      }}
                      className="bg-indigo-550/10 hover:bg-indigo-550/20 border border-indigo-500/20 text-indigo-300 font-bold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share & Invite
                    </button>
                    <button 
                      onClick={() => {
                        setShowSheetsDropdown(!showSheetsDropdown);
                        setShowShareWidget(false);
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer"
                    >
                      Change
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-yellow-400 text-sm">No spreadsheet selected</p>
                  <p className="text-xs text-slate-400">Please link an existing sheet or create a new backend.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSheetsDropdown(true);
                  setShowShareWidget(false);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition shrink-0 cursor-pointer"
              >
                Select or Create Sheet
              </button>
            </div>
          )}
        </div>

        {/* Logout action */}
        <button 
          onClick={onLogout}
          className="text-slate-500 hover:text-rose-400 p-2.5 border border-white/5 rounded-xl hover:border-rose-500/20 hover:bg-rose-500/10 transition flex items-center justify-center gap-2 text-xs font-semibold lg:self-stretch cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 text-rose-450" />
          <span>Sign Out</span>
        </button>

      </div>

      {/* Share / Invite Guest URL Creator */}
      {!contributorMode && showShareWidget && spreadsheet && (
        <div className="mt-6 border-t border-white/10 pt-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Invite Staff / Contributors</h4>
            </div>
            <button 
              onClick={() => setShowShareWidget(false)}
              className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              Close Panel
            </button>
          </div>

          <div className="text-xs text-slate-400 space-y-2 leading-relaxed font-semibold">
            <p>
              To allow other staff members, medical officers, or other users to submit entries directly into your spreadsheet:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-400">
              <li>
                Open your active Google Sheet using the <strong className="text-[#a5b4fc]">"Open Sheet"</strong> link above.
              </li>
              <li>
                Click the <strong className="text-white">"Share"</strong> button in top-right of Sheets page, and set General Access to <strong className="text-amber-400">"Anyone with the link can edit"</strong>. 
                <span className="text-slate-500 block text-[11px] mt-0.5">(Alternatively, share write permissions directly with their specific Google workspace/account emails).</span>
              </li>
              <li>
                Copy the invitation link below and send it to them! They can sign in with their own account to securely append rows directly into your spreadsheet.
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-black/40 border border-white/10 rounded-xl p-2.5 pl-3.5">
            <input 
              type="text" 
              readOnly 
              value={`${window.location.origin}${window.location.pathname}?sheetId=${spreadsheet.id}&sheetName=${encodeURIComponent(spreadsheet.name)}&ownerEmail=${encodeURIComponent(user?.email || '')}`}
              className="flex-1 bg-transparent text-slate-300 text-xs outline-none select-all truncate font-mono block min-w-0"
            />
            <button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?sheetId=${spreadsheet.id}&sheetName=${encodeURIComponent(spreadsheet.name)}&ownerEmail=${encodeURIComponent(user?.email || '')}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg transition shrink-0 inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5" />
                  Copy Invitation Link
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sheets Search, Selection and Creation Form Container */}
      {!contributorMode && showSheetsDropdown && (
        <div className="mt-6 border-t border-white/10 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* List existing Sheets from Drive */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                Link Existing Spreadsheets
              </h3>
              <button 
                onClick={loadSpreadsheets}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition"
                disabled={isLoadingSheets}
                title="Refresh sheets list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingSheets ? (
              <div className="bg-white/[0.01] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-400" />
                <p className="text-xs">Searching your Google Drive...</p>
              </div>
            ) : sheetsList.length === 0 ? (
              <div className="bg-white/[0.01] border border-white/10 rounded-xl p-6 text-center text-slate-500 text-xs">
                No spreadsheets found in your Google Drive.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl divide-y divide-white/5 bg-black/20">
                {sheetsList.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectSpreadsheet(s);
                      setShowSheetsDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="text-indigo-400 shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-300 truncate text-xs">{s.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create custom new Sheet */}
          <div className="bg-white/[0.01] border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 mb-3">
              <Plus className="w-4 h-4 text-indigo-400" />
              Prepare a New Google Sheet
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Create a brand new budget file in your Google Drive. We will automatically style tables and build the headers tab for you.
            </p>

            <form onSubmit={handleCreateNewSheet} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Spreadsheet Name
                </label>
                <input 
                  type="text" 
                  value={customSheetName}
                  onChange={(e) => setCustomSheetName(e.target.value)}
                  placeholder="e.g. Health Budget 2026"
                  required
                  className="w-full text-white bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingSheet || !customSheetName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isCreatingSheet ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating Sheet...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Create Sheet Backend
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
