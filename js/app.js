/**
 * Pilot Zaufania — Application Controller
 * Module 1: Booking · Module 2: Diary · Module 3: Event Recorder · Module 4: Smart Contract
 */

// ===================== NAVIGATION =====================

let currentView = 'booking';
let activeRide = null;
let selectedCategory = null;
let tripTimer = null;
let tripSeconds = 0;
let tripEventSim = null;

function showView(view) {
  document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('view-' + view);
  if (target) target.classList.remove('hidden');
  currentView = view;

  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const tab = document.querySelector(`[data-view="${view}"]`);
  if (tab) tab.classList.add('active');

  if (view === 'history') renderHistory();
  if (view === 'diary') renderDiaryView();
}

function openModule(module) {
  showView(module);
}

// ===================== TOAST =====================
function showToast(msg, duration) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), duration || 2500);
}

// ===================== MODULE 1: BOOKING =====================

function bookingNextStep(step) {
  document.getElementById('view-contract').classList.add('hidden');
  document.getElementById('booking-step-location').classList.add('hidden');
  document.getElementById('booking-step-ride-select').classList.remove('hidden');
  document.getElementById('booking-step-driver').classList.add('hidden');
  document.getElementById('booking-step-trip').classList.add('hidden');
  showView('booking');
  renderRideOptions();
}

function bookingPrevStep(step) {
  document.getElementById('view-contract').classList.add('hidden');
  document.getElementById('booking-step-location').classList.remove('hidden');
  document.getElementById('booking-step-ride-select').classList.add('hidden');
  document.getElementById('booking-step-driver').classList.add('hidden');
  document.getElementById('booking-step-trip').classList.add('hidden');
}

