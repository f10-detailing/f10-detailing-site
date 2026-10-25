// Mobile menu
(function () {
  var nav = document.querySelector('nav');
  var btn = document.querySelector('.nav-toggle');
  if (!nav || !btn) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('ul a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Enquiry (quote request) form → F10 Google Sheet "Enquiries" tab + email to F10.
// If the sheet can't be reached, the visitor is offered a text message or call instead,
// so no enquiry is silently lost.
var F10_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyFNFaX3HNSzGg85JoDpeDRt2FhvnH2rbML6lvaH9bH5azkO9U9K7HlxIU_AWiS6bs8/exec';
var F10_MOBILE = '+61420264998';

document.querySelectorAll('form[data-enquiry]').forEach(function (form) {
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('.hp input').value) return; // bot
    if (!form.reportValidity()) return;

    var data = new FormData(form);
    var payload = { type: 'enquiry', page: location.pathname };
    ['business', 'name', 'phone', 'email', 'sector', 'suburb', 'message'].forEach(function (k) { payload[k] = data.get(k) || ''; });

    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = '';
    fetch(F10_SHEET_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || res.error || !res.id) throw new Error((res && res.error) || 'failed');
        form.reset();
        button.textContent = 'Request received ✓';
        status.textContent = "Thanks, we've got it. We'll call you back shortly.";
      })
      .catch(function () {
        var text = 'F10 enquiry\nBusiness: ' + payload.business + '\nContact: ' + payload.name + '\nPhone: ' + payload.phone +
          '\nEmail: ' + payload.email + '\nType: ' + payload.sector + '\nSuburb: ' + payload.suburb + '\nNotes: ' + payload.message;
        button.disabled = false;
        button.textContent = 'Send enquiry';
        status.innerHTML = 'Sorry, that didn’t go through. Please <a href="sms:' + F10_MOBILE + '?&body=' + encodeURIComponent(text) +
          '">text it to us</a> or call <a href="tel:' + F10_MOBILE + '">0420 264 998</a>.';
      });
  });
});
