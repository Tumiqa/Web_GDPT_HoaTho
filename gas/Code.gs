/* ============================================================
   GĐPT HÒA THỌ — Google Apps Script (Kiến trúc Pull)
   Xử lý toàn bộ nội bộ: normalize data, ghi Google Sheets, gửi email
   Server PHP sẽ kéo (pull) dữ liệu từ Sheets để đồng bộ auth.db
   
   📋 HƯỚNG DẪN CÀI ĐẶT:
   1. Mở Google Form → ⋮ → Script editor
   2. Xóa code mẫu, dán toàn bộ code này
   3. Chạy setupSyncSheet() 1 lần → copy Sheet URL
   4. Chạy setupTrigger() 1 lần → kích hoạt tự động
   5. Cấp quyền khi được yêu cầu
   ============================================================ */

// ===== CẤU HÌNH =====
var CONFIG = {
  WEBSITE_NAME: 'GĐPT Hòa Thọ',
  WEBSITE_URL: 'https://gdpthoatho.id.vn',
  SENDER_NAME: 'GĐPT Hòa Thọ - Hệ Thống Tự Động',
  SYNC_SHEET_NAME: 'AccountSync',
};

// ===== TỪ KHÓA NHẬN DIỆN CÂU HỎI =====
var FIELD_KEYWORDS = {
  FULL_NAME:     ['họ và tên', 'ho va ten', 'họ tên'],
  DOB:           ['ngày sinh', 'ngay sinh'],
  PHONE:         ['số điện thoại', 'so dien thoai', 'điện thoại'],
  ADDRESS:       ['địa chỉ', 'dia chi'],
  DHARMA_NAME:   ['pháp danh', 'phap danh'],
  ACTIVITY_TIME: ['thời gian sinh hoạt', 'thoi gian sinh hoat'],
  GROUP_NAME:    ['sinh hoạt tại đoàn', 'sinh hoat tai doan', 'đoàn'],
  STUDY_LEVEL:   ['bậc tu học', 'bac tu hoc'],
};

// ===== HEADERS CHO SHEET ĐỒNG BỘ =====
var SHEET_HEADERS = [
  'timestamp', 'username', 'full_name', 'display_name', 'dharma_name',
  'dob', 'position', 'study_level', 'group_name', 'address',
  'activity_time', 'email', 'synced'
];


// ============================================================
// TRIGGER HANDLER — Chạy khi có người điền form
// ============================================================