function renderRideOptions() {
  const container = document.getElementById('rideOptions');
  container.innerHTML = '';
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const fare = getFareEstimate(key);
    const card = document.createElement('div');
    card.className = 'ride-card';
    card.onclick = () => selectCategory(key, card);
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-3xl">${cat.icon}</span>
          <div>
            <p class="font-bold text-gray-800">${cat.name}</p>
            <p class="text-xs text-gray-500">${cat.desc} · ${cat.seats} miejsc</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-indigo-600">${fare.total} PLN</p>
          <p class="text-xs text-gray-400">~${fare.distance} km</p>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

function selectCategory(key, el) {
  document.querySelectorAll('.ride-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedCategory = key;
  document.getElementById('btnConfirmRide').disabled = false;
}

function confirmRide() {
  if (!selectedCategory) return;
  const pickup = document.getElementById('pickupInput').value;
  const dropoff = document.getElementById('dropoffInput').value;
  activeRide = createRide(pickup, dropoff, selectedCategory);
  saveRide(activeRide);

  document.getElementById('booking-step-ride-select').classList.add('hidden');
  document.getElementById('booking-step-driver').classList.remove('hidden');

  document.getElementById('driverPhoto').textContent = activeRide.driver.photo;
  document.getElementById('driverName').textContent = activeRide.driver.name;
  document.getElementById('driverRating').textContent = activeRide.driver.rating;
  document.getElementById('driverExp').textContent = activeRide.driver.experience;
  document.getElementById('vehInfo').textContent = `${activeRide.vehicle.brand} ${activeRide.vehicle.model} (${activeRide.vehicle.year}), ${activeRide.vehicle.color}`;
  document.getElementById('vehPlate').textContent = activeRide.vehicle.plate;
  document.getElementById('rideCat').textContent = activeRide.fare_estimate.category;
  document.getElementById('rideFare').textContent = activeRide.fare_estimate.total;
  document.getElementById('rideIdDisplay').textContent = activeRide.ride_id;

  showToast('Kierowca został powiadomiony! 🚖');
}

function startTrip() {
  activeRide.status = 'in_progress';
  activeRide.started_at = new Date().toISOString();
  saveRide(activeRide);

  document.getElementById('booking-step-driver').classList.add('hidden');
  document.getElementById('booking-step-trip').classList.remove('hidden');

  // Show status bar
  document.getElementById('tripStatusBar').classList.remove('hidden');
  document.getElementById('tripStatusText').textContent = `Przejazd w toku — rejestrator aktywny (${activeRide.tier})`;

  // Start event recorder
  document.getElementById('liveEvents').innerHTML = '';
  tripEventSim = simulateTripEvents(activeRide.ride_id, activeRide.tier, function(ev) {
    const evEl = document.createElement('p');
    evEl.className = 'py-1';
    const icons = { trip_start: '🟢', route_update: '🔵', stop: '🟡', trip_end: '🔴' };
    const labels = { trip_start: 'Start trasy', route_update: 'Aktualizacja trasy', stop: 'Postój', trip_end: 'Koniec trasy' };
    evEl.textContent = `${icons[ev.type] || '⚪'} ${labels[ev.type] || ev.type}: ${ev.payload.location || ev.payload.reason || `${ev.payload.km} km, ${ev.payload.speed}` || '—'}`;
    document.getElementById('liveEvents').appendChild(evEl);
    // Update progress
    if (ev.payload.km) {
      const pct = Math.min(100, Math.round((ev.payload.km / DEFAULT_DISTANCE_KM) * 100));
      document.getElementById('tripProgressBar').style.width = pct + '%';
      document.getElementById('tripProgressPct').textContent = pct + '%';
    }
  });

  // Trip timer
  tripSeconds = 0;
  tripTimer = setInterval(() => {
    tripSeconds++;
  }, 1000);

  showToast('Rejestrator zdarzeń uruchomiony 📡');
}

function triggerAlertEvent() {
  if (!activeRide) return;
  addRideEvent(activeRide.ride_id, 'manual_alert', { reason: 'Zgłoszenie ręczne pasażera', note: 'Użytkownik zgłosił zdarzenie wymagające uwagi' }, activeRide.tier);
  const evEl = document.createElement('p');
  evEl.className = 'py-1 text-red-500 font-medium';
  evEl.textContent = '🚨 Zdarzenie zgłoszone! Zapisano w rejestrze.';
  document.getElementById('liveEvents').appendChild(evEl);
  showToast('Zdarzenie zostało zapisane w rejestrze 🚨');
}

function endTrip() {
  activeRide.status = 'completed';
  activeRide.completed_at = new Date().toISOString();
  activeRide.fare_final = activeRide.fare_estimate.total;
  saveRide(activeRide);

  // Stop timer
  if (tripTimer) { clearInterval(tripTimer); tripTimer = null; }

  // Hide status bar
  document.getElementById('tripStatusBar').classList.add('hidden');

  // Hide trip view
  document.getElementById('booking-step-trip').classList.add('hidden');
  document.getElementById('booking-step-location').classList.remove('hidden');

  // Generate Smart Contract
  const contract = createContract(activeRide.ride_id, activeRide);
  saveContract(contract);
  activeRide.status = 'pending_approval';
  saveRide(activeRide);

  showToast('Przejazd zakończony! Smart Kontrakt wygenerowany 📜');

  // Show diary prompt
  setTimeout(() => showDiaryPrompt(), 800);
}

// ===================== MODULE 2: DIARY (Zwierciadło) =====================

function showDiaryPrompt() {
  showView('diary');
  document.getElementById('diaryNewEntry').classList.remove('hidden');
  document.getElementById('diaryEmpty').classList.add('hidden');

  const prompts = getRandomPrompts(3);
  const container = document.getElementById('diaryPrompts');
  container.innerHTML = '';
  prompts.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'btn-outline text-left text-sm w-full';
    btn.textContent = `💭 ${p.text}`;
    btn.onclick = () => {
      document.getElementById('diaryContent').value = p.text + '\n\n';
      document.getElementById('diaryContent').focus();
    };
    container.appendChild(btn);
  });

  // Safety tip
  const tipEl = document.createElement('p');
  tipEl.className = 'text-xs text-indigo-500 mt-2 italic';
  tipEl.textContent = '💡 ' + getRandomSafetyTip();
  container.appendChild(tipEl);
}

