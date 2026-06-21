/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BudgetEntry {
  id?: string;
  timestamp?: string;
  submittedBy?: string;
  block: string;
  financialYear: string;
  month: string;
  majorHead: string;
  schemeName: string;
  
  // Expenditure during month
  salary: number;
  oe: number;
  te: number;
  pol: number;
  telephone: number;
  electricity: number;
  mr: number;
  total: number;
  
  // Previous cumulative expend details (up to previous month)
  salaryPrev: number;
  oePrev: number;
  tePrev: number;
  polPrev: number;
  telephonePrev: number;
  electricityPrev: number;
  mrPrev: number;

  // Total cumulative expend details (calculated in app or sheet)
  salaryCum: number;
  oeCum: number;
  teCum: number;
  polCum: number;
  telephoneCum: number;
  electricityCum: number;
  mrCum: number;
}

export type ObjectHeadType = 'salary' | 'oe' | 'te' | 'pol' | 'telephone' | 'electricity' | 'mr';

export interface ObjectHeadConfig {
  key: ObjectHeadType;
  label: string;
  className: string;
  bgHex: string;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}