function onFormSubmit(e) {
  try {
    var response = e.response;
    var itemResponses = response.getItemResponses();
    var respondentEmail = response.getRespondentEmail();
    
    // ===== TRÍCH XUẤT DỮ LIỆU =====
    var formData = extractFormData(itemResponses);
    Logger.log('📋 Dữ liệu form: ' + JSON.stringify(formData));
    
    // ===== PARSE NGÀY SINH =====
    var dobParts = parseDateOfBirth(formData.dob);
    if (!dobParts) {
      Logger.log('❌ Không parse được ngày sinh: ' + formData.dob);
      return;
    }
    
    // ===== VALIDATE =====
    var fullNameRaw = (formData.fullName || '').trim();
    var phone = (formData.phone || '').trim();
    if (!fullNameRaw || !phone) {
      Logger.log('❌ Thiếu họ tên hoặc SĐT');
      return;
    }
    
    // ===== NORMALIZE DỮ LIỆU (xử lý nội bộ trong GAS) =====
    var fullName = titleCaseVietnamese(fullNameRaw);
    
    // Pháp danh
    var dharmaNameRaw = (formData.dharmaName || '').trim();
    var dharmaName = '';
    var dharmaLower = dharmaNameRaw.toLowerCase();
    if (dharmaNameRaw && 
        dharmaLower !== 'không có' && dharmaLower !== 'khong co' && 
        dharmaLower !== 'không' && dharmaLower !== 'ko' && dharmaLower !== 'ko có') {
      dharmaName = titleCaseVietnamese(dharmaNameRaw);
    }
    
    // Display name
    var displayName = dharmaName || fullName;
    
    // DOB formatted
    var dobDay = String(dobParts.day).padStart(2, '0');
    var dobMonth = String(dobParts.month).padStart(2, '0');
    var dobYear = String(dobParts.year);
    var dobFormatted = dobDay + '/' + dobMonth + '/' + dobYear;
    
    // Phone cleanup — đảm bảo luôn có số 0 ở đầu
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.length > 0 && phone[0] !== '0') {
      if (phone.indexOf('84') === 0 && phone.length > 9) {
        phone = '0' + phone.substring(2);
      } else {
        phone = '0' + phone;
      }
    }
    
    // Position (Huynh trưởng detection)
    var studyLevel = (formData.studyLevel || '').trim();
    var position = '';
    var htKeywords = ['kiên', 'trì', 'định', 'lực'];
    var studyLower = studyLevel.toLowerCase();
    for (var k = 0; k < htKeywords.length; k++) {
      if (studyLower.indexOf(htKeywords[k]) !== -1) {
        position = 'Huynh trưởng';
        break;
      }
    }
    if (!position && formData.groupName) {
      position = 'Đoàn sinh';
    }
    
    // Title-case study level
    if (studyLevel) {
      studyLevel = titleCaseVietnamese(studyLevel);
    }
    
    // Generate password
    var plainPassword = generatePassword(dharmaName, fullName, dobParts.day, dobParts.month, dobParts.year);
    
    Logger.log('🔑 Username: ' + phone + ' | Password: ' + plainPassword);
    
    // ===== KIỂM TRA TRÙNG TRONG SHEET =====
    var sheet = getOrCreateSyncSheet();
    var existingRow = findAccountInSheet(sheet, phone);
    var isNew = !existingRow;
    
    // ===== GHI VÀO GOOGLE SHEETS =====
    if (isNew) {
      var newRow = [
        new Date().toISOString(),  // timestamp
        "'" + phone,                // username (thêm dấu ' để Google Sheet giữ dạng Text có số 0 đầu)
        fullName,                   // full_name
        displayName,                // display_name
        dharmaName,                 // dharma_name
        "'" + dobFormatted,          // dob (thêm dấu ' để Google Sheet giữ nguyên dạng Text DD/MM/YYYY)
        position,                   // position
        studyLevel,                 // study_level
        formData.groupName || '',   // group_name
        formData.address || '',     // address
        formData.activityTime || '',// activity_time
        respondentEmail || '',      // email
        'false'                     // synced (PHP sẽ đổi thành true)
      ];
      sheet.appendRow(newRow);
      Logger.log('📝 Đã ghi vào Sheet: ' + phone);
    } else {
      Logger.log('ℹ️ Tài khoản đã tồn tại trong Sheet: ' + phone);
    }
    
    // ===== GỬI EMAIL =====
    if (respondentEmail) {
      if (isNew) {
        sendNewAccountEmail(respondentEmail, {
          username: phone,
          password: plainPassword,
          displayName: displayName,
          fullName: fullName,
          dharmaName: dharmaName,
        });
      } else {
        // Tái tạo MK từ dữ liệu cũ trong Sheet
        var existData = existingRow;
        var existDharma = existData.dharmaName || '';
        var existFullName = existData.fullName || '';
        var existDob = existData.dob || '';
        var existPassword = '';
        if (existDob) {
          var parts = existDob.split('/');
          if (parts.length === 3) {
            existPassword = generatePassword(existDharma, existFullName, parseInt(parts[0]), parseInt(parts[1]), parts[2]);
          }
        }
        sendExistingAccountEmail(respondentEmail, {
          username: phone,
          password: existPassword,
          displayName: existData.displayName || '',
          fullName: existData.fullName || '',
          dharmaName: existData.dharmaName || '',
        });
      }
    } else {
      Logger.log('⚠️ Không có email người điền — bỏ qua gửi mail');
    }
    
    Logger.log('✅ Hoàn tất: ' + fullName + ' (' + phone + ') — ' + (isNew ? 'TÀI KHOẢN MỚI' : 'ĐÃ TỒN TẠI'));
    
  } catch (error) {
    Logger.log('❌ LỖI: ' + error.message);
    Logger.log('Stack: ' + error.stack);
  }
}


// ============================================================
// TRÍCH XUẤT DỮ LIỆU TỪ FORM (keyword-based)
// ============================================================