function saveDiaryEntry() {
  const content = document.getElementById('diaryContent').value.trim();
  if (!content) { showToast('Wpisz treść refleksji'); return; }

  const entry = {
    entry_id: generateUUID(),
    ride_id: activeRide ? activeRide.ride_id : null,
    author_role: 'passenger',
    prompt_id: null,
    content,
    visibility: 'private',
    created_at: new Date().toISOString()
  };
  saveJournalEntry(entry);

  document.getElementById('diaryContent').value = '';
  document.getElementById('diaryNewEntry').classList.add('hidden');
  document.getElementById('diaryEmpty').classList.remove('hidden');
  renderDiaryView();
  showToast('Wpis zapisany w Dzienniczku 🪞');

  // Proceed to Smart Contract
  setTimeout(() => {
    showView('booking');
    showContract();
  }, 600);
}

function skipDiary() {
  document.getElementById('diaryNewEntry').classList.add('hidden');
  document.getElementById('diaryEmpty').classList.remove('hidden');
  showView('booking');
  showContract();
}

function renderDiaryView() {
  const entries = getUserJournal();
  const container = document.getElementById('diaryHistory');
  if (!container) return;

  if (entries.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400 text-center py-4">Brak wpisów. Twój dzienniczek czeka na pierwszą refleksję po przejeździe.</p>';
    return;
  }
  container.innerHTML = entries.map(e => `
    <div class="border-b border-gray-100 py-3">
      <p class="text-sm text-gray-700">${e.content.substring(0, 120)}${e.content.length > 120 ? '...' : ''}</p>
      <p class="text-xs text-gray-400 mt-1">${new Date(e.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
    </div>`).join('');
}

// ===================== MODULE 4: SMART CONTRACT =====================

