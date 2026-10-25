// F10 jobs page: listings, filter, availability grid, application form
(function () {
  var C = window.F10_BOOKING || {};
  var LOCS = ['Brunswick', 'Fitzroy'];
  var ROLES = [
    {
      key: 'Car detailer',
      title: 'Car detailer',
      summary: "Interior detailing on-site at our partner panel beaters, while customers' cars are in for repair.",
      tasks: ['Vacuum, crevice clean, glass and dash', 'Fabric & leather conditioning, odour treatment', 'Hot water extraction and stain treatment', 'F10 finishing touches, like brushing the logo into floor mats'],
    },
    {
      key: 'Steam cleaner (carpet, upholstery, mattress)',
      title: 'Steam cleaner',
      summary: 'Carpet, upholstery and mattress steam cleaning in apartment buildings, common areas and furnished units.',
      tasks: ['Hot water extraction on carpet', 'Lounges, chairs and soft furnishings', 'Mattresses between tenants', 'Working around residents, tidy and quiet'],
    },
    {
      key: 'Appliance maintenance cleaner (washers & dryers)',
      title: 'Appliance maintenance cleaner',
      summary: "Yearly washing machine and dryer cleans in residents' homes and shared building laundries.",
      tasks: ['Drum, door seal, drawer and filter cleaning', 'Dryer lint filter and housing', 'Spotting faults and noting them for the manager', 'Working respectfully inside people’s homes'],
    },
  ];

  var grid = document.getElementById('jobs');
  grid.innerHTML = ROLES.map(function (r) {
    return LOCS.map(function (loc) {
      return '<article class="card job" data-loc="' + loc + '">' +
        '<span class="job-loc">' + loc + ', VIC</span>' +
        '<h3>' + r.title + '</h3><p>' + r.summary + '</p>' +
        '<ul class="ticks">' + r.tasks.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
        '<div class="foot"><b>Independent contractor</b> · 65% of job fee · flexible hours</div>' +
        '<a class="btn" href="#apply" data-role="' + r.key + '" data-apply-loc="' + loc + '">Apply for ' + loc + '</a>' +
        '</article>';
    }).join('');
  }).join('');

  // location filter
  document.querySelectorAll('.chip-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.chip-btn').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('.job').forEach(function (j) { j.hidden = b.dataset.loc !== 'all' && j.dataset.loc !== b.dataset.loc; });
    });
  });

  var form = document.getElementById('apply-form');
  // "Apply" buttons preselect role + location
  grid.addEventListener('click', function (e) {
    var a = e.target.closest('[data-role]'); if (!a) return;
    form.role.value = a.dataset.role;
    form.location.value = a.dataset.applyLoc;
  });

  // availability grid
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var SLOTS = [['AM', 'Morning'], ['PM', 'Afternoon'], ['EVE', 'Evening']];
  document.getElementById('avail-grid').innerHTML = DAYS.map(function (d) {
    return '<tr><th scope="row">' + d + '</th>' + SLOTS.map(function (s) {
      return '<td><label class="tick"><input type="checkbox" name="avail_' + d + '" value="' + s[0] + '"><span class="sr">' + d + ' ' + s[1] + '</span></label></td>';
    }).join('') + '</tr>';
  }).join('');
  form.start_date.min = new Date().toISOString().slice(0, 10);

  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.botcheck.value) return;
    var availErr = document.getElementById('avail-err');
    var avail = {};
    DAYS.forEach(function (d) {
      avail[d] = [].map.call(form.querySelectorAll('input[name="avail_' + d + '"]:checked'), function (i) { return i.value; }).join(' ');
    });
    var any = DAYS.some(function (d) { return avail[d]; });
    availErr.textContent = any ? '' : 'Please tick at least one time you can work.';
    if (!any) { form.querySelector('.avail').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

    var d = new FormData(form);
    var payload = { type: 'application' };
    ['role', 'location', 'full_name', 'phone', 'email', 'suburb', 'abn', 'equipment', 'work_rights', 'transport',
     'experience', 'hours_per_week', 'start_date', 'availability_notes'].forEach(function (k) { payload[k] = d.get(k) || ''; });
    DAYS.forEach(function (day) { payload['avail_' + day.toLowerCase()] = avail[day]; });

    if (!C.appsScriptUrl) {
      status.textContent = 'Demo mode: application not sent. In the live version it goes straight to F10.';
      console.log('application payload', payload);
      return;
    }
    button.disabled = true; button.textContent = 'Sending…';
    fetch(C.appsScriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.error) throw new Error(j.error);
        form.reset();
        button.textContent = 'Application sent ✓';
        status.textContent = "Thanks! We've got your application and will call suitable applicants soon.";
      })
      .catch(function () {
        button.disabled = false; button.textContent = 'Send application';
        status.innerHTML = 'That didn’t send. Please try again or call <a href="tel:+61420264998">0420 264 998</a>.';
      });
  });
})();
