/** Pilot Zaufania - Smart Check-in (Pre-trip Checklist) */

const CHECKLIST_ITEMS = [
  { id: 'SF-01', category: 'safety', label: 'Zapiete pasy bezpieczenstwa - pasazer i kierowca', requiredBy: 'both', critical: true },
  { id: 'SF-03', category: 'safety', label: 'Trzezwosc kierowcy', requiredBy: 'driver', critical: true },
  { id: 'SF-04', category: 'safety', label: 'Sprawnosc swiatel i hamulcow', requiredBy: 'driver', critical: true },
  { id: 'SF-05', category: 'safety', label: 'Stan opon - brak widocznych uszkodzen', requiredBy: 'driver', critical: true },
  { id: 'SF-06', category: 'safety', label: 'Apteczka pierwszej pomocy na pokladzie', requiredBy: 'driver', critical: false },
  { id: 'SF-07', category: 'safety', label: 'Gasnica na pokladzie (sprawna)', requiredBy: 'driver', critical: false },
  { id: 'CF-01', category: 'comfort', label: 'Temperatura w pojezdzie - uzgodniona', requiredBy: 'both', critical: false },
  { id: 'CF-02', category: 'comfort', label: 'Preferencje muzyczne / cisza - uzgodnione', requiredBy: 'both', critical: false },
  { id: 'CF-04', category: 'comfort', label: 'Trasa przejazdu - potwierdzona', requiredBy: 'both', critical: false },
  { id: 'RD-01', category: 'readiness', label: 'Smartfon - aplikacja Pilot Zaufania uruchomiona', requiredBy: 'both', critical: true },
  { id: 'RD-03', category: 'readiness', label: 'Zgoda na rejestracje - pasazer', requiredBy: 'passenger', critical: true },
  { id: 'RD-04', category: 'readiness', label: 'Zgoda na rejestracje - kierowca', requiredBy: 'driver', critical: true },
  { id: 'RD-05', category: 'readiness', label: 'Szacowana cena przejazdu - zaakceptowana', requiredBy: 'passenger', critical: true },
];

const CAT_LABELS = { safety: 'Bezpieczenstwo', comfort: 'Komfort', readiness: 'Gotowosc' };
const CAT_ORDER = ['safety', 'comfort', 'readiness'];
let checklistState = {};

function initChecklistState() {
  checklistState = {};
  CHECKLIST_ITEMS.forEach(function(i) { checklistState[i.id] = { confirmed: false }; });
}

function renderChecklist() {
  var container = document.getElementById('checklistItems');
  if (!container) return;
  var grouped = {};
  CHECKLIST_ITEMS.forEach(function(item) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });
  var html = '';
  CAT_ORDER.forEach(function(cat) {
    var items = grouped[cat];
    if (!items) return;
    html += '<div class="mb-3"><p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">' + CAT_LABELS[cat] + '</p>';
    items.forEach(function(item) {
      var checked = (checklistState[item.id] && checklistState[item.id].confirmed) || false;
      var who = item.requiredBy === 'both' ? 'Obie strony' : (item.requiredBy === 'driver' ? 'Kierowca' : 'Pasazer');
      html += '<label class="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 ' + (checked ? 'bg-green-50 border border-green-200' : 'border border-gray-100') + ' mb-1">' +
        '<input type="checkbox" class="mt-1 w-5 h-5 rounded accent-indigo-600" ' + (checked ? 'checked' : '') + ' onchange="toggleChecklistItem(\'' + item.id + '\', this.checked)">' +
        '<div class="flex-1 min-w-0"><p class="text-sm font-medium text-gray-800">' + (item.critical ? '<span class="text-red-500 font-bold">*</span> ' : '') + item.label + '</p></div>' +
        '<span class="badge badge-blue text-xs">' + who + '</span></label>';
    });
    html += '</div>';
  });
  container.innerHTML = html;
  updateChecklistBtn();
}

function toggleChecklistItem(id, checked) {
  checklistState[id] = { confirmed: checked };
  updateChecklistBtn();
}

function updateChecklistBtn() {
  var btn = document.getElementById('btnConfirmChecklist');
  var warn = document.getElementById('checklistWarning');
  if (!btn) return;
  var allCriticalOk = CHECKLIST_ITEMS.filter(function(i) { return i.critical; }).every(function(i) { return checklistState[i.id] && checklistState[i.id].confirmed; });
  btn.disabled = !allCriticalOk;
  if (warn) warn.style.display = allCriticalOk ? 'none' : 'block';
}

function confirmChecklist() {
  var allCriticalOk = CHECKLIST_ITEMS.filter(function(i) { return i.critical; }).every(function(i) { return checklistState[i.id] && checklistState[i.id].confirmed; });
  if (!allCriticalOk) { showToast('Potwierdz wszystkie wymagane pozycje (*)', 3000); return; }
  var data = { rideId: (activeRide && activeRide.ride_id) || 'pending', entries: [], allCriticalConfirmed: true, fullyApproved: true, approvedAt: new Date().toISOString() };
  CHECKLIST_ITEMS.forEach(function(item) {
    data.entries.push({ itemId: item.id, passengerConfirmed: !!(checklistState[item.id] && checklistState[item.id].confirmed), driverConfirmed: false, confirmedAt: (checklistState[item.id] && checklistState[item.id].confirmed) ? new Date().toISOString() : null });
  });
  saveData('checklist_' + ((activeRide && activeRide.ride_id) || 'latest'), data);
  document.getElementById('booking-step-checklist').classList.add('hidden');
  originalShowDriver();
  showToast('Smart Check-in zakonczony! Kierowca w drodze', 2500);
}

function originalShowDriver() {
  document.getElementById('booking-step-driver').classList.remove('hidden');
}

/** Monkey-patch confirmRide to insert checklist step */
(function() {
  var _confirmRide = confirmRide;
  confirmRide = function() {
    if (!selectedCategory) return;
    var pickup = document.getElementById('pickupInput').value;
    var dropoff = document.getElementById('dropoffInput').value;
    activeRide = createRide(pickup, dropoff, selectedCategory);
    saveRide(activeRide);
    document.getElementById('driverPhoto').textContent = activeRide.driver.photo;
    document.getElementById('driverName').textContent = activeRide.driver.name;
    document.getElementById('driverRating').textContent = activeRide.driver.rating;
    document.getElementById('driverExp').textContent = activeRide.driver.experience;
    document.getElementById('vehInfo').textContent = activeRide.vehicle.brand + ' ' + activeRide.vehicle.model + ' (' + activeRide.vehicle.year + '), ' + activeRide.vehicle.color;
    document.getElementById('vehPlate').textContent = activeRide.vehicle.plate;
    document.getElementById('rideCat').textContent = activeRide.fare_estimate.category;
    document.getElementById('rideFare').textContent = activeRide.fare_estimate.total;
    document.getElementById('rideIdDisplay').textContent = activeRide.ride_id;
    document.getElementById('booking-step-ride-select').classList.add('hidden');
    document.getElementById('booking-step-checklist').classList.remove('hidden');
    initChecklistState();
    renderChecklist();
    showToast('Smart Check-in - potwierdz gotowosc do podrozy');
  };
})();