function showContract() {
  if (!activeRide) return;
  const contract = getContractByRide(activeRide.ride_id);
  if (!contract) { showToast('Nie znaleziono kontraktu'); return; }

  showView('booking');
  // Hide booking steps
  document.getElementById('booking-step-location').classList.add('hidden');
  document.getElementById('booking-step-ride-select').classList.add('hidden');
  document.getElementById('booking-step-driver').classList.add('hidden');
  document.getElementById('booking-step-trip').classList.add('hidden');

  // Show contract
  document.getElementById('view-contract').classList.remove('hidden');

  // Section 1: Summary
  document.getElementById('contractSummary').innerHTML = `
    <p><strong>Trasa:</strong> ${activeRide.pickup} → ${activeRide.dropoff}</p>
    <p><strong>Dystans:</strong> ${contract.cost_breakdown.distance_km} km</p>
    <p><strong>Kategoria:</strong> ${contract.cost_breakdown.category}</p>
    <p><strong>Data:</strong> ${new Date(contract.created_at).toLocaleString('pl-PL')}</p>
    <p><strong>Ride ID:</strong> <code class="text-xs bg-gray-200 px-1 rounded">${activeRide.ride_id}</code></p>`;

  // Section 2: Profiles
  document.getElementById('contractProfiles').innerHTML = `
    <p><strong>Pasażer:</strong> ${contract.passenger_profile_snapshot.name}</p>
    <p><strong>Kierowca:</strong> ${contract.driver_profile_snapshot.name} (lic. ${contract.driver_profile_snapshot.license}, ${contract.driver_profile_snapshot.experience}) ⭐${contract.driver_profile_snapshot.rating}</p>
    <p><strong>Pojazd:</strong> ${contract.vehicle_profile_snapshot.brand} ${contract.vehicle_profile_snapshot.model} (${contract.vehicle_profile_snapshot.year}), ${contract.vehicle_profile_snapshot.color}, ${contract.vehicle_profile_snapshot.plate}</p>`;

  // Section 3: Events
  const events = getEventsByRide(activeRide.ride_id);
  if (events.length === 0) {
    document.getElementById('contractEvents').innerHTML = '<p class="text-gray-400 italic">Brak zarejestrowanych zdarzeń</p>';
  } else {
    document.getElementById('contractEvents').innerHTML = '<div class="timeline-line relative">' +
      events.map(e => {
        const dotClass = { trip_start: 'start', route_update: 'update', stop: 'stop', trip_end: 'end', manual_alert: 'end' }[e.event_type] || 'update';
        const labels = { trip_start: 'Start trasy', route_update: 'Aktualizacja trasy', stop: 'Postój', trip_end: 'Koniec trasy', manual_alert: 'Zgłoszenie ręczne' };
        const desc = e.payload.location || e.payload.reason || (e.payload.km ? `${e.payload.km} km, ${e.payload.speed}` : '—');
        return `<div class="event-row"><div class="event-dot ${dotClass}"></div><div><p class="font-medium text-gray-700">${labels[e.event_type] || e.event_type}</p><p class="text-xs text-gray-500">${desc} · ${new Date(e.timestamp).toLocaleTimeString('pl-PL')}</p><p class="text-xs text-gray-400">hash: ${e.integrity_hash}</p></div></div>`;
      }).join('') + '</div>';
  }

  // Section 4: Costs
  const cb = contract.cost_breakdown;
  document.getElementById('contractCosts').innerHTML = `
    <p>Opłata bazowa (${cb.category}): <strong>${cb.base_fare} PLN</strong></p>
    <p>Dystans (${cb.distance_km} km × ${cb.per_km_rate} PLN/km): <strong>${cb.distance_charge} PLN</strong></p>
    <p>Dopłaty za zdarzenia: <strong>${cb.events_surcharge} PLN</strong></p>`;
  document.getElementById('contractTotal').textContent = cb.total;

  // Section 5: Approval
  renderContractApproval(contract);
}

function renderContractApproval(contract) {
  const statusEl = document.getElementById('contractStatus');
  const actionsEl = document.getElementById('contractActions');

  const statusLabels = {
    draft: 'Wersja robocza',
    pending_approval: 'Oczekuje na zatwierdzenie',
    disputed: 'Spór — w wyjaśnieniu',
    approved: 'Zatwierdzony ✅',
    approved_with_correction: 'Zatwierdzony po korekcie',
    rejected: 'Odrzucony'
  };

  statusEl.innerHTML = `<span class="badge ${contract.status === 'approved' ? 'badge-green' : contract.status === 'disputed' ? 'badge-red' : contract.status === 'rejected' ? 'badge-red' : 'badge-yellow'}">${statusLabels[contract.status] || contract.status}</span>`;

  if (contract.status === 'pending_approval' || contract.status === 'draft') {
    actionsEl.innerHTML = `
      <button onclick="approveContract()" class="btn-primary w-full">✅ Zatwierdź — akceptuję koszty</button>
      <button onclick="disputeContract()" class="btn-outline w-full text-red-500 border-red-200 mt-2">⚠️ Zgłoś spór</button>`;
  } else if (contract.status === 'disputed') {
    actionsEl.innerHTML = `
      <p class="text-sm text-red-600 mb-2">Spór został zgłoszony. Operator został powiadomiony.</p>
      <button onclick="resolveContract()" class="btn-primary w-full">🤝 Rozwiąż spór — akceptuję po wyjaśnieniu</button>`;
  } else {
    actionsEl.innerHTML = `<p class="text-sm text-gray-500">Kontrakt został rozliczony.</p>`;
  }
}

