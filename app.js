const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const dayNames = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const shortDayNames = ["Ahd", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const fareByActivity = {
  Antar: 12500,
  Jemput: 12500,
  Null: 0
};

const yearSelect = document.querySelector("#yearSelect");
const monthSelect = document.querySelector("#monthSelect");
const calendarEl = document.querySelector("#calendar");
const selectedDateText = document.querySelector("#selectedDateText");
const officerSelect = document.querySelector("#officerSelect");
const activitySelect = document.querySelector("#activitySelect");
const farePreview = document.querySelector("#farePreview");
const generateBtn = document.querySelector("#generateBtn");
const saveCsvBtn = document.querySelector("#saveCsvBtn");
const rowsEl = document.querySelector("#rows");
const sheetTitle = document.querySelector("#sheetTitle");
const recordCountEl = document.querySelector("#recordCount");
const antarCountEl = document.querySelector("#antarCount");
const jemputCountEl = document.querySelector("#jemputCount");
const grandTotalEl = document.querySelector("#grandTotal");
const totalMode = document.querySelector("#totalMode");
const totalMonth = document.querySelector("#totalMonth");
const totalMonthYear = document.querySelector("#totalMonthYear");
const totalYear = document.querySelector("#totalYear");
const monthTotalFields = document.querySelector("#monthTotalFields");
const periodTotalFields = document.querySelector("#periodTotalFields");
const yearTotalFields = document.querySelector("#yearTotalFields");
const periodStart = document.querySelector("#periodStart");
const periodEnd = document.querySelector("#periodEnd");
const showTotalBtn = document.querySelector("#showTotalBtn");
const totalResult = document.querySelector("#totalResult");
const totalScope = document.querySelector("#totalScope");
const totalValue = document.querySelector("#totalValue");
const totalCount = document.querySelector("#totalCount");
const totalAntar = document.querySelector("#totalAntar");
const totalJemput = document.querySelector("#totalJemput");
const totalNull = document.querySelector("#totalNull");
const printMode = document.querySelector("#printMode");
const printTotalBtn = document.querySelector("#printTotalBtn");
const detailSection = document.querySelector("#detailSection");
const detailNote = document.querySelector("#detailNote");
const printPreview = document.querySelector("#printPreview");

const today = new Date();
let selectedDate = new Date(today);
let entries = [];
let currentTotalRows = [];
const storageKey = "anjem-generator-entries-v1";

function currency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value).replace(/\s/g, "");
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateFromIso(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function longDate(date) {
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function entryFare() {
  return fareByActivity[activitySelect.value] ?? 0;
}

function normalizeEntry(entry, fallbackSource) {
  const date = entry.date instanceof Date ? entry.date : localDateFromIso(entry.date);
  return {
    id: entry.id || `${isoDate(date)}-${entry.activity}-${entry.officer}-${fallbackSource}`,
    date,
    officer: entry.officer || "N/A",
    activity: entry.activity || "Null",
    fare: Number(entry.fare) || 0,
    source: entry.source || fallbackSource
  };
}

function loadEntries() {
  const initial = Array.isArray(window.ANJEM_INITIAL_DATA) ? window.ANJEM_INITIAL_DATA : [];
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    saved = [];
  }
  entries = [...initial.map((entry) => normalizeEntry(entry, "Excel 2024-2026")), ...saved.map((entry) => normalizeEntry(entry, "Input aplikasi"))];
  entries.sort((a, b) => a.date - b.date || a.activity.localeCompare(b.activity));
}

function savedEntries() {
  return entries
    .filter((entry) => entry.source === "Input aplikasi")
    .map((entry) => ({
      id: entry.id,
      date: isoDate(entry.date),
      officer: entry.officer,
      activity: entry.activity,
      fare: entry.fare,
      source: entry.source
    }));
}

function persistEntries() {
  localStorage.setItem(storageKey, JSON.stringify(savedEntries()));
}

function fillSelects() {
  const startYear = today.getFullYear() - 2;
  const endYear = today.getFullYear() + 5;

  for (let year = startYear; year <= endYear; year += 1) {
    [yearSelect, totalMonthYear, totalYear].forEach((select) => {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      select.append(option);
    });
  }

  monthNames.forEach((name, index) => {
    [monthSelect, totalMonth].forEach((select) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = name;
      select.append(option);
    });
  });

  yearSelect.value = String(today.getFullYear());
  totalMonthYear.value = String(today.getFullYear());
  totalYear.value = String(today.getFullYear());
  monthSelect.value = String(today.getMonth());
  totalMonth.value = String(today.getMonth());
  periodStart.value = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
  periodEnd.value = isoDate(today);
}