function extractFormData(itemResponses) {
  var data = {
    fullName: '', dob: '', phone: '', address: '',
    dharmaName: '', activityTime: '', groupName: '', studyLevel: '',
  };
  
  for (var i = 0; i < itemResponses.length; i++) {
    var itemResp = itemResponses[i];
    var title = itemResp.getItem().getTitle().toLowerCase().trim();
    var value = itemResp.getResponse();
    var strValue = value ? String(value).trim() : '';
    
    if (matchesAnyKeyword(title, FIELD_KEYWORDS.FULL_NAME)) {
      data.fullName = strValue;
    } else if (matchesAnyKeyword(title, FIELD_KEYWORDS.DOB)) {
      data.dob = value;
    } else if (matchesAnyKeyword(title, FIELD_KEYWORDS.PHONE)) {
      data.phone = strValue;
    } else if (matchesAnyKeyword(title, FIELD_KEYWORDS.ADDRESS)) {
      data.address = strValue;
    } else if (matchesAnyKeyword(title, FIELD_KEYWORDS.DHARMA_NAME)) {
      data.dharmaName = strValue;
    } else if (matchesAnyKeyword(title, FIELD_KEYWORDS.ACTIVITY_TIME)) {
      data.activityTime = strValue;
    } else if (matchesAnyKeyword(title, FIELD_KEYWORDS.GROUP_NAME)) {
      data.groupName = strValue;
    } else if (matchesAnyKeyword(title, FIELD_KEYWORDS.STUDY_LEVEL)) {
      data.studyLevel = strValue;
    }
  }
  return data;
}

function matchesAnyKeyword(title, keywords) {
  for (var i = 0; i < keywords.length; i++) {
    if (title.indexOf(keywords[i]) !== -1) return true;
  }
  return false;
}


// ============================================================
// XỬ LÝ NGÀY SINH
// ============================================================

function parseDateOfBirth(dobRaw) {
  if (!dobRaw) return null;
  
  if (dobRaw instanceof Date) {
    return { day: dobRaw.getDate(), month: dobRaw.getMonth() + 1, year: dobRaw.getFullYear() };
  }
  
  var dateStr = String(dobRaw).trim();
  
  // ISO format: YYYY-MM-DD
  var isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return { day: parseInt(isoMatch[3]), month: parseInt(isoMatch[2]), year: parseInt(isoMatch[1]) };
  }
  
  // Slash format: DD/MM/YYYY hoặc MM/DD/YYYY
  var slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    var first = parseInt(slashMatch[1]);
    var second = parseInt(slashMatch[2]);
    if (first > 12) {
      return { day: first, month: second, year: parseInt(slashMatch[3]) };
    } else if (second > 12) {
      return { day: second, month: first, year: parseInt(slashMatch[3]) };
    } else {
      return { day: first, month: second, year: parseInt(slashMatch[3]) };
    }
  }
  
  // Fallback: 8 chữ số liền DDMMYYYY
  var nums = dateStr.replace(/[^\d]/g, '');
  if (nums.length === 8) {
    return { day: parseInt(nums.substring(0,2)), month: parseInt(nums.substring(2,4)), year: parseInt(nums.substring(4,8)) };
  }
  
  Logger.log('⚠️ Không parse được ngày sinh: "' + dateStr + '"');
  return null;
}


// ============================================================
// XỬ LÝ TIẾNG VIỆT (JavaScript version)
// ============================================================

/**
 * Loại bỏ dấu tiếng Việt
 * "Chúc Vương" → "Chuc Vuong"
 */
