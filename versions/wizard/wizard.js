// RnD 버전 3 — 자격 확인 위저드 로직 (3단계: 기본정보 / 학위+지역 / 연락처)
// 전화번호 인증: PASS 데모 (실제 구현 시 PASS API 콜백으로 교체)

var API_URL = "https://script.google.com/macros/s/AKfycby8VjhtUbWPrgBvBrQzjS3S737EeaTmluDp9dl-n9cxWo9bCAMIp_sGjUQILHZtKzai/exec";

// ── 요소 ──
var intro   = document.getElementById("intro");
var wizard  = document.getElementById("wizard");
var result  = document.getElementById("result");
var form    = document.getElementById("wizard-form");
var msg     = document.getElementById("msg");

var phone      = document.getElementById("phone");
var btnPass    = document.getElementById("btn-pass");
var passMsg    = document.getElementById("pass-msg");
var passVerified = false;

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var PHONE_RE = /^01[016789][0-9]{7,8}$/;

var btnPrev      = document.getElementById("btn-prev");
var btnNext      = document.getElementById("btn-next");
var stepLabel    = document.getElementById("step-label");
var stepCount    = document.getElementById("step-count");
var progressFill = document.getElementById("progress-fill");

var panels = Array.prototype.slice.call(document.querySelectorAll(".step-panel"));
var TOTAL  = panels.length; // 3
var current = 1;

var STEP_LABELS = { 1: "기본 정보", 2: "학위 및 지역", 3: "연락처" };
var NEXT_LABEL   = "다음 →";
var SUBMIT_LABEL = "사전신청 완료 ✓";

// ── 유틸 ──
function val(id) { var el = document.getElementById(id); return el ? el.value : ""; }
function showMsg(text, busy) { msg.textContent = text || ""; msg.classList.toggle("busy", !!busy); }
function clearMsg() { showMsg(""); }

function setPassMsg(text, kind) {
  passMsg.textContent = text || "";
  passMsg.classList.remove("ok", "bad");
  if (kind) passMsg.classList.add(kind);
}

// ── 전화번호 숫자만 허용 ──
phone.addEventListener("input", function () {
  phone.value = phone.value.replace(/[^0-9]/g, "");
});

// ── PASS 인증 (데모 — 실제 구현 시 PASS API 연동 필요) ──
btnPass.addEventListener("click", function () {
  var num = phone.value.trim();
  if (!PHONE_RE.test(num)) {
    setPassMsg("올바른 휴대폰 번호를 입력해 주세요. (예: 01012345678)", "bad");
    return;
  }
  btnPass.disabled = true;
  btnPass.textContent = "인증 중...";
  setPassMsg("PASS 앱으로 인증 요청을 보냈어요. 잠시만 기다려 주세요. (데모 모드)");

  // 데모: 2초 후 자동 완료 — 실제 구현 시 PASS 콜백 수신으로 교체
  setTimeout(function () {
    passVerified = true;
    setPassMsg("✓ 본인인증이 완료되었습니다.", "ok");
    btnPass.textContent = "인증완료 ✓";
    btnPass.classList.add("done");
    phone.disabled = true;
    document.getElementById("phone-field").classList.add("verified");
  }, 2000);
});

// ── 전체 데이터 수집 ──
function getData() {
  var fd = new FormData(form), d = {};
  fd.forEach(function (v, k) { d[k] = v; });
  // disabled 상태의 phone 값 보강
  if (phone && (!d["전화번호"] || !String(d["전화번호"]).trim())) d["전화번호"] = phone.value;
  d["PASS인증여부"] = passVerified ? "TRUE" : "FALSE";
  d["개인정보동의"]   = document.getElementById("agree-privacy").checked ? "TRUE" : "FALSE";
  d["약관동의"]       = document.getElementById("agree-terms").checked ? "TRUE" : "FALSE";
  d["마케팅수신동의"] = document.getElementById("agree-marketing").checked ? "TRUE" : "FALSE";
  return d;
}

