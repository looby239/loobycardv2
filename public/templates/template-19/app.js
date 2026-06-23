document.addEventListener('DOMContentLoaded', () => {
  
  // --- Envelope Transition & Music ---
  const envelopeOverlay = document.getElementById('envelope-overlay');
  const btnOpenCard = document.getElementById('btn-open-card');
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');

  if (btnOpenCard && envelopeOverlay) {
    btnOpenCard.addEventListener('click', () => {
      // Trigger slide-up CSS transition
      envelopeOverlay.classList.add('open');
      
      // Play background music after explicit user interaction
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
            console.log('Autoplay was blocked by browser. Showing controls for manual start.', error);
            if (musicToggle) {
              musicToggle.style.display = 'flex';
            }
          });
      }
      
      // Remove overlay from display to avoid page click interference
      setTimeout(() => {
        envelopeOverlay.style.display = 'none';
      }, 1200);
    });
  }

  // --- Music Controls Toggle ---
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

  // --- Floating Red Petals/Hearts Particles Generator ---
  const particlesContainer = document.getElementById('particles-container');
  if (particlesContainer) {
    const leafSymbols = ['♥', '🌹', '🌸', '♥', '🌸'];
    const maxParticles = 15;

    for (let i = 0; i < maxParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.innerText = leafSymbols[Math.floor(Math.random() * leafSymbols.length)];
      
      // Randomize initial positions & animation durations
      const leftPos = Math.random() * 100; // Percentage offset
      const fontSize = 12 + Math.random() * 16; // 12px to 28px
      const swayVal = -50 + Math.random() * 100; // Sway range
      const animDuration = 6 + Math.random() * 8; // 6s to 14s
      const animDelay = Math.random() * 6; // 0s to 6s

      particle.style.left = `${leftPos}%`;
      particle.style.fontSize = `${fontSize}px`;
      particle.style.setProperty('--sway', `${swayVal}px`);
      particle.style.animation = `ambient-fall ${animDuration}s ease-in-out ${animDelay}s infinite`;

      // Apply harmonious red and pink color shades matching the design system
      const redShades = ['#CE403F', '#7C151A', '#ECDFD6', '#B52028', '#8C7E7C'];
      particle.style.color = redShades[Math.floor(Math.random() * redShades.length)];

      particlesContainer.appendChild(particle);
    }
  }

  // --- Ticking Countdown Timer ---
  const countdownContainer = document.getElementById('countdown-timer');
  if (countdownContainer) {
    const targetDateStr = countdownContainer.getAttribute('data-target');
    const targetDate = new Date(targetDateStr).getTime();
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        if (daysEl) daysEl.innerText = '00';
        if (hoursEl) hoursEl.innerText = '00';
        if (minutesEl) minutesEl.innerText = '00';
        if (secondsEl) secondsEl.innerText = '00';
        clearInterval(timerInterval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (daysEl) daysEl.innerText = days < 10 ? '0' + days : days;
      if (hoursEl) hoursEl.innerText = hours < 10 ? '0' + hours : hours;
      if (minutesEl) minutesEl.innerText = minutes < 10 ? '0' + minutes : minutes;
      if (secondsEl) secondsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
    };

    updateTimer(); // Call once immediately
    const timerInterval = setInterval(updateTimer, 1000);
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
        const countText = (guestCount === '0' || !guestCount) ? 'một mình' : `cùng ${guestCount} người đi cùng`;
        responseMsg = `Cảm ơn ${guestName} đã xác nhận tham dự (${countText})! Sự hiện diện của bạn là niềm vinh hạnh to lớn đối với chúng tôi.`;
      } else {
        responseMsg = `Cảm ơn ${guestName} đã phản hồi. Thật tiếc vì bạn không thể tham dự để chung vui cùng chúng tôi.`;
      }

      showCustomAlert(responseMsg, 'Xác Nhận Thành Công');
      rsvpForm.reset();
    });
  }

  // --- Guestbook Wishes Storage & Handler ---
  const wishForm = document.getElementById('wish-form');
  const wishesList = document.getElementById('wishes-list');
  const STORAGE_KEY = 'looby_wedding_wishes_19';

  // Fallback default wishes
  const defaultWishes = [
    { name: 'Trọng Nhân', text: 'Chúc mừng hạnh phúc Minh Thư và Thành Lộc! Chúc hai em trăm năm hòa hợp, gia đình luôn tràn ngập tiếng cười.' },
    { name: 'Hồng Hạnh', text: 'Chúc đôi bạn trẻ đầu bạc răng long, mãi mãi hạnh phúc nhé!' }
  ];

  const loadWishes = () => {
    if (!wishesList) return;
    wishesList.innerHTML = '';
    
    let stored = localStorage.getItem(STORAGE_KEY);
    let wishes = [];
    
    if (stored) {
      wishes = JSON.parse(stored);
    } else {
      wishes = defaultWishes;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
    }
    
    if (wishes.length === 0) {
      wishesList.innerHTML = '<div class="no-wishes">Chưa có lời chúc nào. Hãy gửi lời chúc đầu tiên nhé!</div>';
      return;
    }

    wishes.forEach(wish => {
      const wishItem = document.createElement('div');
      wishItem.className = 'wish-item';
      
      const wishAuthor = document.createElement('strong');
      wishAuthor.innerText = wish.name;
      
      const wishContent = document.createElement('p');
      wishContent.innerText = wish.text;
      
      wishItem.appendChild(wishAuthor);
      wishItem.appendChild(wishContent);
      wishesList.appendChild(wishItem);
    });
  };

  // Load immediately
  loadWishes();

  if (wishForm) {
    wishForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const wishName = document.getElementById('wish-name').value.trim();
      const wishText = document.getElementById('wish-text').value.trim();

      if (!wishName || !wishText) return;

      let stored = localStorage.getItem(STORAGE_KEY);
      let wishes = stored ? JSON.parse(stored) : [];
      
      // Insert new wish at the beginning
      wishes.unshift({ name: wishName, text: wishText });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));

      // Reload list
      loadWishes();

      // Scroll wishes list back to the top
      wishesList.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      wishForm.reset();
      
      showCustomAlert('Lời chúc của bạn đã được lưu lại trong sổ lưu bút. Cảm ơn bạn!', 'Gửi Lời Chúc Thành Công');
    });
  }

  // --- Gift Modal Controls ---
  const giftModal = document.getElementById('gift-modal');
  const giftModalTrigger = document.getElementById('gift-modal-trigger');
  const giftModalClose = document.getElementById('gift-modal-close');

  if (giftModal && giftModalTrigger && giftModalClose) {
    giftModalTrigger.addEventListener('click', () => {
      giftModal.classList.add('open');
    });

    giftModalClose.addEventListener('click', () => {
      giftModal.classList.remove('open');
    });

    // Close modal when clicking on background overlay
    giftModal.addEventListener('click', (e) => {
      if (e.target === giftModal) {
        giftModal.classList.remove('open');
      }
    });
  }

  // Alert on Lưu QR code triggers
  const saveQrBtns = document.querySelectorAll('.btn-save-qr');
  saveQrBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const owner = btn.closest('.bank-card').querySelector('.bank-card-header').innerText;
      setTimeout(() => {
        showCustomAlert(`Mã QR mừng cưới của ${owner} đang được tải về máy của bạn.`, 'Tải QR Code');
      }, 300);
    });
  });

  // --- Photo Lightbox Popup Carousel ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxIndex = document.getElementById('lightbox-index');

  const photosList = [
    '../../../assets/images/template-19/photo1.jpg',
    '../../../assets/images/template-19/photo2.jpg',
    '../../../assets/images/template-19/photo3.jpg',
    '../../../assets/images/template-19/photo4.jpg',
    '../../../assets/images/template-19/photo5.jpg'
  ];
  
  let currentPhotoIndex = 0;

  window.openWeddingLightbox = (index) => {
    currentPhotoIndex = index;
    updateLightboxContent();
    if (lightbox) {
      lightbox.classList.add('open');
    }
  };

  const closeWeddingLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('open');
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

  // Keyboard navigation support
  document.addEventListener('keydown', (e) => {
    if (lightbox && lightbox.classList.contains('open')) {
      if (e.key === 'Escape') {
        closeWeddingLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        navigateLightbox(1);
      }
    }
  });

  // --- Custom Modal Toast Alert System ---
  function showCustomAlert(message, title = 'Thông Báo') {
    const existing = document.getElementById('custom-toast-alert');
    if (existing) {
      existing.remove();
    }

    const alertOverlay = document.createElement('div');
    alertOverlay.id = 'custom-toast-alert';
    alertOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(40, 20, 20, 0.7);
      backdrop-filter: blur(2px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 30000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
      background: #ffffff;
      padding: 2.2rem 1.5rem;
      border-radius: 16px;
      width: 85%;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 15px 35px rgba(124, 21, 26, 0.2);
      border: 1px solid var(--color-border);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;

    const alertTitle = document.createElement('h3');
    alertTitle.innerText = title;
    alertTitle.style.cssText = `
      margin-bottom: 0.8rem;
      color: var(--color-primary-dark);
      font-family: var(--font-serif);
      font-size: 1.3rem;
      font-weight: 700;
      text-align: center;
    `;

    const alertMsg = document.createElement('p');
    alertMsg.innerText = message;
    alertMsg.style.cssText = `
      margin-bottom: 1.5rem;
      color: var(--color-text);
      font-size: 0.9rem;
      line-height: 1.5;
    `;

    const alertBtn = document.createElement('button');
    alertBtn.innerText = 'Đóng';
    alertBtn.style.cssText = `
      background: var(--color-primary-dark);
      color: #ffffff;
      border: none;
      padding: 0.65rem 2.6rem;
      border-radius: 20px;
      font-family: var(--font-serif);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(124, 21, 26, 0.25);
      transition: all 0.2s ease;
      outline: none;
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

    // Trigger visual opening transition
    setTimeout(() => {
      alertOverlay.style.opacity = '1';
      alertBox.style.transform = 'scale(1)';
    }, 50);
  }
});
