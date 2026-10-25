// F10 'Work with us' page: areas of work, availability grid, expression-of-interest form
(function () {
  var C = window.F10_BOOKING || {};
  var AREAS = [
    {
      key: 'Car detailing',
      title: 'Car detailing',
      summary: 'Interior detailing on-site at panel beaters and workshops.',
      tasks: ['Vacuum, crevice clean, glass and dash', 'Fabric & leather conditioning, odour treatment', 'Hot water extraction and stain treatment'],
    },
    {
      key: 'Steam cleaning (carpet, upholstery, mattress)',
      title: 'Steam cleaning',
      summary: 'Carpet, upholstery and mattress steam cleaning in apartment buildings and furnished units.',
      tasks: ['Hot water extraction on carpet', 'Lounges, chairs and soft furnishings', 'Mattresses'],
    },
    {
      key: 'Appliance cleaning (washers & dryers)',
      title: 'Appliance cleaning',
      summary: 'Washing machine and dryer cleaning in homes and shared building laundries.',
      tasks: ['Drum, door seal, drawer and filter cleaning', 'Dryer lint filter and housing', 'Working respectfully inside people’s homes'],
    },
  ];

  var grid = document.getElementById('jobs');
  grid.innerHTML = AREAS.map(function (r) {
    return '<article class="card job">' +
      '<span class="job-loc">Brunswick · Fitzroy</span>' +
      '<h3>' + r.title + '</h3><p>' + r.summary + '</p>' +
      '<ul class="ticks">' + r.tasks.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
      '<a class="btn secondary" href="#interest" data-role="' + r.key + '">Register interest</a>' +
      '</article>';
  }).join('');

  var form = document.getElementById('apply-form');
  // "Apply" buttons preselect role + location
  grid.addEventListener('click', function (e) {
    var a = e.target.closest('[data-role]'); if (!a) return;
    form.role.value = a.dataset.role;
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
    var payload = { type: 'interest' };
    ['role', 'location', 'full_name', 'phone', 'email', 'suburb', 'equipment', 'work_rights', 'transport',
     'experience', 'hours_per_week', 'start_date', 'availability_notes'].forEach(function (k) { payload[k] = d.get(k) || ''; });
    DAYS.forEach(function (day) { payload['avail_' + day.toLowerCase()] = avail[day]; });

    if (!C.appsScriptUrl) {
      status.textContent = 'Demo mode: not sent. In the live version your details go straight to F10.';
      console.log('application payload', payload);
      return;
    }
    button.disabled = true; button.textContent = 'Sending…';
    fetch(C.appsScriptUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.error) throw new Error(j.error);
        form.reset();
        button.textContent = 'Interest registered ✓';
        status.textContent = "Thanks, we've got your details. We'll be in touch if a suitable opportunity comes up.";
      })
      .catch(function () {
        button.disabled = false; button.textContent = 'Register my interest';
        status.innerHTML = 'That didn’t send. Please try again or call <a href="tel:+61420264998">0420 264 998</a>.';
      });
  });
})();