function approveContract() {
  const contract = getContractByRide(activeRide.ride_id);
  if (!contract) return;
  contract.status = 'approved';
  contract.passenger_signoff = { timestamp: new Date().toISOString(), status: 'approved' };
  saveContract(contract);
  activeRide.status = 'approved';
  saveRide(activeRide);

  document.getElementById('view-contract').classList.add('hidden');
  document.getElementById('booking-step-location').classList.remove('hidden');
  showToast('Smart Kontrakt zatwierdzony! Płatność zostanie rozliczona ✅');
  selectedCategory = null;
  activeRide = null;
}

function disputeContract() {
  const contract = getContractByRide(activeRide.ride_id);
  if (!contract) return;
  contract.status = 'disputed';
  contract.passenger_signoff = { timestamp: new Date().toISOString(), status: 'disputed' };
  saveContract(contract);
  activeRide.status = 'disputed';
  saveRide(activeRide);

  renderContractApproval(contract);
  showToast('Spór zgłoszony. Operator rozpocznie wyjaśnianie ⚠️');
}

function resolveContract() {
  const contract = getContractByRide(activeRide.ride_id);
  if (!contract) return;
  contract.status = 'approved_with_correction';
  contract.passenger_signoff = { timestamp: new Date().toISOString(), status: 'approved_after_dispute' };
  saveContract(contract);
  activeRide.status = 'approved';
  saveRide(activeRide);

  document.getElementById('view-contract').classList.add('hidden');
  document.getElementById('booking-step-location').classList.remove('hidden');
  showToast('Spór rozwiązany. Kontrakt zatwierdzony po korekcie 🤝');
  selectedCategory = null;
  activeRide = null;
}

// ===================== HISTORY =====================

function renderHistory() {
  const rides = getRides().filter(r => r.status === 'completed' || r.status === 'approved' || r.status === 'disputed' || r.status === 'pending_approval').reverse();
  const container = document.getElementById('historyList');
  if (!container) return;

  if (rides.length === 0) {
    container.innerHTML = '<p class="text-sm text-gray-400 text-center py-8">Brak zakończonych przejazdów</p>';
    return;
  }

  container.innerHTML = rides.map(r => {
    const statusBadges = {
      completed: '<span class="badge badge-blue">Zakończona</span>',
      pending_approval: '<span class="badge badge-yellow">Do zatwierdzenia</span>',
      approved: '<span class="badge badge-green">Zatwierdzona</span>',
      disputed: '<span class="badge badge-red">Sporna</span>'
    };
    const contract = getContractByRide(r.ride_id);
    return `
    <div class="card p-4 cursor-pointer hover:shadow-md transition" onclick="openHistoryRide('${r.ride_id}')">
      <div class="flex justify-between items-start mb-2">
        <div>
          <p class="font-bold text-gray-800">${r.pickup} → ${r.dropoff}</p>
          <p class="text-xs text-gray-500">${new Date(r.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        ${statusBadges[r.status] || ''}
      </div>
      <div class="flex justify-between text-sm">
        <span>${r.fare_estimate.category}</span>
        <span class="font-bold text-indigo-600">${r.fare_estimate.total} PLN</span>
      </div>
      ${contract ? `<p class="text-xs text-gray-400 mt-1">📜 Smart Kontrakt: ${contract.status === 'approved' ? 'Zatwierdzony' : contract.status === 'disputed' ? 'Sporny' : 'Oczekuje'}</p>` : ''}
    </div>`;
  }).join('');
}

function openHistoryRide(rideId) {
  const ride = getRideById(rideId);
  if (!ride) return;
  activeRide = ride;
  showView('booking');
  showContract();
}

// ===================== INIT =====================

// Live update pickup/dropoff visual
document.getElementById('pickupInput').addEventListener('input', function() {
  document.getElementById('visPickup').textContent = this.value || '—';
});
document.getElementById('dropoffInput').addEventListener('input', function() {
  document.getElementById('visDropoff').textContent = this.value || '—';
});

// Initialize with booking view
showView('booking');
renderHistory();

