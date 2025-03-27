const BASE_URL = "https://my-app-backend-zysq.onrender.com";

// Main Application Class
class KenyaTravelApp {
  constructor() {
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.initAnimations();
    this.initCarousel();
    await this.loadBookings();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('nav ul li').forEach(item => {
      item.addEventListener('click', () => this.handleNavClick(item));
    });

    window.addEventListener('scroll', () => this.updateActiveNav());

    // Booking Form
    const bookingForm = document.getElementById('Booking');
    if (bookingForm) {
      bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleBookingSubmit();
      });

      // Set minimum date to today
      document.getElementById('checkin').min = new Date().toISOString().split('T')[0];
    }

    // New booking button
    document.getElementById('newBookingBtn')?.addEventListener('click', () => this.resetBookingForm());
  }

  // Navigation Methods
  handleNavClick(item) {
    document.querySelectorAll('nav ul li').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    this.animateNavItem(item);
  }

  animateNavItem(item) {
    gsap.fromTo(item, 
      { scale: 0.9 },
      { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  }

  updateActiveNav() {
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('nav ul li');
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (pageYOffset >= (sectionTop - 200)) {
        current = section.getAttribute('id');
      }
    });
    
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.querySelector('button').getAttribute('onclick').includes(current)) {
        item.classList.add('active');
      }
    });
  }

  // Animation Methods
  initAnimations() {
    gsap.from(".agency-name", {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: "power2.out"
    });

    gsap.from(".tagline", {
      y: 20,
      opacity: 0,
      duration: 1,
      delay: 0.3,
      ease: "power2.out"
    });
  }

  // Carousel Methods
  initCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;
    
    this.carouselItems = document.querySelectorAll('.carousel-item');
    this.indicatorsContainer = document.querySelector('.carousel-indicators');
    this.currentIndex = 0;
    
    // Create indicators
    this.carouselItems.forEach((_, index) => {
      const indicator = document.createElement('span');
      indicator.addEventListener('click', () => this.goToSlide(index));
      this.indicatorsContainer.appendChild(indicator);
    });
    
    // Initialize
    this.goToSlide(0);
    this.startCarouselInterval();
    
    // Pause on hover
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
    
    gsap.from(this.carouselItems[index], {
      opacity: 0.5,
      duration: 0.5,
      ease: "power2.out"
    });
  }

  // Booking Methods
  async loadBookings() {
    try {
      const response = await fetch(`${BASE_URL}/bookings`);
      if (!response.ok) throw new Error('Failed to load bookings');
      this.bookings = await response.json();
      console.log('Bookings loaded:', this.bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      // Fallback to localStorage
      this.bookings = JSON.parse(localStorage.getItem('kenyaTravelBookings')) || { bookings: [] };
    }
  }

  async handleBookingSubmit() {
    const formData = this.getFormData();
    if (!this.validateForm(formData)) return false;
    
    try {
      const booking = await this.createBooking(formData);
      this.showBookingConfirmation(booking);
      return true;
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to save booking. Please try again.");
      return false;
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
    
    if (!isValid) {
      alert("Please fill out all required fields marked with *");
    }
    return isValid;
  }

  async createBooking(formData) {
    const checkinDate = new Date(formData.checkin);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + parseInt(formData.duration));
    
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

    try {
      const response = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking)
      });

      if (!response.ok) throw new Error('Server rejected booking');
      const savedBooking = await response.json();
      
      // Update local bookings
      this.bookings.bookings.push(savedBooking);
      this.saveToLocalStorage();
      
      return savedBooking;
    } catch (error) {
      console.warn("Server save failed, falling back to localStorage", error);
      this.bookings.bookings.push(booking);
      this.saveToLocalStorage();
      return booking;
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('kenyaTravelBookings', JSON.stringify(this.bookings));
  }

  generateBookingId(destination, date) {
    const prefix = destination.substring(0, 3).toUpperCase();
    const dateStr = date.replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 90) + 10;
    return `${prefix}${dateStr}-${randomNum}`;
  }

  showBookingConfirmation(booking) {
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const checkinDate = new Date(booking.trip.checkin).toLocaleDateString('en-US', dateOptions);
    const checkoutDate = new Date(booking.trip.checkout).toLocaleDateString('en-US', dateOptions);
    
    document.getElementById("fbName").textContent = booking.customer.name;
    document.getElementById("fbEmail").textContent = booking.customer.email;
    document.getElementById("fbDestination").textContent = booking.trip.destination;
    document.getElementById("fbPackage").textContent = booking.trip.package;
    document.getElementById("fbCheckin").textContent = checkinDate;
    document.getElementById("fbCheckout").textContent = checkoutDate;
    document.getElementById("fbDuration").textContent = booking.trip.duration;
    document.getElementById("fbTravelers").textContent = 
      `${booking.trip.travelers.adults} adult${booking.trip.travelers.adults > 1 ? 's' : ''}${
        booking.trip.travelers.children > 0 ? `, ${booking.trip.travelers.children} child${booking.trip.travelers.children > 1 ? 'ren' : ''}` : ''}`;
    document.getElementById("fbAccommodation").textContent = booking.trip.accommodation;
    
    document.getElementById("Booking").style.display = "none";
    document.getElementById("bookingFeedback").style.display = "block";
    document.getElementById("bookingFeedback").scrollIntoView({ behavior: 'smooth' });
  }

  resetBookingForm() {
    document.getElementById("Booking").reset();
    document.getElementById("Booking").style.display = "block";
    document.getElementById("bookingFeedback").style.display = "none";
    document.getElementById("Booking").scrollIntoView({ behavior: 'smooth' });
  }

  // Utility Methods
  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    window.scrollTo({
      top: section.offsetTop - 100,
      behavior: 'smooth'
    });
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new KenyaTravelApp();
});