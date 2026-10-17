// F10 resident booking flow
(function () {
  var C = window.F10_BOOKING;
  var LIVE = !!(C.supabaseUrl && C.supabaseAnonKey);
  var TZ = 'Australia/Melbourne';
  var $ = function (s) { return document.querySelector(s); };
  var state = { weekId: '', weekLabel: '', slots: [], slot: null, second: null, product: null, details: {} };

  // ---------- data layer ----------
  function rest(path, opts) {
    opts = opts || {};
    return fetch(C.supabaseUrl + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: {
        apikey: C.supabaseAnonKey,
        Authorization: 'Bearer ' + C.supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.message || 'Request failed');
        return j;
      });
    });
  }

  var demo = (function () {
    // Next Monday, then the Monday after
    var d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    var w1 = new Date(d), w2 = new Date(d); w2.setDate(w2.getDate() + 7);
    var weeks = [
      { id: 'demo-a', slug: 'parkview', name: 'Parkview Apartments', address: '12 Sample St, Brunswick', week_start: w1 },
      { id: 'demo-b', slug: 'riverside', name: 'Riverside Residences', address: '88 Example Rd, Richmond', week_start: w2 },
    ];
    var taken = { 'demo-a': [1, 2, 6, 9, 13], 'demo-b': [0, 5, 10] };
    var blocked = { 'demo-a': [11, 19], 'demo-b': [3, 18, 19] };
    function slots(weekId) {
      var w = weeks.find(function (x) { return x.id === weekId; });
      var out = [], i = 0;
      for (var day = 0; day < 5; day++) {
        [8, 10, 13, 15].forEach(function (h) {
          var s = new Date(w.week_start); s.setDate(s.getDate() + day); s.setHours(h);
          var e = new Date(s); e.setHours(h + 2);
          var st = taken[weekId].indexOf(i) > -1 ? 'taken' : blocked[weekId].indexOf(i) > -1 ? 'blocked' : 'available';
          out.push({ id: weekId + '-' + i, starts_at: s.toISOString(), ends_at: e.toISOString(), status: st });
          i++;
        });
      }
      return out;
    }
    return { weeks: weeks, slots: slots };
  })();

  function loadWeeks() {
    if (!LIVE) return Promise.resolve(demo.weeks.map(function (w) {
      var d = w.week_start, pad = function (n) { return String(n).padStart(2, '0'); };
      return { id: w.id, slug: w.slug, name: w.name, address: w.address, week_start: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) };
    }));
    var today = new Date().toISOString().slice(0, 10);
    return rest('service_weeks?select=id,week_start,label,buildings!inner(slug,name,address,active)&active=eq.true&week_start=gte.' +
      new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10) + '&order=week_start').then(function (rows) {
      return rows.filter(function (r) { return r.buildings.active; }).map(function (r) {
        return { id: r.id, slug: r.buildings.slug, name: r.buildings.name, address: r.buildings.address, week_start: r.week_start };
      });
    });
  }
  function loadSlots(weekId) {
    if (!LIVE) return Promise.resolve(demo.slots(weekId));
    return rest('rpc/public_slots', { method: 'POST', body: { p_week: weekId } });
  }
  function createBooking() {
    var d = state.details;
    var payload = {
      p_slot: state.slot.id, p_second: state.second ? state.second.id : null, p_product: state.product.id,
      p_name: d.name, p_unit: d.unit, p_phone: d.phone, p_backup_phone: d.backup_phone || null,
      p_email: d.email, p_access_notes: d.access_notes || null, p_terms_version: C.termsVersion,
    };
    if (!LIVE) return new Promise(function (r) { setTimeout(function () { r('demo-' + Date.now()); }, 400); });
    return rest('rpc/create_booking', { method: 'POST', body: payload });
  }

  // ---------- formatting ----------
  function fmt(iso, o) { return new Intl.DateTimeFormat('en-AU', Object.assign({ timeZone: TZ }, o)).format(new Date(iso)); }
  function time(iso) { return fmt(iso, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(':00', '').replace(' ', '').toLowerCase(); }
  function slotLabel(s) { return fmt(s.starts_at, { weekday: 'long', day: 'numeric', month: 'short' }) + ', ' + time(s.starts_at) + '–' + time(s.ends_at); }
  function money(n) { return n == null ? 'Price to be confirmed' : '$' + n.toFixed(0); }
  function weekLabel(w) {
    var d = new Date(w.week_start + 'T00:00:00');
    return w.address + ' (' + w.name + ') · week of ' + d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long' });
  }

  // ---------- steps ----------
  function go(n) {
    document.querySelectorAll('.step').forEach(function (s) { s.hidden = +s.dataset.step !== n; });
    document.querySelectorAll('.stepper li').forEach(function (li) {
      var s = +li.dataset.s; li.className = s === n ? 'on' : s < n ? 'done' : '';
    });
    $('#stepper').hidden = n === 6;
    var sec = document.querySelector('.step[data-step="' + n + '"]');
    var h = sec.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: $('#stepper').offsetTop - 90, behavior: 'smooth' });
  }
  document.querySelectorAll('[data-next]').forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.next); }); });
  document.querySelectorAll('[data-back]').forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.back); }); });

  // 1. building/week
  var weekSel = $('#week');
  loadWeeks().then(function (weeks) {
    weekSel.innerHTML = '<option value="">Choose your building…</option>' + weeks.map(function (w) {
      return '<option value="' + w.id + '" data-slug="' + w.slug + '">' + esc(weekLabel(w)) + '</option>';
    }).join('');
    var pre = new URLSearchParams(location.search).get('b');
    if (pre) {
      var opt = weekSel.querySelector('option[data-slug="' + CSS.escape(pre) + '"]');
      if (opt) { weekSel.value = opt.value; weekSel.dispatchEvent(new Event('change')); }
    }
    if (!weeks.length) weekSel.innerHTML = '<option value="">No service weeks open right now</option>';
  }).catch(function () {
    weekSel.innerHTML = '<option value="">Could not load buildings. Please call 0420 264 998</option>';
  });
  weekSel.addEventListener('change', function () {
    state.weekId = weekSel.value;
    state.weekLabel = weekSel.selectedOptions[0] ? weekSel.selectedOptions[0].textContent : '';
    state.slot = state.second = null;
    $('#to2').disabled = !state.weekId;
    if (state.weekId) renderCal();
  });

  // 2. calendar
  function renderCal() {
    var cal = $('#cal');
    cal.innerHTML = '<p class="cal-empty">Loading times…</p>';
    $('#enquiry').hidden = true; $('#to3').disabled = true;
    loadSlots(state.weekId).then(function (slots) {
      state.slots = slots;
      if (!slots.length) { cal.innerHTML = '<p class="cal-empty">No times have been released for this week yet.</p>'; return; }
      var days = {};
      slots.forEach(function (s) { var k = fmt(s.starts_at, { year: 'numeric', month: '2-digit', day: '2-digit' }); (days[k] = days[k] || []).push(s); });
      cal.innerHTML = Object.keys(days).map(function (k) {
        var first = days[k][0];
        return '<div class="day" role="row"><h4>' + fmt(first.starts_at, { weekday: 'short' }) + '<small>' + fmt(first.starts_at, { day: 'numeric', month: 'short' }) + '</small></h4>' +
          days[k].map(function (s) {
            var tag = s.status === 'available' ? 'Available' : s.status === 'taken' ? 'Booked · ask' : 'Unavailable · ask';
            return '<button type="button" role="gridcell" class="slot ' + s.status + '" data-id="' + s.id + '" aria-pressed="false" aria-label="' + esc(slotLabel(s)) + ', ' + tag + '">' +
              time(s.starts_at) + '–' + time(s.ends_at) + '<small>' + tag + '</small></button>';
          }).join('') + '</div>';
      }).join('');
      var avail = slots.filter(function (s) { return s.status === 'available'; });
      $('#second').innerHTML = '<option value="">' + (avail.length ? 'Choose an available time…' : 'No available times left this week') + '</option>' +
        avail.map(function (s) { return '<option value="' + s.id + '">' + esc(slotLabel(s)) + '</option>'; }).join('');
    }).catch(function () { cal.innerHTML = '<p class="cal-empty">Could not load times. Please call 0420 264 998.</p>'; });
  }
  $('#cal').addEventListener('click', function (e) {
    var b = e.target.closest('.slot'); if (!b) return;
    document.querySelectorAll('.slot').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    b.setAttribute('aria-pressed', 'true');
    state.slot = state.slots.find(function (s) { return s.id === b.dataset.id; });
    var isEnq = state.slot.status !== 'available';
    $('#enquiry').hidden = !isEnq;
    if (isEnq) { $('#second').value = ''; state.second = null; $('#enquiry').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    else state.second = null;
    syncTo3();
  });
  $('#second').addEventListener('change', function () {
    state.second = state.slots.find(function (s) { return s.id === $('#second').value; }) || null;
    syncTo3();
  });
  function syncTo3() { $('#to3').disabled = !state.slot || (state.slot.status !== 'available' && !state.second); }

  // 3. products
  $('#products').innerHTML = C.products.map(function (p) {
    return '<button type="button" class="product" role="radio" aria-checked="false" data-id="' + p.id + '">' +
      (p.best ? '<span class="best">Best value</span>' : '') +
      '<span class="pname">' + esc(p.name) + '</span><span class="pprice">' + money(p.price) + '</span>' +
      '<ul>' + p.points.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></button>';
  }).join('');
  $('#products').addEventListener('click', function (e) {
    var b = e.target.closest('.product'); if (!b) return;
    document.querySelectorAll('.product').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
    b.setAttribute('aria-checked', 'true');
    state.product = C.products.find(function (p) { return p.id === b.dataset.id; });
    $('#to4').disabled = false;
  });

  // 4. details
  var form = $('#details');
  $('#to5').addEventListener('click', function () {
    var ok = true;
    form.querySelectorAll('input[required]').forEach(function (i) {
      var bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)) || (i.type === 'tel' && i.value.replace(/\D/g, '').length < 8);
      i.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && ok) { i.focus(); ok = false; }
    });
    if (!ok) return;
    state.details = Object.fromEntries(new FormData(form));
    renderSummary(); go(5);
  });

  // 5. confirm
  function isEnquiry() { return state.slot && state.slot.status !== 'available'; }
  function renderSummary() {
    var d = state.details, rows = [
      ['Building', state.weekLabel],
      [isEnquiry() ? 'Requested time' : 'Time', slotLabel(state.slot) + (isEnquiry() ? ' (already taken, we will try to fit you in)' : '')],
    ];
    if (isEnquiry()) rows.push(['Second choice', slotLabel(state.second)]);
    rows.push(['Service', state.product.name], ['Name', d.name], ['Unit', d.unit], ['Mobile', d.phone]);
    if (d.backup_phone) rows.push(['Backup phone', d.backup_phone]);
    rows.push(['Email', d.email]);
    if (d.access_notes) rows.push(['Access notes', d.access_notes]);
    rows.push([isEnquiry() ? 'Price' : 'Total', money(state.product.price)]);
    $('#summary').innerHTML = rows.map(function (r, i) {
      return '<dt>' + esc(r[0]) + '</dt><dd' + (i === rows.length - 1 ? ' class="total"' : '') + '>' + esc(r[1]) + '</dd>';
    }).join('');
    $('#submit').textContent = isEnquiry() ? 'Send request' : 'Continue to payment';
    $('#payhint').textContent = isEnquiry()
      ? "You won't be charged now. We'll call or email you to confirm a time, then send a payment link."
      : 'Payment is taken securely by Stripe. Your time is held for 30 minutes while you pay.';
    syncSubmit();
  }
  function syncSubmit() { $('#submit').disabled = !($('#agree').checked && $('#agree2').checked); }
  $('#agree').addEventListener('change', syncSubmit);
  $('#agree2').addEventListener('change', syncSubmit);

  $('#submit').addEventListener('click', function () {
    var btn = $('#submit'); btn.disabled = true; btn.textContent = 'Saving…'; $('#err').textContent = '';
    createBooking().then(function (id) {
      if (isEnquiry()) return done('Request sent', "Thanks " + first() + ". We'll try to add a worker for " + slotLabel(state.slot) +
        ". If we can't, we'll book you in for your second choice, " + slotLabel(state.second) + ". We'll confirm by phone or email before taking payment.");
      var link = C.paymentLinks[state.product.id];
      if (link) {
        var u = new URL(link);
        u.searchParams.set('client_reference_id', id);
        u.searchParams.set('prefilled_email', state.details.email);
        location.href = u.toString();
        return;
      }
      done('Time reserved', 'Thanks ' + first() + '. ' + slotLabel(state.slot) + ' is held for you. ' +
        (LIVE ? "Online payment isn't switched on yet, so we'll send you a payment link shortly." : 'Demo mode: in the live version you would now go to the Stripe payment page.'));
    }).catch(function (e) {
      btn.disabled = false; renderSummary();
      $('#err').textContent = /taken|second choice/.test(e.message)
        ? 'Someone booked that time a moment ago. Go back and pick another time, or send a request for it.'
        : "Sorry, that didn't go through. Please try again or call " + C.phone + '.';
    });
  });
  function first() { return (state.details.name || '').split(' ')[0]; }
  function done(t, msg) { $('#doneTitle').textContent = t; $('#doneText').textContent = msg; go(6); }

  // Stripe success return: book.html?paid=1
  if (new URLSearchParams(location.search).get('paid')) done('Payment received', "You're booked in. A receipt is on its way to your email. If anything changes, call " + C.phone + '.');

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  if (!LIVE) $('#demo').hidden = false;
})();
