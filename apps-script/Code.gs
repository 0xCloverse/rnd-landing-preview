/**
 * RnD 사전가입 신청 - Google Apps Script 중계기
 * --------------------------------------------------
 * 역할: 랜딩페이지(신청서)가 보낸 정보를 이 스프레드시트에 한 줄씩 자동 저장한다.
 * 이 파일은 "구글 스프레드시트 > 확장 프로그램 > Apps Script" 안에 붙여넣어 사용합니다.
 */

// ===== 설정값 (필요하면 여기만 바꾸면 됩니다) =====
var SHEET_NAME = '신청목록';            // 데이터가 쌓일 시트(탭) 이름
var BLOCK_DUPLICATE_EMAIL = true;       // 같은 이메일 중복 신청 막기 (true=막음, false=허용)

// 시트 컬럼 순서 (이 순서대로 한 줄씩 저장됩니다)
var COLUMNS = [
  '제출시각', '이름', '출생연도', '성별', '학위', '지역',
  '전화번호', 'PASS인증여부', '이메일',
  '개인정보동의', '약관동의', '마케팅수신동의'
];

/**
 * 신청서가 정보를 보낼 때(POST) 실행되는 함수.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // 여러 명이 동시에 제출해도 줄이 꼬이지 않게 잠금
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    // 전화번호 중복 체크 (PASS 인증 기반이므로 전화번호를 기준으로)
    if (BLOCK_DUPLICATE_EMAIL && data['전화번호']) {
      if (isDuplicateEmail_(sheet, data['전화번호'])) {
        return json_({ result: 'duplicate', message: '이미 신청하신 전화번호입니다.' });
      }
    }

    // 컬럼 순서대로 한 줄 구성
    var row = COLUMNS.map(function (col) {
      if (col === '제출시각') return new Date();
      if (col === '이메일인증여부') return data['이메일인증여부'] || 'FALSE';
      return data[col] !== undefined ? data[col] : '';
    });
    sheet.appendRow(row);

    return json_({ result: 'success' });
  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 브라우저에서 중계기 주소를 그냥 열었을 때 보여줄 안내(점검용).
 */
function doGet(e) {
  return json_({ result: 'ok', message: 'RnD 신청 접수기가 정상 작동 중입니다.' });
}

// ===== 도우미 함수들 =====

// 시트 가져오기 (없으면 새로 만들고, 첫 줄 제목도 자동 생성)
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);     // 제목 줄 자동 생성
    sheet.setFrozenRows(1);       // 제목 줄 고정
  } else {
    // 컬럼이 추가·변경된 경우 제목 줄(첫 행)을 자동으로 맞춰줌
    var headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
    var current = headerRange.getValues()[0];
    var needsUpdate = COLUMNS.some(function (c, i) { return current[i] !== c; });
    if (needsUpdate) {
      headerRange.setValues([COLUMNS]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// 중복 체크 (전화번호 기준)
function isDuplicateEmail_(sheet, value) {
  var colIndex = COLUMNS.indexOf('전화번호'); // 0부터 시작
  if (colIndex < 0 || sheet.getLastRow() < 2) return false;
  var values = sheet.getRange(2, colIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  var target = String(value).trim();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === target) return true;
  }
  return false;
}

// 응답을 JSON 형태로 돌려주기
function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * [테스트용] Apps Script 편집기에서 이 함수를 직접 '실행'하면
 * 샘플 한 줄이 시트에 들어갑니다. (연결이 잘 되는지 확인용)
 */
function testInsert() {
  var sample = {
    '이름': '홍길동',
    '출생연도': '1995',
    '성별': '남성',
    '학위': '석사재학',
    '지역': '서울',
    '전화번호': '01012345678',
    'PASS인증여부': 'TRUE',
    '이메일': 'test@example.com'
  };
  doPost({ postData: { contents: JSON.stringify(sample) } });
  Logger.log('테스트 한 줄 삽입 완료! 스프레드시트의 "신청목록" 탭을 확인하세요.');
}