function removeVietnameseAccents(str) {
  if (!str) return '';
  return str
    .replace(/[àáạảã]/g, 'a').replace(/[âầấậẩẫ]/g, 'a').replace(/[ăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽ]/g, 'e').replace(/[êềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõ]/g, 'o').replace(/[ôồốộổỗ]/g, 'o').replace(/[ơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũ]/g, 'u').replace(/[ưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[ÀÁẠẢÃ]/g, 'A').replace(/[ÂẦẤẬẨẪ]/g, 'A').replace(/[ĂẰẮẶẲẴ]/g, 'A')
    .replace(/[ÈÉẸẺẼ]/g, 'E').replace(/[ÊỀẾỆỂỄ]/g, 'E')
    .replace(/[ÌÍỊỈĨ]/g, 'I')
    .replace(/[ÒÓỌỎÕ]/g, 'O').replace(/[ÔỒỐỘỔỖ]/g, 'O').replace(/[ƠỜỚỢỞỠ]/g, 'O')
    .replace(/[ÙÚỤỦŨ]/g, 'U').replace(/[ƯỪỨỰỬỮ]/g, 'U')
    .replace(/[ỲÝỴỶỸ]/g, 'Y')
    .replace(/Đ/g, 'D');
}

/**
 * Viết hoa chữ cái đầu mỗi từ
 * "nguyễn văn an" → "Nguyễn Văn An"
 */
function titleCaseVietnamese(str) {
  if (!str) return '';
  return str.toLowerCase().trim().split(/\s+/).map(function(word) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

/**
 * Sinh mật khẩu theo quy tắc GĐPT Hòa Thọ
 * Có pháp danh: @PhápdanhKhôngDấu + DDMM
 * Không pháp danh: @HọTênKhôngDấu + DDMMYYYY
 */
function generatePassword(dharmaName, fullName, dobDay, dobMonth, dobYear) {
  var dd = String(dobDay).padStart(2, '0');
  var mm = String(dobMonth).padStart(2, '0');
  
  if (dharmaName) {
    var nameClean = removeVietnameseAccents(dharmaName).replace(/\s/g, '');
    return '@' + nameClean + dd + mm;
  } else {
    var nameClean = removeVietnameseAccents(fullName).replace(/\s/g, '');
    return '@' + nameClean + dd + mm + String(dobYear);
  }
}


// ============================================================
// GOOGLE SHEETS — Lưu trữ tài khoản để PHP đồng bộ
// ============================================================

/**
 * Tạo hoặc lấy Sheet đồng bộ
 * Sheet này nằm trong cùng Spreadsheet với Form Responses
 */
function getOrCreateSyncSheet() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('SYNC_SHEET_ID');
  
  // Thử mở Sheet đã lưu
  if (sheetId) {
    try {
      var ss = SpreadsheetApp.openById(sheetId);
      var sheet = ss.getSheetByName(CONFIG.SYNC_SHEET_NAME);
      if (sheet) return sheet;
      // Sheet tab bị xóa, tạo lại
      sheet = ss.insertSheet(CONFIG.SYNC_SHEET_NAME);
      sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
      sheet.setFrozenRows(1);
      return sheet;
    } catch (e) {
      Logger.log('⚠️ Không mở được Sheet cũ, tạo mới...');
    }
  }
  
  // Tạo Spreadsheet mới
  var ss = SpreadsheetApp.create('GĐPT Hòa Thọ — Tài Khoản Từ Form');
  var sheet = ss.getActiveSheet();
  sheet.setName(CONFIG.SYNC_SHEET_NAME);
  sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
  sheet.setFrozenRows(1);
  
  // Lưu ID
  props.setProperty('SYNC_SHEET_ID', ss.getId());
  
  Logger.log('📊 Đã tạo Spreadsheet: ' + ss.getUrl());
  Logger.log('📋 Sheet ID: ' + ss.getId());
  
  return sheet;
}

/**
 * Tìm tài khoản theo SĐT (username) trong Sheet
 * @returns {Object|null} Dữ liệu nếu tìm thấy, null nếu không
 */
function findAccountInSheet(sheet, phone) {
  var data = sheet.getDataRange().getDisplayValues();
  // Bỏ qua header (row 0)
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === phone) {
      return {
        fullName: data[i][2],
        displayName: data[i][3],
        dharmaName: data[i][4],
        dob: data[i][5],
        position: data[i][6],
      };
    }
  }
  return null;
}


// ============================================================
// GỬI EMAIL — Tài khoản MỚI
// ============================================================

