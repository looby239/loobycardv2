document.addEventListener('DOMContentLoaded', () => {
  // --- Envelope Transition & Music ---
  const envelopeOverlay = document.getElementById('envelope-overlay');
  const btnOpenCard = document.getElementById('btn-open-card');
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');

  if (btnOpenCard && envelopeOverlay) {
    btnOpenCard.addEventListener('click', () => {
      // Add class to trigger CSS slide-up transition
      envelopeOverlay.classList.add('open');
      
      // Attempt to play music after user gesture
      if (bgMusic) {
        bgMusic.play()
          .then(() => {
            if (musicToggle) {
              musicToggle.style.display = 'flex';
              musicToggle.classList.add('playing');
              const icon = musicToggle.querySelector('i');
              if (icon) {
                icon.className = 'fas fa-volume-up';
              }
            }
          })
          .catch((error) => {
            console.log('Autoplay was blocked by browser. Showing music button for manual start.', error);
            if (musicToggle) {
              musicToggle.style.display = 'flex';
            }
          });
      }
      
      // Remove overlay from DOM after animation completes to avoid overlap issues
      setTimeout(() => {
        envelopeOverlay.style.display = 'none';
      }, 1200);
    });
  }

  // --- Music Toggle Controls ---
  if (musicToggle && bgMusic) {
    musicToggle.addEventListener('click', () => {
      const icon = musicToggle.querySelector('i');
      if (bgMusic.paused) {
        bgMusic.play();
        musicToggle.classList.add('playing');
        if (icon) {
          icon.className = 'fas fa-volume-up';
        }
      } else {
        bgMusic.pause();
        musicToggle.classList.remove('playing');
        if (icon) {
          icon.className = 'fas fa-volume-mute';
        }
      }
    });
  }

  // --- Wedding Date Countdown ---
  const weddingDate = new Date('October 25, 2026 11:30:00').getTime();
  const countdownContainer = document.getElementById('countdown');

  if (countdownContainer) {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('mins');
    const secsEl = document.getElementById('secs');

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = weddingDate - now;

      if (distance < 0) {
        clearInterval(countdownTimer);
        countdownContainer.innerHTML = '<div class="countdown-item" style="width: 100%;"><span style="font-size: 1.2rem;">Đã đến ngày trọng đại!</span></div>';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
      if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
      if (minsEl) minsEl.innerText = minutes.toString().padStart(2, '0');
      if (secsEl) secsEl.innerText = seconds.toString().padStart(2, '0');
    };

    updateCountdown(); // Run immediately
    const countdownTimer = setInterval(updateCountdown, 1000);
  }

  // --- RSVP Submission Handler ---
  const rsvpForm = document.getElementById('rsvp-form');
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const guestName = document.getElementById('guest-name').value.trim();
      const guestStatus = document.getElementById('guest-status').value;
      const guestCount = document.getElementById('guest-count').value;

      if (!guestName) return;

      let responseMsg = '';
      if (guestStatus === 'yes') {
        const countText = guestCount === '0' ? 'một mình' : `cùng ${guestCount} người khác`;
        responseMsg = `Cảm ơn ${guestName} đã xác nhận tham dự ${countText}! Rất vui mừng được đón tiếp bạn.`;
      } else {
        responseMsg = `Cảm ơn ${guestName} đã gửi phản hồi. Rất tiếc vì bạn không thể chung vui cùng gia đình.`;
      }

      // Display a beautiful visual popup/alert
      showCustomAlert(responseMsg, 'Xác Nhận RSVP Thành Công');
      rsvpForm.reset();
    });
  }

  // --- Guestbook Wish Submission Handler ---
  const wishForm = document.getElementById('wish-form');
  const wishesList = document.getElementById('wishes-list');

  if (wishForm && wishesList) {
    wishForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const wishName = document.getElementById('wish-name').value.trim();
      const wishText = document.getElementById('wish-text').value.trim();

      if (!wishName || !wishText) return;

      // Create new wish list item element
      const wishItem = document.createElement('div');
      wishItem.className = 'wish-item';
      
      const wishAuthor = document.createElement('strong');
      wishAuthor.innerText = wishName;
      
      const wishContent = document.createElement('p');
      wishContent.innerText = wishText;
      
      wishItem.appendChild(wishAuthor);
      wishItem.appendChild(wishContent);

      // Prepend to top of list
      wishesList.insertBefore(wishItem, wishesList.firstChild);

      // Smooth scroll wishes list back to the top
      wishesList.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // Clear fields
      wishForm.reset();
      
      // Visual feedback popup
      showCustomAlert('Lời chúc của bạn đã được gửi thành công đến cô dâu & chú rể!', 'Gửi Lời Chúc Thành Công');
    });
  }

  // --- Photo Lightbox System ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  // List of all wedding photos for full screen
  const photosList = [
    '../../../assets/images/template-11/photo1.webp',
    '../../../assets/images/template-11/photo2.webp',
    '../../../assets/images/template-11/photo3.webp',
    '../../../assets/images/template-11/photo4.webp',
    '../../../assets/images/template-11/photo5.webp',
    '../../../assets/images/template-11/photo6.webp',
    '../../../assets/images/template-11/photo7.webp'
  ];
  let currentPhotoIndex = 0;

  // Add click listener to all gallery images
  const galleryImgs = document.querySelectorAll('.gallery-grid .gallery-img');
  galleryImgs.forEach((img, index) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      currentPhotoIndex = index + 1; // offset because photo1 is hero photo
      openLightbox();
    });
  });

  // Also allow hero image to open lightbox (photo1)
  const heroImage = document.querySelector('.hero-image');
  if (heroImage) {
    heroImage.style.cursor = 'pointer';
    heroImage.addEventListener('click', () => {
      currentPhotoIndex = 0;
      openLightbox();
    });
  }

  function openLightbox() {
    if (lightbox && lightboxImg) {
      lightboxImg.src = photosList[currentPhotoIndex];
      lightbox.classList.add('active');
    }
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
    });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      currentPhotoIndex = (currentPhotoIndex - 1 + photosList.length) % photosList.length;
      lightboxImg.src = photosList[currentPhotoIndex];
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      currentPhotoIndex = (currentPhotoIndex + 1) % photosList.length;
      lightboxImg.src = photosList[currentPhotoIndex];
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
      }
    });

    // Keyboard support: Escape to close, arrow keys to navigate
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') lightbox.classList.remove('active');
      if (e.key === 'ArrowLeft') {
        currentPhotoIndex = (currentPhotoIndex - 1 + photosList.length) % photosList.length;
        lightboxImg.src = photosList[currentPhotoIndex];
      }
      if (e.key === 'ArrowRight') {
        currentPhotoIndex = (currentPhotoIndex + 1) % photosList.length;
        lightboxImg.src = photosList[currentPhotoIndex];
      }
    });
  }

  // --- Custom Alert Toast ---
  function showCustomAlert(message, title = 'Thông Báo') {
    // Check if dialog already exists, remove it
    const existingAlert = document.getElementById('custom-toast-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    const alertOverlay = document.createElement('div');
    alertOverlay.id = 'custom-toast-alert';
    alertOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
      background: #ffffff;
      padding: 2rem 1.5rem;
      border-radius: 16px;
      width: 85%;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
      border: 1px solid rgba(64, 74, 29, 0.1);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;

    const alertTitle = document.createElement('h3');
    alertTitle.innerText = title;
    alertTitle.style.cssText = `
      margin-bottom: 0.8rem;
      color: #404A1D;
      font-family: 'Playfair Display', serif;
      font-size: 1.3rem;
      font-weight: 600;
    `;

    const alertMsg = document.createElement('p');
    alertMsg.innerText = message;
    alertMsg.style.cssText = `
      margin-bottom: 1.5rem;
      color: #555555;
      font-size: 0.9rem;
      line-height: 1.5;
    `;

    const alertBtn = document.createElement('button');
    alertBtn.innerText = 'Đóng';
    alertBtn.style.cssText = `
      background: #404A1D;
      color: #ffffff;
      border: none;
      padding: 0.6rem 2rem;
      border-radius: 20px;
      font-family: 'Quicksand', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(64, 74, 29, 0.15);
    `;

    alertBtn.addEventListener('click', () => {
      alertOverlay.style.opacity = '0';
      alertBox.style.transform = 'scale(0.9)';
      setTimeout(() => {
        alertOverlay.remove();
      }, 300);
    });

    alertBox.appendChild(alertTitle);
    alertBox.appendChild(alertMsg);
    alertBox.appendChild(alertBtn);
    alertOverlay.appendChild(alertBox);
    document.body.appendChild(alertOverlay);

    // Fade in
    setTimeout(() => {
      alertOverlay.style.opacity = '1';
      alertBox.style.transform = 'scale(1)';
    }, 50);
  }
});
