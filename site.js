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

// Enquiry form.
// Set WEB3FORMS_KEY to a Web3Forms access key registered to the F10 inbox
// (free at web3forms.com) and enquiries will be emailed there.
// Until a key is set, the form hands the enquiry to the visitor's SMS app
// addressed to the F10 mobile, so no enquiry is silently lost.
var WEB3FORMS_KEY = '';
var F10_MOBILE = '+61420264998';

document.querySelectorAll('form[data-enquiry]').forEach(function (form) {
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.querySelector('.hp input').value) return; // bot

    var data = new FormData(form);
    var lines = [
      'F10 enquiry',
      'Business: ' + (data.get('business') || ''),
      'Contact: ' + (data.get('name') || ''),
      'Phone: ' + (data.get('phone') || ''),
      'Email: ' + (data.get('email') || ''),
      'Type: ' + (data.get('sector') || ''),
      'Suburb: ' + (data.get('suburb') || ''),
      'Notes: ' + (data.get('message') || '')
    ];

    if (!WEB3FORMS_KEY) {
      var href = 'sms:' + F10_MOBILE + '?&body=' + encodeURIComponent(lines.join('\n'));
      status.innerHTML = 'Opening your messages app to send this to us. If nothing opens, ' +
        '<a href="' + href + '">tap here to text it</a> or call <a href="tel:' + F10_MOBILE + '">0420 264 998</a>.';
      window.location.href = href;
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';
    data.append('access_key', WEB3FORMS_KEY);
    data.append('subject', 'F10 website enquiry: ' + (data.get('business') || 'new lead'));
    data.delete('botcheck');
    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success) throw new Error(res.message || 'failed');
        form.reset();
        button.textContent = 'Request received ✓';
        status.textContent = "Thanks, we've got it. We'll call you back shortly.";
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = 'Send enquiry';
        status.innerHTML = 'That didn\'t send. Please call <a href="tel:' + F10_MOBILE + '">0420 264 998</a>.';
      });
  });
});
