const BASE_URL = "https://my-app-backend-zysq.onrender.com/api";

class BookingSystem {
  constructor() {
    this.bookings = [];
    this.init();
  }

  async init() {
    this.setupNavigation();
    this.initAnimations();
    this.initCarousel();
    this.setupBookingForm();
    await this.loadBookings();
    this.setupOfflineSync();
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('nav ul li');
    const sections = document.querySelectorAll('section');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.animateNavItem(item);
      });
    });
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        if (pageYOffset >= (section.offsetTop - 200)) {
          current = section.getAttribute('id');
        }
      });
      navItems.forEach(item => {
        item.classList.remove('active');
        if (
          item.querySelector('button')
            .getAttribute('onclick')
            ?.includes(current)
        ) {
          item.classList.add('active');
        }
      });
    });
  }

  animateNavItem(item) {
    gsap.fromTo(item, 
      { scale: 0.9 },
      { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  }

  initAnimations() {
    gsap.from(".agency-name", { y: -50, opacity: 0, duration: 1, ease: "power2.out" });
    gsap.from(".tagline", { y: 20, opacity: 0, duration: 1, delay: 0.3, ease: "power2.out" });
  }

  initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;
    this.carouselItems = document.querySelectorAll('.carousel-item');
    this.indicatorsContainer = document.querySelector('.carousel-indicators');
    this.currentIndex = 0;
    this.carouselItems.forEach((_, index) => {
      const indicator = document.createElement('span');
      indicator.addEventListener('click', () => this.goToSlide(index));
      this.indicatorsContainer.appendChild(indicator);
    });
    this.goToSlide(0);
    this.startCarouselInterval();
    const carouselContainer = document.querySelector('.carousel-container');
    carouselContainer.addEventListener('mouseenter', () => clearInterval(this.carouselInterval));
    carouselContainer.addEventListener('mouseleave', () => this.startCarouselInterval());
  }

  startCarouselInterval() {
    this.carouselInterval = setInterval(() => this.moveSlide(1), 5000);
  }

  moveSlide(direction) {
    const totalItems = this.carouselItems.length;
    this.currentIndex = (this.currentIndex + direction + totalItems) % totalItems;
    this.goToSlide(this.currentIndex);
  }

  goToSlide(index) {
    this.currentIndex = index;
    this.carouselItems.forEach(item => item.classList.remove('active'));
    this.carouselItems[index].classList.add('active');
    const indicators = this.indicatorsContainer.querySelectorAll('span');
    indicators.forEach(indicator => indicator.classList.remove('active'));
    indicators[index].classList.add('active');
    document.querySelector('.carousel').style.transform = `translateX(-${index * 100}%)`;
    gsap.from(this.carouselItems[index], { opacity: 0.5, duration: 0.5, ease: "power2.out" });
  }

  setupBookingForm() {
    const bookingForm = document.getElementById('Booking');
    if (!bookingForm) return;
    document.getElementById('checkin').min = new Date().toISOString().split('T')[0];
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleBookingSubmit();
    });
    const newBookingBtn = document.getElementById('newBookingBtn');
    if (newBookingBtn) {
      newBookingBtn.addEventListener('click', () => this.resetBookingForm());
    }
  }

  async handleBookingSubmit() {
    const formData = this.getFormData();
    if (!this.validateForm(formData)) return;
    this.displayLocalBookingFeedback(formData);
    try {
      const booking = await this.createBooking(formData);
      this.showBookingConfirmation(booking);
      await this.loadBookings();
    } catch (error) {
      alert("Failed to save booking. Please try again.");
    }
  }

  getFormData() {
    return {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      destination: document.getElementById("destination").value,
      package: document.getElementById("package").value,
      checkin: document.getElementById("checkin").value,
      duration: document.getElementById("duration").value,
      adults: document.getElementById("adults").value,
      children: document.getElementById("children").value || 0,
      accommodation: document.getElementById("accommodation").value,
      requests: document.getElementById("requests").value
    };
  }

  validateForm(formData) {
    const requiredFields = ['name', 'email', 'phone', 'destination', 'package', 'checkin', 'duration', 'adults'];
    let isValid = true;
    requiredFields.forEach(field => {
      const element = document.getElementById(field);
      if (!formData[field]) {
        element.style.borderColor = '#e74c3c';
        isValid = false;
      } else {
        element.style.borderColor = '#ddd';
      }
    });
    if (!isValid) alert("Please fill out all required fields marked with *");
    return isValid;
  }

  displayLocalBookingFeedback(formData) {
    const checkinDate = new Date(formData.checkin);
    const durationNum = parseInt(formData.duration, 10);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkinDate.getDate() + durationNum);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById("fbName").textContent = formData.name;
    document.getElementById("fbEmail").textContent = formData.email;
    document.getElementById("fbDestination").textContent = formData.destination;
    document.getElementById("fbDestination2").textContent = formData.destination;
    document.getElementById("fbPackage").textContent = formData.package;
    document.getElementById("fbCheckin").textContent = checkinDate.toLocaleDateString('en-US', dateOptions);
    document.getElementById("fbCheckout").textContent = checkoutDate.toLocaleDateString('en-US', dateOptions);
    document.getElementById("fbDuration").textContent = durationNum;
    const adults = parseInt(formData.adults, 10);
    const children = parseInt(formData.children, 10);
    document.getElementById("fbTravelers").textContent =
      `${adults} adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}`;
    const accomSelect = document.getElementById("accommodation");
    const accomText = accomSelect.options[accomSelect.selectedIndex].text;
    document.getElementById("fbAccommodation").textContent = accomText;
    document.getElementById("Booking").style.display = "none";
    document.getElementById("bookingFeedback").style.display = "block";
    document.getElementById("bookingFeedback").scrollIntoView({ behavior: 'smooth' });
  }

  async createBooking(formData) {
    const checkinDate = new Date(formData.checkin);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkinDate.getDate() + parseInt(formData.duration));
    const booking = {
      id: this.generateBookingId(formData.destination, formData.checkin),
      timestamp: new Date().toISOString(),
      customer: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      },
      trip: {
        destination: formData.destination,
        package: formData.package,
        checkin: formData.checkin,
        checkout: checkoutDate.toISOString().split('T')[0],
        duration: parseInt(formData.duration),
        travelers: {
          adults: parseInt(formData.adults),
          children: parseInt(formData.children) || 0
        },
        accommodation: formData.accommodation || 'Not specified'
      },
      specialRequests: formData.requests || 'None',
      status: "pending",
      paymentStatus: "unpaid"
    };
    const response = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking)
    });
    if (!response.ok) throw new Error('Server rejected booking');
    const savedBooking = await response.json();
    this.saveToLocalStorage(savedBooking);
    return savedBooking;
  }

  saveToLocalStorage(booking) {
    let bookingsData = JSON.parse(localStorage.getItem('kenyaTravelBookings')) || {
      bookings: [],
      lastSynced: null
    };
    if (!booking.id) booking.id = `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    if (!booking.timestamp) booking.timestamp = new Date().toISOString();
    bookingsData.bookings.push(booking);
    localStorage.setItem('kenyaTravelBookings', JSON.stringify(bookingsData));
    return booking;
  }

  async loadBookings() {
    try {
      const response = await fetch(`${BASE_URL}/bookings`);
      if (!response.ok) throw new Error('Failed to load bookings');
      this.bookings = await response.json();
      const localData = JSON.parse(localStorage.getItem('kenyaTravelBookings')) || { bookings: [] };
      const offlineBookings = localData.bookings.filter(b => b.isOffline);
      offlineBookings.forEach(offlineBooking => {
        if (!this.bookings.some(b => b.id === offlineBooking.id)) {
          this.bookings.push(offlineBooking);
        }
      });
      this.renderBookings();
    } catch (error) {
      const localData = JSON.parse(localStorage.getItem('kenyaTravelBookings')) || { bookings: [] };
      this.bookings = localData.bookings;
      this.renderBookings();
    }
  }

  renderBookings() {
    const container = document.getElementById('bookings-container');
    if (!container) return;
    container.innerHTML = this.bookings.map(booking => `
      <div class="booking-card ${booking.isOffline ? 'offline' : ''}">
        <h3>${booking.trip.destination} - ${booking.trip.package}</h3>
        <p><strong>Name:</strong> ${booking.customer.name}</p>
        <p><strong>Dates:</strong> ${booking.trip.checkin} to ${booking.trip.checkout}</p>
        <p><strong>Status:</strong> <span class="status-${booking.status}">${booking.status}</span>
          ${booking.isOffline ? '(Offline - will sync when online)' : ''}</p>
      </div>
    `).join('');
  }

  showBookingConfirmation(booking) {
    if (booking.isOffline) {
      document.getElementById("bookingFeedback").innerHTML += `
        <p class="offline-notice">Your booking will be synced with our servers when you're back online.</p>
      `;
    }
  }

  resetBookingForm() {
    document.getElementById("Booking").reset();
    document.getElementById("Booking").style.display = "block";
    document.getElementById("bookingFeedback").style.display = "none";
    document.getElementById("Booking").scrollIntoView({ behavior: 'smooth' });
  }

  setupOfflineSync() {
    window.addEventListener('online', () => this.syncOfflineBookings());
    if (navigator.onLine) this.syncOfflineBookings();
  }

  async syncOfflineBookings() {
    const localData = JSON.parse(localStorage.getItem('kenyaTravelBookings')) || { bookings: [] };
    const offlineBookings = localData.bookings.filter(b => b.isOffline);
    if (offlineBookings.length === 0) return;
    try {
      for (const booking of offlineBookings) {
        const response = await fetch(`${BASE_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        });
        if (response.ok) {
          const index = localData.bookings.findIndex(b => b.id === booking.id);
          if (index !== -1) delete localData.bookings[index].isOffline;
        }
      }
      localStorage.setItem('kenyaTravelBookings', JSON.stringify(localData));
      await this.loadBookings();
    } catch (error) {}
  }

  generateBookingId(destination, date) {
    const prefix = destination.substring(0, 3).toUpperCase();
    const dateStr = date.replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 90) + 10;
    return `${prefix}${dateStr}-${randomNum}`;
  }

  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    window.scrollTo({
      top: section.offsetTop - 100,
      behavior: 'smooth'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.bookingSystem = new BookingSystem();
});
