/**
 * Clean Google Apps Script for Proctored Test System
 * Setup: Run initializeSpreadsheet() first, then create trigger manually or run testCompleteSystem()
 */

// ========== CONFIGURATION - UPDATE THESE VALUES ==========
const CONFIG = {
  SPREADSHEET_ID: '1uIophgfnSG65oZVuj2wiQmjiw5vs3wNzUiybAfcaJKU',
  VIOLATIONS_SHEET_NAME: 'Violations',
  RESPONSES_SHEET_NAME: 'Form Responses 1',
  REPORTS_SHEET_NAME: 'Proctoring Reports',
  EMAIL_NOTIFICATIONS: true,
  ADMIN_EMAIL: 'ntimeben@gmail.com',
  FORM_URL: 'https://docs.google.com/forms/d/1_od1_1W-0AypoyPmIYCTbpJmYiT-ShjQdBg8h5xsKjM/viewform'
};
// ========================================================

/**
 * SETUP FUNCTION - Run this first to create spreadsheet structure
 */
function initializeSpreadsheet() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Create Violations sheet
    let violationsSheet = ss.getSheetByName(CONFIG.VIOLATIONS_SHEET_NAME);
    if (!violationsSheet) {
      violationsSheet = ss.insertSheet(CONFIG.VIOLATIONS_SHEET_NAME);
      const headers = [
        'Timestamp', 'Student Name', 'Email', 
        'Violation Type', 'Session ID', 'Browser Info', 'Additional Info'
      ];
      violationsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      violationsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      violationsSheet.getRange(1, 1, 1, headers.length).setBackground('#e8f0fe');
    }
    
    // Create Reports sheet
    let reportsSheet = ss.getSheetByName(CONFIG.REPORTS_SHEET_NAME);
    if (!reportsSheet) {
      reportsSheet = ss.insertSheet(CONFIG.REPORTS_SHEET_NAME);
      const headers = [
        'Student Name', 'Email', 'Exam Start', 'Exam End',
        'Duration (minutes)', 'Total Violations', 'Violation Types', 'Status', 'Form Submitted'
      ];
      reportsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      reportsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      reportsSheet.getRange(1, 1, 1, headers.length).setBackground('#e8f0fe');
    }
    
    Logger.log('✅ Spreadsheet initialized successfully');
    return 'Setup complete! Spreadsheet ID: ' + ss.getId();
    
  } catch (error) {
    Logger.log('❌ Error initializing spreadsheet: ' + error.toString());
    throw error;
  }
}

/**
 * MAIN TRIGGER FUNCTION - Runs automatically when form is submitted
 * Create trigger manually: Triggers > Add Trigger > onFormSubmit > From form
 */
function onFormSubmit(e) {
  try {
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Extract student data from form responses
    const studentData = extractStudentData(itemResponses);
    const timestamp = formResponse.getTimestamp();
    
    // Generate proctoring report
    generateProctoringReport(studentData, timestamp);
    
    // Send completion notification
    if (CONFIG.EMAIL_NOTIFICATIONS && CONFIG.ADMIN_EMAIL !== 'admin@yourdomain.com') {
      sendCompletionNotification(studentData, timestamp);
    }
    
    Logger.log(`Form submitted by: ${studentData.name} (${studentData.email})`);
    
  } catch (error) {
    Logger.log('Error processing form submission: ' + error.toString());
  }
}

/**
 * TEST FUNCTION - Run this to verify the script is working
 */
function testWebApp() {
  Logger.log('=== WEB APP TEST ===');
  Logger.log('doGet function exists: ' + (typeof doGet === 'function'));
  Logger.log('doPost function exists: ' + (typeof doPost === 'function'));
  Logger.log('Current time: ' + new Date().toLocaleString());
  Logger.log('Spreadsheet ID: ' + CONFIG.SPREADSHEET_ID);
  return 'Web app functions are ready';
}

/**
 * WEB APP GET ENDPOINT - Handles GET requests to the web app URL
 */
