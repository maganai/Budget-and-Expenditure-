/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Database, 
  ArrowRight, 
  FileSpreadsheet,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

import Header from './components/Header';
import SheetConnector from './components/SheetConnector';
import BudgetForm from './components/BudgetForm';
import HistoryLog from './components/HistoryLog';

import { initAuth, googleSignIn, logout } from './utils/firebase';
import { fetchBudgetEntries, appendBudgetEntry } from './utils/googleApi';
import { BudgetEntry, SpreadsheetInfo } from './types';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Spreadsheet backend state
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  
  // Contributor/shared mode details
  const [contributorMode, setContributorMode] = useState<boolean>(false);
  const [ownerEmail, setOwnerEmail] = useState<string>('');

  // Historical spreadsheet entries (from Google Sheet backend)
  const [historicalEntries, setHistoricalEntries] = useState<BudgetEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Elite feedback / notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Show Toast / Alert auto-dismiss helper
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Restore session & linked spreadsheet on load
  useEffect(() => {
    // 1. Initial Auth initialization
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );

    // 2. Parse URL parameters for Contributor Mode
    const params = new URLSearchParams(window.location.search);
    const paramSheetId = params.get('sheetId');
    const paramSheetName = params.get('sheetName');
    const paramOwnerEmail = params.get('ownerEmail');

    if (paramSheetId) {
      setContributorMode(true);
      if (paramOwnerEmail) {
        setOwnerEmail(paramOwnerEmail);
      }
      setSpreadsheet({
        id: paramSheetId,
        name: paramSheetName || 'Shared Spreadsheet',
        url: `https://docs.google.com/spreadsheets/d/${paramSheetId}/edit`
      });
    } else {
      // 3. Load linked spreadsheet details from localStorage if they exist
      const savedSheet = localStorage.getItem('bmo_sopore_spreadsheet');
      if (savedSheet) {
        try {
          setSpreadsheet(JSON.parse(savedSheet));
        } catch (err) {
          console.error('Error loading saved sheet from storage', err);
        }
      }
    }

    return () => unsubscribe();
  }, []);

  const handleExitContributorMode = () => {
    setContributorMode(false);
    setOwnerEmail('');
    setSpreadsheet(null);
    // Clear URL parameters without page reload
    window.history.replaceState({}, '', window.location.pathname);
    // Restore home sheet if any exists
    const savedSheet = localStorage.getItem('bmo_sopore_spreadsheet');
    if (savedSheet) {
      try {
        setSpreadsheet(JSON.parse(savedSheet));
      } catch (err) {
        console.error('Error loading saved sheet', err);
      }
    }
    triggerToast('Exited Shared Contributor Mode.');
  };

  // Fetch recent rows whenever the linked spreadsheet or access token becomes available
  useEffect(() => {
    if (accessToken && spreadsheet) {
      syncHistory();
    } else {
      setHistoricalEntries([]);
    }
  }, [accessToken, spreadsheet]);

  const syncHistory = async () => {
    if (!accessToken || !spreadsheet) return;
    setIsLoadingHistory(true);
    try {
      const rows = await fetchBudgetEntries(accessToken, spreadsheet.id);
      // Put most recent submissions at the top
      setHistoricalEntries(rows.reverse());
    } catch (err) {
      console.error('Error fetching history logs', err);
      triggerToast('Could not fetch historical logs from Google Sheets', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Auth logins/logouts
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        triggerToast(`Signed in successfully as ${result.user.displayName || result.user.email}`);
      }
    } catch (err: any) {
      console.error('Login error', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        triggerToast('Sign-in popup was closed. Please click "Open App in New Tab" to authorize safely without sandbox restrictions!', 'error');
      } else {
        triggerToast('Google authentication cancelled or failed. Please check pop-up blockers.', 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setHistoricalEntries([]);
      triggerToast('Signed out of session successfully');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleSelectSpreadsheet = (selectedSheet: SpreadsheetInfo) => {
    setSpreadsheet(selectedSheet);
    localStorage.setItem('bmo_sopore_spreadsheet', JSON.stringify(selectedSheet));
    triggerToast(`Backend linked to Spreadsheet correctly!`);
  };

  const handleSaveBudgetEntry = async (entry: BudgetEntry) => {
    if (!accessToken || !spreadsheet) {
      triggerToast('Google Sheets connection is required to submit budget!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Attach the creator's email address
      entry.submittedBy = user?.email || 'Authorized Account';

      await appendBudgetEntry(accessToken, spreadsheet.id, entry);
      triggerToast(`Budget for ${entry.month} successfully written to Google Sheets!`);
      
      // Auto-trigger history re-synchronization
      await syncHistory();
    } catch (err: any) {
      console.error('Save entry failed', err);
      triggerToast('Could not write record to sheet. Please verify scopes or try again.', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020308] text-slate-400 font-sans relative py-10 px-4 md:px-8 overflow-x-hidden border-4 border-[#121420]">
      {/* Immersive UI Radial Background Element */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e2235,transparent_60%)] pointer-events-none" />
      
      {/* Toast Notification HUD */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-[rgba(10,12,22,0.9)] border border-white/10 text-white rounded-2xl shadow-[0_0_25px_rgba(79,70,229,0.35)] px-5 py-4 max-w-sm animate-bounce text-xs font-semibold leading-relaxed backdrop-blur-xl">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="flex-1 text-slate-200">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white pointer-events-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Main Header Visual Element */}
        <Header />

        {/* Google Sheets Link UI */}
        <SheetConnector 
          user={user}
          needsAuth={needsAuth}
          isLoggingIn={isLoggingIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
          spreadsheet={spreadsheet}
          onSelectSpreadsheet={handleSelectSpreadsheet}
          accessToken={accessToken}
          contributorMode={contributorMode}
          ownerEmail={ownerEmail}
          onExitContributorMode={handleExitContributorMode}
        />

        {/* Dashboard Work Area */}
        {user && spreadsheet ? (
          <div className="grid grid-cols-1 gap-8 animate-fade-in">
            
            {/* The Main Expenditure Statement Input Form */}
            <BudgetForm 
              historicalEntries={historicalEntries}
              onSave={handleSaveBudgetEntry}
              isSaving={isSaving}
              spreadsheetConnected={!!spreadsheet}
            />

            {/* real-time submission database logs */}
            <HistoryLog 
              entries={historicalEntries}
              isLoading={isLoadingHistory}
              onRefresh={syncHistory}
            />

          </div>
        ) : user ? (
          /* Logged In but No Sheet Assigned Landing card with Immersive Style */
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center shadow-2xl max-w-xl mx-auto space-y-5 backdrop-blur-md">
            <div className="inline-flex p-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              <FileSpreadsheet className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Assign a Google Sheet to Begin</h2>
              <p className="text-sm text-slate-450 leading-relaxed">
                Before writing any budget statement formulas, you must select an existing spreadsheet from your Google Drive or let us prepare a clean, styled database sheet for you in one click.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs bg-indigo-650/10 rounded-full px-4 py-1.5 border border-indigo-500/20 shadow-[0_0_10px_rgba(79,70,229,0.1)]">
                <span>Select a sheet from the linker card above</span>
                <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          /* Logged out visual landing card styled to match Immersive design patterns */
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] p-10 max-w-xl mx-auto text-center space-y-6 backdrop-blur-md">
            {contributorMode && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl p-4 text-xs font-semibold leading-relaxed text-left flex gap-3">
                <span className="text-lg leading-none select-none">📨</span>
                <div>
                  <strong className="text-white block mb-0.5">Shared Contribution Invitation:</strong>
                  You are invited to contribute budget reports directly to <span className="text-emerald-400 font-extrabold">{ownerEmail || 'a staff member'}'s</span> active Google Spreadsheet (<span className="text-white font-bold">{spreadsheet?.name}</span>). Sign in below to write data directly!
                </div>
              </div>
            )}

            <div className="inline-flex p-4 bg-indigo-650/10 text-indigo-400 rounded-2xl border border-white/5 shadow-[0_0_20px_rgba(79,70,229,0.4)] animate-pulse">
              <Database className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Administrative Portal</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Welcome to the official Budget and Expenditure logging portal. Log in with an authorized Google account to view the active ledger, calculate progressive sums, and append financial data in your Google Sheets securely.
              </p>
            </div>

            <div className="p-4 bg-indigo-500/5 rounded-xl border border-white/5 text-left space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Built-in Platform Capabilities
              </h4>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4 leading-normal font-medium">
                <li>Automatic spreadsheet creation with customized colors and borders</li>
                <li>Live on-the-fly summation of previous month expenditures</li>
                <li>Dynamic mirroring between active month and cumulative ledgers</li>
                <li>Dual desktop layout table alongside responsive mobile support</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleLogin}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-6 rounded-xl text-sm transition shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2 cursor-pointer"
              >
                Get Started & Link Sheets Account
                <ArrowRight className="w-4 h-4 cursor-pointer" />
              </button>

              <button 
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="inline-flex items-center justify-center gap-2 bg-[#121420] hover:bg-[#1a1d2e] text-indigo-300 font-bold py-3.5 px-6 border border-white/10 rounded-xl text-sm transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Open App in New Tab
              </button>
            </div>
          </div>
        )}

        {/* Simple professional footer credit */}
        <footer className="text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest pt-10 border-t border-white/5">
          HEALTH DEPARTMENT GOV • BLOCK MEDICAL OFFICER SOPORE STATEMENT TOOL • 2026
        </footer>

      </div>
    </div>
  );
}
