// F10 resident booking — settings.
// Until appsScriptUrl is set, the page runs in DEMO mode with sample data and saves nothing.
window.F10_BOOKING = {
  // Web app URL of the F10 Bookings Google Apps Script (ends in /exec). Bookings land in the Google Sheet.
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbyFNFaX3HNSzGg85JoDpeDRt2FhvnH2rbML6lvaH9bH5azkO9U9K7HlxIU_AWiS6bs8/exec',

  // Stripe Payment Links (one per product). Created in the F10 Stripe dashboard.
  // The page adds ?client_reference_id=<booking id>&prefilled_email=<email> automatically.
  paymentLinks: { washer: '', dryer: '', bundle: '' },

  termsVersion: '2026-10-18-draft',
  phone: '0420 264 998',

  // price: number in AUD (F10 not GST-registered as of Oct 2026), or null = "price to be confirmed"
  products: [
    {
      id: 'washer',
      name: 'Washing machine yearly clean',
      price: 150,
      points: ['Drum, door seal and detergent drawer deep clean', 'Accessible pump filter cleared', 'Exterior wiped and descaled', 'Condition notes if we spot a fault'],
    },
    {
      id: 'dryer',
      name: 'Dryer yearly clean',
      price: 150,
      points: ['Lint filter and accessible lint housing cleaned', 'Drum and door seal cleaned', 'Exterior wiped down', 'Condition notes if we spot a fault'],
    },
    {
      id: 'bundle',
      name: 'Laundry bundle: washer + dryer',
      price: 250,
      points: ['Everything in both cleans', 'One visit, one booking', 'Save $50 vs booking separately'],
      best: true,
    },
  ],
};
