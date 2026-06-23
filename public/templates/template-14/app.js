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

  // --- Falling Green Leaves Particles Generator ---
  const particlesContainer = document.getElementById('particles-container');
  if (particlesContainer) {
    const leafSymbols = ['🍃', '🌿', '🌱', '🍀', '🍂'];
    const maxParticles = 16;

    for (let i = 0; i < maxParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.innerText = leafSymbols[Math.floor(Math.random() * leafSymbols.length)];
      
      // Randomize styles
      const leftPos = Math.random() * 100; // percentage
      const fontSize = 12 + Math.random() * 16; // 12px to 28px
      const swayVal = -50 + Math.random() * 100; // -50px to 50px
      const animDuration = 8 + Math.random() * 10; // 8s to 18s
      const animDelay = Math.random() * 8; // 0s to 8s

      particle.style.left = `${leftPos}%`;
      particle.style.fontSize = `${fontSize}px`;
      particle.style.setProperty('--sway', `${swayVal}px`);
      particle.style.animation = `leaf-fall ${animDuration}s linear ${animDelay}s infinite`;

      // Apply subtle green / nature color shades
      const greenShades = ['#5d6a57', '#8a9e82', '#a3b899', '#7c9d86', '#4e6e58'];
      particle.style.color = greenShades[Math.floor(Math.random() * greenShades.length)];

      particlesContainer.appendChild(particle);
    }
  }

  // --- Wedding Date Countdown ---
  const weddingDate = new Date('June 8, 2026 10:30:00').getTime();
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
        countdownContainer.innerHTML = '<div class="countdown-item" style="width: 100%;"><span style="font-size: 1.1rem; color: #5d6a57;">Đã đến ngày chung đôi!</span></div>';
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
        responseMsg = `Cảm ơn ${guestName} đã xác nhận tham dự ${countText}! Rất vui mừng được đón tiếp bạn trong vườn xuân hạnh phúc của chúng tôi.`;
      } else {
        responseMsg = `Cảm ơn ${guestName} đã gửi phản hồi. Rất tiếc vì bạn không thể ghé thăm vườn xuân chia vui cùng gia đình.`;
      }

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
      showCustomAlert('Lời chúc tốt đẹp của bạn đã được lưu bút thành công!', 'Gửi Lời Chúc Thành Công');
    });
  }

  // --- Gift Modal Controls ---
  const giftModal = document.getElementById('gift-modal');
  const giftModalTrigger = document.getElementById('gift-modal-trigger');
  const giftModalClose = document.getElementById('gift-modal-close');

  if (giftModal && giftModalTrigger && giftModalClose) {
    giftModalTrigger.addEventListener('click', () => {
      giftModal.classList.add('active');
    });

    giftModalClose.addEventListener('click', () => {
      giftModal.classList.remove('active');
    });

    // Close on overlay click
    giftModal.addEventListener('click', (e) => {
      if (e.target === giftModal) {
        giftModal.classList.remove('active');
      }
    });
  }

  // --- Photo Lightbox Popup Navigation System ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxIndex = document.getElementById('lightbox-index');

  const photosList = [
    '../../../assets/images/template-14/photo1.jpg',
    '../../../assets/images/template-14/photo2.jpg',
    '../../../assets/images/template-14/photo3.jpg',
    '../../../assets/images/template-14/photo4.jpg',
    '../../../assets/images/template-14/photo5.jpg',
    '../../../assets/images/template-14/photo6.jpg',
    '../../../assets/images/template-14/photo7.jpg',
    '../../../assets/images/template-14/photo8.jpg',
    '../../../assets/images/template-14/photo9.jpg',
    '../../../assets/images/template-14/photo10.jpg',
    '../../../assets/images/template-14/photo11.jpg',
    '../../../assets/images/template-14/photo12.jpg'
  ];
  
  let currentPhotoIndex = 0;

  window.openWeddingLightbox = (index) => {
    currentPhotoIndex = index;
    updateLightboxContent();
    if (lightbox) {
      lightbox.classList.add('active');
    }
  };

  const closeWeddingLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('active');
    }
  };

  const navigateLightbox = (direction) => {
    currentPhotoIndex = (currentPhotoIndex + direction + photosList.length) % photosList.length;
    updateLightboxContent();
  };

  const updateLightboxContent = () => {
    if (lightboxImg) {
      lightboxImg.src = photosList[currentPhotoIndex];
    }
    if (lightboxIndex) {
      lightboxIndex.innerText = `${currentPhotoIndex + 1} / ${photosList.length}`;
    }
  };

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeWeddingLightbox);
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(-1);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(1);
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeWeddingLightbox();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (lightbox && lightbox.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeWeddingLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        navigateLightbox(1);
      }
    }
  });

  // --- Save QR Alerts ---
  window.saveQRCode = (bankName) => {
    showCustomAlert(`Đã lưu mã QR mừng cưới qua tài khoản ${bankName} thành công!`, 'Lưu QR Code');
  };

  // --- Custom Alert Toast Dialog ---
  function showCustomAlert(message, title = 'Thông Báo') {
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
      background: rgba(47, 62, 51, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 20000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
      background: #ffffff;
      padding: 2.2rem 1.5rem;
      border-radius: 12px;
      width: 85%;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 16px 32px rgba(93, 106, 87, 0.12);
      border: 1px solid var(--color-border);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;

    const alertTitle = document.createElement('h3');
    alertTitle.innerText = title;
    alertTitle.style.cssText = `
      margin-bottom: 0.8rem;
      color: #5d6a57;
      font-family: 'Lora', serif;
      font-size: 1.3rem;
      font-weight: 600;
    `;

    const alertMsg = document.createElement('p');
    alertMsg.innerText = message;
    alertMsg.style.cssText = `
      margin-bottom: 1.5rem;
      color: #2f3e33;
      font-size: 0.9rem;
      line-height: 1.5;
    `;

    const alertBtn = document.createElement('button');
    alertBtn.innerText = 'Đóng';
    alertBtn.style.cssText = `
      background: #5d6a57;
      color: #ffffff;
      border: none;
      padding: 0.6rem 2.5rem;
      border-radius: 20px;
      font-family: 'Lora', serif;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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