function doGet(e) {
  try {
    // Return a simple status page when someone visits the web app URL
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Proctoring System API</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .status { color: #28a745; font-weight: bold; }
            .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .code { background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎓 Proctoring System API</h1>
            <p class="status">✅ Web App is running successfully!</p>
            
            <div class="info">
                <h3>API Information:</h3>
                <p><strong>Status:</strong> Active</p>
                <p><strong>Spreadsheet ID:</strong> ${CONFIG.SPREADSHEET_ID}</p>
                <p><strong>Admin Email:</strong> ${CONFIG.ADMIN_EMAIL}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h3>Usage:</h3>
            <p>This web app accepts POST requests for logging proctoring violations.</p>
            <p>Use this URL in your HTML proctoring interface:</p>
            <div class="code">${ScriptApp.getService().getUrl()}</div>
            
            <h3>Integration Steps:</h3>
            <ol>
                <li>Copy the web app URL above</li>
                <li>Update your HTML file's CONFIG.WEBAPP_URL with this URL</li>
                <li>Test the proctoring interface</li>
            </ol>
        </div>
    </body>
    </html>`;
    
    return HtmlService.createHtmlOutput(html);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return HtmlService.createHtmlOutput(`
      <h1>Error</h1>
      <p>There was an error: ${error.toString()}</p>
    `);
  }
}

/**
 * WEB APP POST ENDPOINT - Deploy as web app for HTML frontend violation logging
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'logViolation') {
      const result = logViolation(
        data.studentData, 
        data.violationType, 
        data.sessionId, 
        data.browserInfo,
        data.timestamp
      );
      
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          message: result
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: 'Invalid action'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Log a proctoring violation
 */
function logViolation(studentData, violationType, sessionId, browserInfo, timestamp) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.VIOLATIONS_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Violations sheet not found. Run initializeSpreadsheet() first.');
    }
    
    const logTime = timestamp ? new Date(timestamp) : new Date();
    const rowData = [
      logTime,
      studentData.name || 'Unknown',
      studentData.email || 'Unknown',
      violationType,
      sessionId || 'No session',
      browserInfo || 'Not provided',
      'Logged via web app'
    ];
    
    sheet.appendRow(rowData);
    
    // Send email notification for serious violations
    if (CONFIG.EMAIL_NOTIFICATIONS && isSeriousViolation(violationType)) {
      sendViolationAlert(studentData, violationType, logTime);
    }
    
    Logger.log(`Violation logged: ${violationType} for ${studentData.name}`);
    return 'Violation logged successfully';
    
  } catch (error) {
    Logger.log('Error logging violation: ' + error.toString());
    throw error;
  }
}

/**
 * Generate comprehensive proctoring report for a student
 */
function generateProctoringReport(studentData, submissionTime) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const reportsSheet = ss.getSheetByName(CONFIG.REPORTS_SHEET_NAME);
    
    if (!reportsSheet) {
      Logger.log('Reports sheet not found');
      return;
    }
    
    // Get all violations for this student
    const violations = getStudentViolations(studentData.email);
    
    // Calculate exam statistics
    const examStart = violations.length > 0 ? violations[0].timestamp : submissionTime;
    const examEnd = submissionTime;
    const duration = Math.round((examEnd - examStart) / (1000 * 60)); // minutes
    const totalViolations = violations.length;
    const violationTypes = [...new Set(violations.map(v => v.type))].join(', ');
    const status = determineExamStatus(totalViolations, violations);
    
    const reportData = [
      studentData.name,
      studentData.email,
      examStart,
      examEnd,
      duration,
      totalViolations,
      violationTypes || 'None',
      status,
      'Yes'
    ];
    
    reportsSheet.appendRow(reportData);
    
    // Color code the status
    const lastRow = reportsSheet.getLastRow();
    const statusCell = reportsSheet.getRange(lastRow, 8);
    
    switch(status) {
      case 'Clean':
        statusCell.setBackground('#d9ead3');
        break;
      case 'Minor Issues':
        statusCell.setBackground('#fff2cc');
        break;
      case 'Concerning':
        statusCell.setBackground('#fce5cd');
        break;
      case 'Flagged for Review':
        statusCell.setBackground('#f4cccc');
        break;
    }
    
    Logger.log(`Report generated for ${studentData.name}: ${status} (${totalViolations} violations)`);
    
  } catch (error) {
    Logger.log('Error generating report: ' + error.toString());
  }
}

/**
 * HELPER FUNCTIONS
 */

function extractFormId(url) {
  const match = url.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function extractStudentData(itemResponses) {
  const studentData = {
    name: 'Unknown',
    email: 'Unknown'
  };
  
  itemResponses.forEach(itemResponse => {
    const title = itemResponse.getItem().getTitle().toLowerCase();
    const response = itemResponse.getResponse();
    
    if (title.includes('name') || title.includes('full name')) {
      studentData.name = response;
    } else if (title.includes('email')) {
      studentData.email = response;
    }
  });
  
  return studentData;
}

function getStudentViolations(studentEmail) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.VIOLATIONS_SHEET_NAME);
    
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const violations = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] === studentEmail) {
        violations.push({
          timestamp: new Date(row[0]),
          type: row[3],
          sessionId: row[4]
        });
      }
    }
    
    violations.sort((a, b) => a.timestamp - b.timestamp);
    return violations;
    
  } catch (error) {
    Logger.log('Error getting student violations: ' + error.toString());
    return [];
  }
}

function determineExamStatus(violationCount, violations) {
  const seriousViolations = violations.filter(v => isSeriousViolation(v.type));
  
  if (seriousViolations.length > 0) return 'Flagged for Review';
  if (violationCount === 0) return 'Clean';
  if (violationCount <= 2) return 'Minor Issues';
  if (violationCount <= 5) return 'Concerning';
  return 'Flagged for Review';
}

function isSeriousViolation(violationType) {
  const seriousViolations = [
    'Developer tools detected',
    'Developer tools opened',
    'Exam terminated',
    'Multiple tab switches'
  ];
  return seriousViolations.some(serious => violationType.toLowerCase().includes(serious.toLowerCase()));
}

function getSpreadsheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}`;
}

/**
 * EMAIL NOTIFICATION FUNCTIONS
 */

function sendViolationAlert(studentData, violationType, timestamp) {
  try {
    if (!CONFIG.EMAIL_NOTIFICATIONS || CONFIG.ADMIN_EMAIL === 'admin@yourdomain.com') return;
    
    const subject = `🚨 Serious Proctoring Violation: ${violationType}`;
    const body = `
A serious proctoring violation has been detected:

📋 STUDENT DETAILS:
• Name: ${studentData.name}
• Email: ${studentData.email}

⚠️ VIOLATION:
• Type: ${violationType}
• Time: ${timestamp.toLocaleString()}

🔍 ACTION REQUIRED:
Please review this student's exam session immediately.

View full details: ${getSpreadsheetUrl()}
    `.trim();
    
    MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
    Logger.log(`Violation alert sent for: ${violationType}`);
    
  } catch (error) {
    Logger.log('Error sending violation alert: ' + error.toString());
  }
}

function sendCompletionNotification(studentData, timestamp) {
  try {
    const violations = getStudentViolations(studentData.email);
    const status = determineExamStatus(violations.length, violations);
    
    const subject = `📝 Exam Completed: ${studentData.name} - Status: ${status}`;
    const body = `
Exam completion notification:

📋 STUDENT DETAILS:
• Name: ${studentData.name}
• Email: ${studentData.email}

📊 EXAM SUMMARY:
• Completion Time: ${timestamp.toLocaleString()}
• Total Violations: ${violations.length}
• Status: ${status}

${violations.length > 0 ? 
  `⚠️ VIOLATIONS DETECTED:\n${violations.map(v => `• ${v.type} at ${v.timestamp.toLocaleTimeString()}`).join('\n')}` : 
  '✅ No violations detected - Clean exam session'}

View full report: ${getSpreadsheetUrl()}
    `.trim();
    
    MailApp.sendEmail(CONFIG.ADMIN_EMAIL, subject, body);
    
  } catch (error) {
    Logger.log('Error sending completion notification: ' + error.toString());
  }
}

/**
 * TESTING AND UTILITY FUNCTIONS
 */

function testCompleteSystem() {
  Logger.log('=== COMPLETE SYSTEM TEST ===');
  
  try {
    // Test spreadsheet access
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log('✅ Spreadsheet access: OK - ' + ss.getName());
    
    // Test sheets
    const violationsSheet = ss.getSheetByName(CONFIG.VIOLATIONS_SHEET_NAME);
    const reportsSheet = ss.getSheetByName(CONFIG.REPORTS_SHEET_NAME);
    const responsesSheet = ss.getSheetByName(CONFIG.RESPONSES_SHEET_NAME);
    
    Logger.log(`✅ Violations sheet: ${violationsSheet ? 'EXISTS' : 'MISSING'}`);
    Logger.log(`✅ Reports sheet: ${reportsSheet ? 'EXISTS' : 'MISSING'}`);
    Logger.log(`✅ Responses sheet: ${responsesSheet ? 'EXISTS' : 'MISSING'}`);
    
    // Test form connection
    const formId = extractFormId(CONFIG.FORM_URL);
    const form = FormApp.openById(formId);
    Logger.log('✅ Form access: OK - ' + form.getTitle());
    
    // Test triggers
    const triggers = ScriptApp.getProjectTriggers();
    const formTriggers = triggers.filter(t => t.getHandlerFunction() === 'onFormSubmit');
    Logger.log(`✅ Form triggers: ${formTriggers.length} active`);
    
    // Test violation logging
    const testStudent = { name: 'Test Student', email: 'test@example.com' };
    logViolation(testStudent, 'System test violation', 'test_session_123', 'Test browser', new Date().toISOString());
    Logger.log('✅ Violation logging: OK');
    
    // Test report generation
    generateProctoringReport(testStudent, new Date());
    Logger.log('✅ Report generation: OK');
    
    Logger.log('');
    Logger.log('🎉 SYSTEM TEST COMPLETE - ALL SYSTEMS GO!');
    Logger.log('');
    Logger.log('=== NEXT STEPS ===');
    Logger.log('1. Deploy this script as a web app (Deploy > New deployment > Web app)');
    Logger.log('2. Update HTML file with the web app URL');
    Logger.log('3. Create form trigger manually if not exists');
    Logger.log('4. Test with real form submission');
    Logger.log('');
    Logger.log('=== URLS ===');
    Logger.log('Spreadsheet: ' + ss.getUrl());
    Logger.log('Form: ' + form.getPublishedUrl());
    
  } catch (error) {
    Logger.log('❌ System test failed: ' + error.toString());
  }
}

function cleanupTestData() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Clean violations sheet
    const violationsSheet = ss.getSheetByName(CONFIG.VIOLATIONS_SHEET_NAME);
    if (violationsSheet) {
      const data = violationsSheet.getDataRange().getValues();
      for (let i = data.length; i > 1; i--) {
        if (data[i-1][1] === 'Test Student') {
          violationsSheet.deleteRow(i);
        }
      }
    }
    
    // Clean reports sheet
    const reportsSheet = ss.getSheetByName(CONFIG.REPORTS_SHEET_NAME);
    if (reportsSheet) {
      const data = reportsSheet.getDataRange().getValues();
      for (let i = data.length; i > 1; i--) {
        if (data[i-1][0] === 'Test Student') {
          reportsSheet.deleteRow(i);
        }
      }
    }
    
    Logger.log('✅ Test data cleaned up');
    
  } catch (error) {
    Logger.log('Error cleaning test data: ' + error.toString());
  }
}

function getViolationStatistics() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.VIOLATIONS_SHEET_NAME);
    
    if (!sheet) {
      Logger.log('No violations sheet found');
      return;
    }
    
    const data = sheet.getDataRange().getValues();
    const violations = data.slice(1); // Remove header
    
    // Count violations by type
    const violationCounts = {};
    violations.forEach(row => {
      const type = row[3]; // Violation type column
      violationCounts[type] = (violationCounts[type] || 0) + 1;
    });
    
    Logger.log('=== VIOLATION STATISTICS ===');
    Logger.log(`Total violations: ${violations.length}`);
    Logger.log('Violations by type:');
    Object.entries(violationCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        Logger.log(`  ${type}: ${count}`);
      });
    
    return violationCounts;
    
  } catch (error) {
    Logger.log('Error getting statistics: ' + error.toString());
  }
}