function renderCalendar() {
  calendarEl.textContent = "";
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);

  if (selectedDate.getFullYear() !== year || selectedDate.getMonth() !== month) {
    selectedDate = new Date(year, month, 1);
  }

  shortDayNames.forEach((day) => {
    const label = document.createElement("div");
    label.className = "calendar-day-label";
    label.textContent = day;
    calendarEl.append(label);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let blank = 0; blank < firstDay; blank += 1) {
    const spacer = document.createElement("span");
    spacer.className = "calendar-empty";
    calendarEl.append(spacer);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-date";
    button.textContent = String(day);
    button.setAttribute("aria-label", longDate(date));
    if (isoDate(date) === isoDate(selectedDate)) button.classList.add("selected");
    button.addEventListener("click", () => {
      selectedDate = date;
      selectedDateText.textContent = `${dayNames[date.getDay()]}, ${longDate(date)}`;
      renderCalendar();
    });
    calendarEl.append(button);
  }

  selectedDateText.textContent = `${dayNames[selectedDate.getDay()]}, ${longDate(selectedDate)}`;
}

function updateFarePreview() {
  farePreview.textContent = currency(entryFare());
}

function generateEntry() {
  const date = new Date(selectedDate);
  const activity = activitySelect.value;
  const officer = officerSelect.value;

  entries.push({
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${entries.length}`,
    date,
    officer,
    activity,
    fare: entryFare(),
    source: "Input aplikasi"
  });

  entries.sort((a, b) => a.date - b.date || a.activity.localeCompare(b.activity));
  persistEntries();
  updateSummary();
  totalResult.classList.add("hidden");
  detailSection.classList.add("hidden");
  printPreview.classList.add("hidden");
  downloadCsv();
}

function renderDetailRows(rows) {
  rowsEl.textContent = "";

  if (rows.length === 0) {
    rowsEl.innerHTML = '<tr class="empty-row"><td colspan="6">Tidak ada rincian untuk filter total ini.</td></tr>';
    return;
  }

  const fragment = document.createDocumentFragment();
  rows.forEach((entry, index) => {
    const tr = document.createElement("tr");
    if (entry.fare === 0) tr.classList.add("is-zero");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${dayNames[entry.date.getDay()]}</td>
      <td>${longDate(entry.date)}</td>
      <td>${escapeHtml(entry.officer)}</td>
      <td>${escapeHtml(entry.activity)}</td>
      <td class="money">${currency(entry.fare)}</td>
    `;
    fragment.append(tr);
  });
  rowsEl.append(fragment);
}

function updateSummary() {
  const total = entries.reduce((sum, entry) => sum + entry.fare, 0);
  recordCountEl.textContent = String(entries.length);
  antarCountEl.textContent = String(entries.filter((entry) => entry.activity === "Antar").length);
  jemputCountEl.textContent = String(entries.filter((entry) => entry.activity === "Jemput").length);
  grandTotalEl.textContent = currency(total);
  sheetTitle.textContent = entries.length ? `${entries.length} data tersimpan` : "Belum ada data";
}

function setTotalMode() {
  const mode = totalMode.value;
  monthTotalFields.classList.toggle("hidden", mode !== "month");
  periodTotalFields.classList.toggle("hidden", mode !== "period");
  yearTotalFields.classList.toggle("hidden", mode !== "year");
  totalResult.classList.add("hidden");
  detailSection.classList.add("hidden");
}

function entriesForTotal() {
  const mode = totalMode.value;

  if (mode === "month") {
    const month = Number(totalMonth.value);
    const year = Number(totalMonthYear.value);
    return {
      rows: entries.filter((entry) => entry.date.getMonth() === month && entry.date.getFullYear() === year),
      scope: `${monthNames[month]} ${year}`
    };
  }

  if (mode === "year") {
    const year = Number(totalYear.value);
    return {
      rows: entries.filter((entry) => entry.date.getFullYear() === year),
      scope: `Tahun ${year}`
    };
  }

  const start = periodStart.value ? localDateFromIso(periodStart.value) : null;
  const end = periodEnd.value ? localDateFromIso(periodEnd.value) : null;
  if (!start || !end) {
    return { rows: [], scope: "Periode belum lengkap" };
  }
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
  return {
    rows: entries.filter((entry) => entry.date >= start && entry.date <= endOfDay),
    scope: `${longDate(start)} sampai ${longDate(end)}`
  };
}