function sendNewAccountEmail(recipientEmail, data) {
  var subject = '🎉 Chào mừng bạn đến với ' + CONFIG.WEBSITE_NAME + ' — Thông tin tài khoản';
  var greetingName = data.fullName || data.displayName || 'bạn';
  var currentYear = new Date().getFullYear();
  
  var htmlBody = '<!DOCTYPE html>' +
'<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
'<body style="margin:0; padding:0; background-color:#f4f7fa; font-family:\'Segoe UI\',Roboto,Arial,sans-serif;">' +
'<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding:30px 0;"><tr><td align="center">' +
'<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">' +
'<tr><td style="background: linear-gradient(135deg, #1a5276 0%, #2e86c1 50%, #3498db 100%); padding:36px 40px; text-align:center;">' +
'<h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:700;">☸️ ' + CONFIG.WEBSITE_NAME + '</h1>' +
'<p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">Hệ thống quản lý thành viên</p>' +
'</td></tr>' +
'<tr><td style="padding:36px 40px;">' +
'<div style="text-align:center; margin-bottom:28px;">' +
'<div style="font-size:48px; margin-bottom:12px;">🎉</div>' +
'<h2 style="color:#1a5276; margin:0; font-size:22px;">Chào mừng ' + greetingName + '!</h2>' +
'<p style="color:#5d6d7e; margin:8px 0 0; font-size:15px; line-height:1.6;">' +
'Tài khoản của bạn đã được tạo thành công.<br>Dưới đây là thông tin đăng nhập vào website.</p></div>' +
'<div style="background:linear-gradient(135deg, #eaf2f8 0%, #d4e6f1 100%); border-radius:12px; padding:24px 28px; margin-bottom:24px; border-left:4px solid #2e86c1;">' +
'<h3 style="color:#1a5276; margin:0 0 16px; font-size:16px; font-weight:700;">📋 Thông tin đăng nhập</h3>' +
'<table style="width:100%;">' +
'<tr><td style="padding:6px 0; color:#5d6d7e; font-size:14px; width:140px;">Tài khoản (TK):</td>' +
'<td style="padding:6px 0;"><code style="background:#1a5276; color:#fff; padding:4px 12px; border-radius:6px; font-size:15px; font-weight:700;">' + data.username + '</code></td></tr>' +
'<tr><td style="padding:6px 0; color:#5d6d7e; font-size:14px;">Mật khẩu (MK):</td>' +
'<td style="padding:6px 0;"><code style="background:#e74c3c; color:#fff; padding:4px 12px; border-radius:6px; font-size:15px; font-weight:700;">' + data.password + '</code></td></tr>' +
'</table></div>' +
'<div style="text-align:center; margin-bottom:24px;">' +
'<a href="' + CONFIG.WEBSITE_URL + '" style="display:inline-block; background:linear-gradient(135deg, #1a5276, #2e86c1); color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:8px; font-size:16px; font-weight:700;">🔑 Đăng nhập ngay</a></div>' +
'<div style="background:#fef9e7; border-radius:8px; padding:14px 18px; border-left:4px solid #f39c12;">' +
'<p style="margin:0; color:#7d6608; font-size:13px; line-height:1.5;">⚠️ <strong>Lưu ý bảo mật:</strong> Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu. Không chia sẻ thông tin đăng nhập cho người khác.</p></div>' +
'</td></tr>' +
'<tr><td style="background:#f8f9fa; padding:20px 40px; text-align:center; border-top:1px solid #e5e8eb;">' +
'<p style="margin:0; color:#95a5a6; font-size:12px;">Email tự động từ ' + CONFIG.WEBSITE_NAME + '. Nếu bạn không điền form, vui lòng bỏ qua.</p>' +
'<p style="margin:8px 0 0; color:#bdc3c7; font-size:11px;">© ' + currentYear + ' ' + CONFIG.WEBSITE_NAME + '</p>' +
'</td></tr></table></td></tr></table></body></html>';

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.SENDER_NAME,
  });
  Logger.log('📧 Đã gửi email TÀI KHOẢN MỚI tới: ' + recipientEmail);
}


// ============================================================
// GỬI EMAIL — Nhắc lại tài khoản đã có
// ============================================================

