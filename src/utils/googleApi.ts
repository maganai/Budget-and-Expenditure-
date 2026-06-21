/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BudgetEntry, SpreadsheetInfo } from '../types';

// Hardcoded month index order for standard Indian Financial Year (April to March)
export const MONTHS_ORDER = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March"
];

const SHEETS_TAB_NAME = "Submissions";

const HEADER_ROWS = [
  [
    "Submission ID", 
    "Timestamp", 
    "Submitted By", 
    "Block", 
    "Financial Year", 
    "Month", 
    "Major Head", 
    "Scheme Name",
    "Salary (Month)", 
    "OE (Month)", 
    "TE (Month)", 
    "POL (Month)", 
    "Telephone (Month)", 
    "Electricity (Month)", 
    "M&R (Month)", 
    "Total (Month)",
    "Salary (Prev)", 
    "OE (Prev)", 
    "TE (Prev)", 
    "POL (Prev)", 
    "Telephone (Prev)", 
    "Electricity (Prev)", 
    "M&R (Prev)",
    "Salary (Cum)", 
    "OE (Cum)", 
    "TE (Cum)", 
    "POL (Cum)", 
    "Telephone (Cum)", 
    "Electricity (Cum)", 
    "M&R (Cum)"
  ]
];

/**
 * Searches the user's Google Drive for existing spreadsheets
 */
export async function listSpreadsheets(accessToken: string): Promise<SpreadsheetInfo[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list sheets: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
    }));
  } catch (error) {
    console.error("Error in listSpreadsheets:", error);
    throw error;
  }
}

/**
 * Creates a brand new Google Spreadsheet with structured headers and styling
 */
export async function createSpreadsheet(accessToken: string, name: string): Promise<SpreadsheetInfo> {
  try {
    const createBody = {
      properties: {
        title: name,
      },
      sheets: [
        {
          properties: {
            title: SHEETS_TAB_NAME,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    };

    const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Failed to create spreadsheet response:", errText);
      throw new Error(`Failed to create spreadsheet: ${response.statusText}`);
    }

    const spreadsheet = await response.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const url = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Set the sheet headers
    await updateSheetRange(accessToken, spreadsheetId, `${SHEETS_TAB_NAME}!A1`, HEADER_ROWS);

    // Apply header styling through batchUpdate
    await applyHeaderStyling(accessToken, spreadsheetId, spreadsheet.sheets[0].properties.sheetId);

    return {
      id: spreadsheetId,
      name,
      url,
    };
  } catch (error) {
    console.error("Error in createSpreadsheet:", error);
    throw error;
  }
}

/**
 * Appends a new Budget Entry to the Google Sheet
 */
export async function appendBudgetEntry(
  accessToken: string,
  spreadsheetId: string,
  entry: BudgetEntry
): Promise<void> {
  try {
    const rowId = `B_${Date.now()}`;
    const timestamp = new Date().toLocaleString();
    const rowValues = [
      [
        rowId,
        timestamp,
        entry.submittedBy || 'Anonymous',
        entry.block,
        entry.financialYear,
        entry.month,
        entry.majorHead,
        entry.schemeName,
        entry.salary,
        entry.oe,
        entry.te,
        entry.pol,
        entry.telephone,
        entry.electricity,
        entry.mr,
        entry.total,
        entry.salaryPrev,
        entry.oePrev,
        entry.tePrev,
        entry.polPrev,
        entry.telephonePrev,
        entry.electricityPrev,
        entry.mrPrev,
        entry.salaryCum,
        entry.oeCum,
        entry.teCum,
        entry.polCum,
        entry.telephoneCum,
        entry.electricityCum,
        entry.mrCum
      ]
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEETS_TAB_NAME}!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: rowValues,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Append row failed:", errText);
      throw new Error(`Failed to save entry: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error appending budget entry:", error);
    throw error;
  }
}

/**
 * Fetches all budget entry rows from a spreadsheet
 */
export async function fetchBudgetEntries(
  accessToken: string,
  spreadsheetId: string
): Promise<BudgetEntry[]> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEETS_TAB_NAME}!A2:AD1000`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 404) {
      // Tab might not be initialized, try creating it just in case
      return [];
    }

    if (!response.ok) {
      // If table doesn't exist, we might get an error. Standardize it.
      return [];
    }

    const data = await response.json();
    if (!data.values || data.values.length === 0) {
      return [];
    }

    return data.values.map((row: any[]) => {
      // Helper to parse numbers safely
      const num = (val: any) => isNaN(parseFloat(val)) ? 0 : parseFloat(val);

      return {
        id: row[0],
        timestamp: row[1],
        submittedBy: row[2],
        block: row[3] || '',
        financialYear: row[4] || '',
        month: row[5] || '',
        majorHead: row[6] || '',
        schemeName: row[7] || '',
        salary: num(row[8]),
        oe: num(row[9]),
        te: num(row[10]),
        pol: num(row[11]),
        telephone: num(row[12]),
        electricity: num(row[13]),
        mr: num(row[14]),
        total: num(row[15]),
        salaryPrev: num(row[16]),
        oePrev: num(row[17]),
        tePrev: num(row[18]),
        polPrev: num(row[19]),
        telephonePrev: num(row[20]),
        electricityPrev: num(row[21]),
        mrPrev: num(row[22]),
        salaryCum: num(row[23]),
        oeCum: num(row[24]),
        teCum: num(row[25]),
        polCum: num(row[26]),
        telephoneCum: num(row[27]),
        electricityCum: num(row[28]),
        mrCum: num(row[29]),
      };
    });
  } catch (error) {
    console.error("Error fetching budget entries:", error);
    return [];
  }
}

/**
 * Updates a specific range in a spreadsheet
 */
async function updateSheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<void> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update range: ${response.statusText}`);
  }
}

/**
 * Prettifies the header row of our Google Sheet using batchUpdate
 */
async function applyHeaderStyling(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number
): Promise<void> {
  const batchRequests = {
    requests: [
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 30,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.12,
                green: 0.29,
                blue: 0.92, // Nice professional rich blue
              },
              textFormat: {
                bold: true,
                foregroundColor: {
                  red: 1.0,
                  green: 1.0,
                  blue: 1.0, // White text
                },
                fontSize: 10,
              },
              alignment: {
                horizontal: "CENTER",
                vertical: "MIDDLE",
              },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,alignment)",
        },
      },
    ],
  };

  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchRequests),
    });
  } catch (err) {
    console.warn("Failed to apply formatting inside sheet", err);
  }
}
