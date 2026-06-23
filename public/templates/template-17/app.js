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

  // --- Falling Sakura Blossoms Particles Generator ---
  const particlesContainer = document.getElementById('particles-container');
  if (particlesContainer) {
    const flowerSymbols = ['🌸', '🌸', '🌸', '🌸'];
    const maxParticles = 12;

    for (let i = 0; i < maxParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.innerText = flowerSymbols[Math.floor(Math.random() * flowerSymbols.length)];
      
      // Randomize styles
      const leftPos = Math.random() * 100; // percentage
      const fontSize = 14 + Math.random() * 14; // 14px to 28px
      const swayVal = -40 + Math.random() * 80; // -40px to 40px
      const animDuration = 7 + Math.random() * 8; // 7s to 15s
      const animDelay = Math.random() * 6; // 0s to 6s

      particle.style.left = `${leftPos}%`;
      particle.style.fontSize = `${fontSize}px`;
      particle.style.setProperty('--sway', `${swayVal}px`);
      particle.style.animation = `fall-sway ${animDuration}s ease-in-out ${animDelay}s infinite`;

      // Apply elegant pink / pastel shades matching the theme
      const pinkShades = ['#F5C6C9', '#e8a8a0', '#BAB4C7', '#d4b8b4', '#ffb7c5'];
      particle.style.color = pinkShades[Math.floor(Math.random() * pinkShades.length)];

      particlesContainer.appendChild(particle);
    }
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
        responseMsg = `Cảm ơn ${guestName} đã phản hồi. Thật tiếc vì bạn không thể tham dự để chia vui cùng chúng tôi.`;
      }

      showCustomAlert(responseMsg, 'Phản Hồi Thành Công');
      rsvpForm.reset();
    });
  }

  // --- Guestbook wishes loading & submission ---
  const wishForm = document.getElementById('wish-form');
  const wishesList = document.getElementById('wishes-list');
  const STORAGE_KEY = 'looby_wedding_wishes_17';

  // Preset default wishes if none exist in localStorage
  const defaultWishes = [
    { name: 'Minh Tuấn', text: 'Chúc mừng hạnh phúc Lộc & Thư! Chúc gia đình nhỏ luôn rộn rã tiếng cười, trăm năm bạc đầu nghĩa tình.' },
    { name: 'Bích Trâm', text: 'Tiệc cưới đẹp và ý nghĩa quá. Chúc hai bạn luôn yêu thương và cùng nhau nắm tay đi hết đoạn đường đời nhé!' }
  ];

  const loadWishes = () => {
    if (!wishesList) return;
    wishesList.innerHTML = '';
    
    let storedWishes = localStorage.getItem(STORAGE_KEY);
    let wishes = [];
    
    if (storedWishes) {
      wishes = JSON.parse(storedWishes);
    } else {
      wishes = defaultWishes;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
    }
    
    if (wishes.length === 0) {
      wishesList.innerHTML = '<div class="no-wishes">Chưa có lời chúc nào. Hãy là người đầu tiên!</div>';
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

  // Load initially
  loadWishes();

  if (wishForm) {
    wishForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const wishName = document.getElementById('wish-name').value.trim();
      const wishText = document.getElementById('wish-text').value.trim();

      if (!wishName || !wishText) return;

      let storedWishes = localStorage.getItem(STORAGE_KEY);
      let wishes = storedWishes ? JSON.parse(storedWishes) : [];
      
      // Save new wish at the beginning
      wishes.unshift({ name: wishName, text: wishText });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));

      // Reload
      loadWishes();

      // Smooth scroll wishes list back to the top
      wishesList.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // Clear fields
      wishForm.reset();
      
      // Visual feedback popup
      showCustomAlert('Lời chúc mừng ngọt ngào của bạn đã được gửi thành công!', 'Gửi Lời Chúc Thành Công');
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

    // Close on overlay click
    giftModal.addEventListener('click', (e) => {
      if (e.target === giftModal) {
        giftModal.classList.remove('open');
      }
    });
  }

  // Intercept Lưu QR click for custom visual feedback
  const saveQrBtns = document.querySelectorAll('.btn-save-qr');
  saveQrBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Allow browser default download to proceed, but display notification
      const owner = btn.closest('.bank-card').querySelector('.bank-card-header').innerText;
      setTimeout(() => {
        showCustomAlert(`Mã QR tài khoản mừng cưới (${owner}) đang được tải xuống thiết bị của bạn.`, 'Lưu QR Code Thành Công');
      }, 300);
    });
  });

  // --- Photo Lightbox Popup Navigation System ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxIndex = document.getElementById('lightbox-index');

  const photosList = [
    '../../../assets/images/template-17/photo1.jpg',
    '../../../assets/images/template-17/photo2.jpg',
    '../../../assets/images/template-17/photo3.jpg',
    '../../../assets/images/template-17/photo4.jpg',
    '../../../assets/images/template-17/photo5.jpg'
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

  // Keyboard navigation for lightbox
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
      background: rgba(92, 69, 65, 0.7);
      backdrop-filter: blur(2px);
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
      border-radius: 16px;
      width: 85%;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 15px 35px rgba(157, 109, 99, 0.2);
      border: 1px solid var(--color-border);
      transform: scale(0.9);
      transition: transform 0.3s ease;
    `;

    const alertTitle = document.createElement('h3');
    alertTitle.innerText = title;
    alertTitle.style.cssText = `
      margin-bottom: 0.8rem;
      color: var(--color-primary);
      font-family: 'Playfair Display', serif;
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
      background: var(--color-primary);
      color: #ffffff;
      border: none;
      padding: 0.65rem 2.6rem;
      border-radius: 20px;
      font-family: 'Lora', serif;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(157, 109, 99, 0.25);
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

    // Fade in
    setTimeout(() => {
      alertOverlay.style.opacity = '1';
      alertBox.style.transform = 'scale(1)';
    }, 50);
  }
});