function sendExistingAccountEmail(recipientEmail, data) {
  var subject = '🔔 Nhắc lại thông tin đăng nhập — ' + CONFIG.WEBSITE_NAME;
  var greetingName = data.fullName || data.displayName || 'bạn';
  var currentYear = new Date().getFullYear();
  
  var htmlBody = '<!DOCTYPE html>' +
'<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
'<body style="margin:0; padding:0; background-color:#f4f7fa; font-family:\'Segoe UI\',Roboto,Arial,sans-serif;">' +
'<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa; padding:30px 0;"><tr><td align="center">' +
'<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">' +
'<tr><td style="background: linear-gradient(135deg, #1a5276 0%, #2e86c1 50%, #3498db 100%); padding:36px 40px; text-align:center;">' +
'<h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:700;">☸️ ' + CONFIG.WEBSITE_NAME + '</h1>' +
'<p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">Hệ thống quản lý thành viên</p>' +
'</td></tr>' +
'<tr><td style="padding:36px 40px;">' +
'<div style="text-align:center; margin-bottom:28px;">' +
'<div style="font-size:48px; margin-bottom:12px;">🔔</div>' +
'<h2 style="color:#1a5276; margin:0; font-size:22px;">Xin chào ' + greetingName + '!</h2>' +
'<p style="color:#5d6d7e; margin:8px 0 0; font-size:15px; line-height:1.6;">' +
'Hệ thống nhận thấy bạn đã có tài khoản trước đó.<br>Dưới đây là thông tin đăng nhập hiện tại.</p></div>' +
'<div style="background:linear-gradient(135deg, #eaf2f8 0%, #d4e6f1 100%); border-radius:12px; padding:24px 28px; margin-bottom:24px; border-left:4px solid #2e86c1;">' +
'<h3 style="color:#1a5276; margin:0 0 16px; font-size:16px; font-weight:700;">📋 Thông tin đăng nhập</h3>' +
'<table style="width:100%;">' +
'<tr><td style="padding:6px 0; color:#5d6d7e; font-size:14px; width:140px;">Tài khoản (TK):</td>' +
'<td style="padding:6px 0;"><code style="background:#1a5276; color:#fff; padding:4px 12px; border-radius:6px; font-size:15px; font-weight:700;">' + data.username + '</code></td></tr>' +
'<tr><td style="padding:6px 0; color:#5d6d7e; font-size:14px;">Mật khẩu (MK):</td>' +
'<td style="padding:6px 0;"><code style="background:#e74c3c; color:#fff; padding:4px 12px; border-radius:6px; font-size:15px; font-weight:700;">' + data.password + '</code></td></tr>' +
'</table></div>' +
'<div style="text-align:center; margin-bottom:24px;">' +
'<a href="' + CONFIG.WEBSITE_URL + '" style="display:inline-block; background:linear-gradient(135deg, #1a5276, #2e86c1); color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:8px; font-size:16px; font-weight:700;">🔑 Đăng nhập ngay</a></div>' +
'<div style="background:#eaf2f8; border-radius:8px; padding:14px 18px; border-left:4px solid #3498db;">' +
'<p style="margin:0; color:#2c3e50; font-size:13px; line-height:1.5;">💡 <strong>Ghi chú:</strong> Nếu bạn đã đổi mật khẩu, mật khẩu hiện tại có thể khác. Liên hệ Huynh trưởng để được hỗ trợ.</p></div>' +
'</td></tr>' +
'<tr><td style="background:#f8f9fa; padding:20px 40px; text-align:center; border-top:1px solid #e5e8eb;">' +
'<p style="margin:0; color:#95a5a6; font-size:12px;">Email tự động từ ' + CONFIG.WEBSITE_NAME + '. Nếu bạn không điền form, vui lòng bỏ qua.</p>' +
'<p style="margin:8px 0 0; color:#bdc3c7; font-size:11px;">© ' + currentYear + ' ' + CONFIG.WEBSITE_NAME + '</p>' +
'</td></tr></table></td></tr></table></body></html>';

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.SENDER_NAME,
  });
  Logger.log('📧 Đã gửi email NHẮC LẠI tới: ' + recipientEmail);
}


// ============================================================
// WEB APP — PHP sẽ gọi URL này để kéo dữ liệu (doGet)
// ============================================================

/**
 * Web App endpoint — PHP cron gọi để lấy danh sách tài khoản chưa đồng bộ
 * URL: https://script.google.com/macros/s/DEPLOY_ID/exec?action=pending&secret=...
 */