function showTotal() {
  const result = entriesForTotal();
  const total = result.rows.reduce((sum, entry) => sum + entry.fare, 0);
  currentTotalRows = result.rows;
  totalScope.textContent = result.scope;
  totalValue.textContent = currency(total);
  totalCount.textContent = `${result.rows.length} data`;
  totalAntar.textContent = String(result.rows.filter((entry) => entry.activity === "Antar").length);
  totalJemput.textContent = String(result.rows.filter((entry) => entry.activity === "Jemput").length);
  totalNull.textContent = String(result.rows.filter((entry) => entry.activity === "Null").length);
  detailNote.textContent = `Rincian untuk ${result.scope}.`;
  renderDetailRows(result.rows);
  totalResult.classList.remove("hidden");
  printPreview.classList.add("hidden");
  updateDetailVisibility();
}

function updateDetailVisibility() {
  const shouldShowDetail = !totalResult.classList.contains("hidden") && printMode.value === "detail";
  detailSection.classList.toggle("hidden", !shouldShowDetail);
  printPreview.classList.add("hidden");
}

function printTotal() {
  buildPrintPreview();
  document.body.classList.toggle("print-detail", printMode.value === "detail");
  document.body.classList.toggle("print-highlight-only", printMode.value !== "detail");
  if (printMode.value === "detail") {
    renderDetailRows(currentTotalRows);
    detailSection.classList.remove("hidden");
  }
  printPreview.classList.remove("hidden");
  printPreview.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => window.print(), 250);
}

function buildPrintPreview() {
  const includeDetail = printMode.value === "detail";
  const rowsHtml = currentTotalRows.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${dayNames[entry.date.getDay()]}</td>
      <td>${longDate(entry.date)}</td>
      <td>${escapeHtml(entry.officer)}</td>
      <td>${escapeHtml(entry.activity)}</td>
      <td class="money">${currency(entry.fare)}</td>
    </tr>
  `).join("");

  printPreview.innerHTML = `
    <div class="print-document">
      <header class="print-header">
        <div>
          <p class="eyebrow">Laporan Anjem</p>
          <h2>${escapeHtml(totalScope.textContent)}</h2>
        </div>
        <small>Dicetak: ${longDate(new Date())}</small>
      </header>
      <section class="print-highlight">
        <div>
          <small>Total</small>
          <strong>${escapeHtml(totalValue.textContent)}</strong>
          <span>${escapeHtml(totalCount.textContent)}</span>
        </div>
        <div class="highlight-stats">
          <div><span>${escapeHtml(totalAntar.textContent)}</span><small>antar</small></div>
          <div><span>${escapeHtml(totalJemput.textContent)}</span><small>jemput</small></div>
          <div><span>${escapeHtml(totalNull.textContent)}</span><small>null</small></div>
        </div>
      </section>
      ${includeDetail ? `
        <section class="print-table">
          <h3>Rincian Tabel</h3>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Hari</th>
                <th>Tanggal</th>
                <th>Petugas Anjem</th>
                <th>Aktivitas</th>
                <th>Tarif</th>
              </tr>
            </thead>
            <tbody>${rowsHtml || '<tr><td colspan="6">Tidak ada data.</td></tr>'}</tbody>
          </table>
        </section>
      ` : ""}
    </div>
  `;
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function toCsv() {
  const header = ["Tanggal", "Hari", "Petugas Anjem", "Aktivitas", "Tarif", "Sumber"];
  const lines = [header.map(csvEscape).join(",")];
  entries.forEach((entry) => {
    lines.push([
      isoDate(entry.date),
      dayNames[entry.date.getDay()],
      entry.officer,
      entry.activity,
      entry.fare,
      entry.source || ""
    ].map(csvEscape).join(","));
  });
  return lines.join("\r\n");
}

function downloadCsv() {
  const blob = new Blob([toCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "anjem.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

yearSelect.addEventListener("change", renderCalendar);
monthSelect.addEventListener("change", renderCalendar);
officerSelect.addEventListener("change", updateFarePreview);
activitySelect.addEventListener("change", updateFarePreview);
generateBtn.addEventListener("click", generateEntry);
saveCsvBtn.addEventListener("click", downloadCsv);
totalMode.addEventListener("change", setTotalMode);
showTotalBtn.addEventListener("click", showTotal);
printMode.addEventListener("change", updateDetailVisibility);
printTotalBtn.addEventListener("click", printTotal);

fillSelects();
loadEntries();
renderCalendar();
updateFarePreview();
updateSummary();
