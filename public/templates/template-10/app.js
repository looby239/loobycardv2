// Countdown Timer Logic
const weddingDate = new Date('June 1, 2026 11:30:00').getTime();

const countdownTimer = setInterval(() => {
  const now = new Date().getTime();
  const distance = weddingDate - now;

  if (distance < 0) {
    clearInterval(countdownTimer);
    document.getElementById('countdown').innerHTML = '<div class="countdown-item"><span>Đã đến ngày!</span></div>';
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById('days').innerText = days.toString().padStart(2, '0');
  document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
  document.getElementById('mins').innerText = minutes.toString().padStart(2, '0');
  document.getElementById('secs').innerText = seconds.toString().padStart(2, '0');
}, 1000);

// Floating Animation Logic
function createFloatingHY() {
  const container = document.getElementById('hy-container');
  const el = document.createElement('div');
  el.className = 'floating-hy';
  el.innerText = '囍';
  
  // Random start position
  const startPosX = Math.random() * 100;
  el.style.left = startPosX + '%';
  el.style.bottom = '-50px';
  
  // Random size
  const size = Math.random() * 20 + 15;
  el.style.fontSize = size + 'px';
  
  // Random animation duration
  const duration = Math.random() * 5 + 5;
  el.style.animationDuration = duration + 's';
  
  container.appendChild(el);
  
  // Remove after animation completes
  setTimeout(() => {
    el.remove();
  }, duration * 1000);
}

// Create new floating symbols every 800ms
setInterval(createFloatingHY, 800);

// --- Photo Lightbox for Gallery Images ---
document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  const allImages = document.querySelectorAll('.gallery-img, .hero img');
  allImages.forEach((img) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      if (lightbox && lightboxImg) {
        lightboxImg.src = img.src;
        lightbox.classList.add('active');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox) lightbox.classList.remove('active');
  });
});
