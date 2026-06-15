/**
 * Check Testimonials HTTP — Quick-test endpoint testimonial lokal.
 *
 * Script kecil untuk memverifikasi bahwa endpoint `/api/testimonial`
 * di dev server merespons dengan benar (HTTP 200).
 *
 * @module scripts/utils/check-testimonials-http
 */
async function check() {
  try {
    const res = await fetch('http://localhost:3000/api/testimonial');
    const data = await res.json();

    console.log('--- imageSrc in Testimonials ---');
    if (data.testimonials) {
      data.testimonials.forEach((t: any) => {
        t.messages?.forEach((m: any) => {
          if (m.imageSrc) {
            console.log(`[${t.name}] -> ${m.imageSrc}`);
          }
        });
      });
    } else {
      console.log('No testimonials found in response:', Object.keys(data));
    }
  } catch (e) {
    console.error(e);
  }
}
check();