function doGet(e) {
  var params = e.parameter || {};
  var secret = params.secret || '';
  var action = params.action || '';
  
  // Xác thực
  if (secret !== 'GDPT_HoaTho_Sync_2026_s3cR3t') {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Unauthorized'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var sheet = getOrCreateSyncSheet();
  var data = sheet.getDataRange().getDisplayValues();
  
  if (action === 'pending') {
    // Trả về danh sách tài khoản chưa sync
    var pending = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][12]).toLowerCase() !== 'true') {
        var un = String(data[i][1]).replace(/[^0-9]/g, '');
        if (un.length > 0 && un[0] !== '0') {
          if (un.indexOf('84') === 0 && un.length > 9) {
            un = '0' + un.substring(2);
          } else {
            un = '0' + un;
          }
        }
        
        pending.push({
          row: i + 1, // 1-indexed cho Sheet
          timestamp: data[i][0],
          username: un,
          full_name: String(data[i][2]),
          display_name: String(data[i][3]),
          dharma_name: String(data[i][4]),
          dob: String(data[i][5]),
          position: String(data[i][6]),
          study_level: String(data[i][7]),
          group_name: String(data[i][8]),
          address: String(data[i][9]),
          activity_time: String(data[i][10]),
          email: String(data[i][11]),
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: 'OK',
      count: pending.length,
      accounts: pending,
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'mark_synced') {
    // Đánh dấu đã đồng bộ
    var rows = (params.rows || '').split(',');
    var marked = 0;
    for (var j = 0; j < rows.length; j++) {
      var rowNum = parseInt(rows[j]);
      if (rowNum > 1 && rowNum <= data.length) {
        sheet.getRange(rowNum, 13).setValue('true'); // Cột M = synced
        marked++;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: 'OK',
      marked: marked,
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    error: 'Unknown action. Use: pending, mark_synced'
  })).setMimeType(ContentService.MimeType.JSON);
}


// ============================================================
// CÀI ĐẶT — Chạy 1 lần
// ============================================================

/**
 * Bước 1: Tạo Sheet đồng bộ
 * Chạy hàm này TRƯỚC, rồi copy Sheet URL để dùng cho PHP
 */
function setupSyncSheet() {
  var sheet = getOrCreateSyncSheet();
  var ss = sheet.getParent();
  Logger.log('✅ Sheet đồng bộ đã sẵn sàng!');
  Logger.log('📊 URL: ' + ss.getUrl());
  Logger.log('📋 Sheet ID: ' + ss.getId());
  Logger.log('');
  Logger.log('👉 Bước tiếp: Chạy hàm setupTrigger()');
}

/**
 * Bước 2: Cài đặt trigger tự động
 */
function setupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('🗑️ Đã xóa trigger cũ: ' + triggers[i].getUniqueId());
    }
  }
  
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(FormApp.getActiveForm())
    .onFormSubmit()
    .create();
  
  Logger.log('✅ Đã tạo trigger onFormSubmit thành công!');
  Logger.log('📝 Mỗi khi có người điền form → tự động xử lý + ghi Sheet + gửi email');
}


// ============================================================
// TEST & DEBUG
// ============================================================

/**
 * Test xử lý nội bộ (không cần API)
 */
function testLocalProcessing() {
  Logger.log('🧪 Test xử lý nội bộ...');
  
  // Test removeVietnameseAccents
  var test1 = removeVietnameseAccents('Chúc Vương');
  Logger.log('removeVietnameseAccents("Chúc Vương") = "' + test1 + '" — ' + (test1 === 'Chuc Vuong' ? '✅' : '❌'));
  
  var test2 = removeVietnameseAccents('Nguyễn Văn An');
  Logger.log('removeVietnameseAccents("Nguyễn Văn An") = "' + test2 + '" — ' + (test2 === 'Nguyen Van An' ? '✅' : '❌'));
  
  // Test titleCase
  var test3 = titleCaseVietnamese('nguyễn văn an');
  Logger.log('titleCaseVietnamese("nguyễn văn an") = "' + test3 + '" — ' + (test3 === 'Nguyễn Văn An' ? '✅' : '❌'));
  
  // Test generatePassword
  var test4 = generatePassword('Chúc Vương', 'Nguyễn Văn An', 10, 3, 2004);
  Logger.log('generatePassword(có pháp danh) = "' + test4 + '" — ' + (test4 === '@ChucVuong1003' ? '✅' : '❌'));
  
  var test5 = generatePassword('', 'Nguyễn Văn An', 10, 3, 2004);
  Logger.log('generatePassword(không pháp danh) = "' + test5 + '" — ' + (test5 === '@NguyenVanAn10032004' ? '✅' : '❌'));
  
  Logger.log('');
  Logger.log('🧪 Test ghi Sheet...');
  var sheet = getOrCreateSyncSheet();
  Logger.log('📊 Sheet URL: ' + sheet.getParent().getUrl());
  Logger.log('📋 Số dòng hiện tại: ' + sheet.getLastRow());
  
  Logger.log('');
  Logger.log('✅ Tất cả test hoàn tất!');
}

/**
 * Xem cấu trúc form
 */
function inspectFormStructure() {
  var form = FormApp.getActiveForm();
  var items = form.getItems();
  
  Logger.log('📋 FORM: ' + form.getTitle());
  Logger.log('Số câu hỏi: ' + items.length);
  Logger.log('Thu thập email: ' + form.collectsEmail());
  Logger.log('---');
  
  for (var i = 0; i < items.length; i++) {
    Logger.log('[' + i + '] "' + items[i].getTitle() + '" — Type: ' + items[i].getType());
  }
}