// ── 단계별 검증 ──
function validateStep(step) {
  if (step === 1) {
    if (!val("name").trim()) return "이름을 입력해 주세요.";
    var year = Number(val("birth-year"));
    if (!year || year < 1960 || year > 2005) return "출생연도를 올바르게 입력해 주세요. (1960~2005)";
    if (!val("gender")) return "성별을 선택해 주세요.";
    return null;
  }
  if (step === 2) {
    if (!val("edu-level")) return "학위를 선택해 주세요.";
    if (!val("region"))    return "지역을 선택해 주세요.";
    return null;
  }
  if (step === 3) {
    if (!PHONE_RE.test(val("phone")) && !passVerified) return "올바른 휴대폰 번호를 입력해 주세요.";
    if (!passVerified) return "PASS 본인인증을 완료해 주세요.";
    if (!EMAIL_RE.test(val("email").trim())) return "올바른 이메일 주소를 입력해 주세요.";
    if (!document.getElementById("agree-privacy").checked) return "[필수] 개인정보 수집·이용에 동의해 주세요.";
    if (!document.getElementById("agree-terms").checked)   return "[필수] 이용약관에 동의해 주세요.";
    return null;
  }
  return null;
}

// ── 단계 렌더링 ──
function renderStep() {
  panels.forEach(function (p) {
    p.classList.toggle("active", Number(p.getAttribute("data-step")) === current);
  });
  stepLabel.textContent = STEP_LABELS[current] || "";
  stepCount.textContent  = current + "/" + TOTAL;
  progressFill.style.width = (current / TOTAL * 100) + "%";

  btnPrev.hidden = current === 1;
  btnNext.textContent = current === TOTAL ? SUBMIT_LABEL : NEXT_LABEL;

  clearMsg();
  var first = panels[current - 1].querySelector("input:not([type=hidden]), select");
  if (first && !first.closest("[hidden]")) { try { first.focus(); } catch (e) {} }
}

// ── 인트로 → 위저드 시작 ──
function startWizard() {
  intro.hidden  = true;
  wizard.hidden = false;
  result.hidden = true;
  current = 1;
  renderStep();
  window.scrollTo(0, 0);
}
Array.prototype.slice.call(document.querySelectorAll(".js-start")).forEach(function (b) {
  b.addEventListener("click", startWizard);
});
document.getElementById("nav-start").addEventListener("click", startWizard);
document.getElementById("logo-home").addEventListener("click", function (e) {
  e.preventDefault();
  intro.hidden = false; wizard.hidden = true; result.hidden = true;
  window.scrollTo(0, 0);
});

// ── 이전 ──
btnPrev.addEventListener("click", function () {
  if (current > 1) { current--; renderStep(); window.scrollTo(0, 0); }
});

// ── 다음 / 제출 ──
btnNext.addEventListener("click", function () {
  var err = validateStep(current);
  if (err) { showMsg("⚠️ " + err); return; }

  if (current < TOTAL) {
    current++;
    renderStep();
    window.scrollTo(0, 0);
    return;
  }
  submit();
});

// Enter 키 = 다음/제출
form.addEventListener("submit", function (e) { e.preventDefault(); btnNext.click(); });

// ── 제출 ──
function submit() {
  var data = getData();
  showMsg("⏳ 사전신청을 접수하는 중이에요...", true);
  btnNext.disabled = true;

  fetch(API_URL, { method: "POST", body: JSON.stringify(data) })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      btnNext.disabled = false;
      if (res.result === "success") {
        showResult(res.position);
      } else if (res.result === "duplicate") {
        showMsg("⚠️ " + (res.message || "이미 신청하신 번호예요. 안내 메일을 확인해 주세요."));
      } else {
        showMsg("❌ 오류: " + (res.message || "알 수 없는 오류가 발생했어요."));
      }
    })
    .catch(function (err) {
      btnNext.disabled = false;
      showMsg("❌ 전송 실패: " + err.message);
    });
}

// ── 결과 화면 ──
function showResult(position) {
  wizard.hidden = true;
  intro.hidden  = true;
  result.hidden = false;
  if (position) {
    var v = result.querySelector(".qnum .v");
    if (v) v.textContent = "#" + position;
  }
  window.scrollTo(0, 0);
}

// ── 약관 동의: 전체동의 ↔ 개별 항목 동기화 ──
var agreeAll      = document.getElementById("agree-all");
var consentAllBox = document.getElementById("consent-all-box");
var agreeItems    = Array.prototype.slice.call(document.querySelectorAll(".agree-required"))
  .concat([document.getElementById("agree-marketing")]);

function syncConsentAll() {
  var allOn = agreeItems.every(function (c) { return c.checked; });
  agreeAll.checked = allOn;
  consentAllBox.classList.toggle("on", allOn);
}
agreeAll.addEventListener("change", function () {
  agreeItems.forEach(function (c) { c.checked = agreeAll.checked; });
  consentAllBox.classList.toggle("on", agreeAll.checked);
});
agreeItems.forEach(function (c) { c.addEventListener("change", syncConsentAll); });
