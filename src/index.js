const BASE_URL = "https://my-app-backend-zysq.onrender.com";

document.addEventListener('DOMContentLoaded', function() {
    // Navigation and Scroll Handling
    const navItems = document.querySelectorAll('nav ul li');
    const sections = document.querySelectorAll('section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            gsap.fromTo(this, 
                { scale: 0.9 },
                { scale: 1, duration: 0.3, ease: "back.out(1.7)" }
            );
        });
    });
    
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
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
    });
    
    // Header Animations
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

    // Carousel Initialization
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        const items = document.querySelectorAll('.carousel-item');
        const indicatorsContainer = document.querySelector('.carousel-indicators');
        let currentIndex = 0;
        
        // Create indicators
        items.forEach((_, index) => {
            const indicator = document.createElement('span');
            indicator.addEventListener('click', () => {
                goToSlide(index);
            });
            indicatorsContainer.appendChild(indicator);
        });
        
        // Set first indicator as active
        updateIndicators();
        
        // Auto-rotate carousel
        let interval = setInterval(() => {
            moveSlide(1);
        }, 5000);
        
        // Pause on hover
        const carouselContainer = document.querySelector('.carousel-container');
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(interval);
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            interval = setInterval(() => {
                moveSlide(1);
            }, 5000);
        });
    }

    // Booking Form Handling
    const bookingForm = document.getElementById('Booking');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
        
        // Set minimum date to today
        document.getElementById('checkin').min = new Date().toISOString().split('T')[0];
    }

    // New booking button
    const newBookingBtn = document.getElementById('newBookingBtn');
    if (newBookingBtn) {
        newBookingBtn.addEventListener('click', resetBookingForm);
    }
});

// Navigation Function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    window.scrollTo({
        top: section.offsetTop - 100,
        behavior: 'smooth'
    });
}

// Carousel Functions
function moveSlide(direction) {
    const items = document.querySelectorAll('.carousel-item');
    const totalItems = items.length;
    let currentIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
    
    currentIndex += direction;
    
    if (currentIndex >= totalItems) {
        currentIndex = 0;
    } else if (currentIndex < 0) {
        currentIndex = totalItems - 1;
    }
    
    goToSlide(currentIndex);
}

function goToSlide(index) {
    const carousel = document.querySelector('.carousel');
    const items = document.querySelectorAll('.carousel-item');
    const indicators = document.querySelectorAll('.carousel-indicators span');
    
    items.forEach(item => item.classList.remove('active'));
    items[index].classList.add('active');
    
    indicators.forEach(indicator => indicator.classList.remove('active'));
    indicators[index].classList.add('active');
    
    carousel.style.transform = `translateX(-${index * 100}%)`;
    
    gsap.from(items[index], {
        opacity: 0.5,
        duration: 0.5,
        ease: "power2.out"
    });
}

function updateIndicators() {
    const items = document.querySelectorAll('.carousel-item');
    const indicators = document.querySelectorAll('.carousel-indicators span');
    const currentIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
    
    indicators.forEach(indicator => indicator.classList.remove('active'));
    if (indicators[currentIndex]) {
        indicators[currentIndex].classList.add('active');
    }
}

// Booking Form Functions
function handleBookingSubmit(event) {
    event.preventDefault();
    
    // Form validation
    const requiredFields = ['name', 'email', 'phone', 'destination', 'package', 'checkin', 'duration', 'adults'];
    let isValid = true;
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            element.style.borderColor = '#ddd';
        }
    });
    
    if (!isValid) {
        alert("Please fill out all required fields marked with *");
        return;
    }
    
    // Collect form data
    const formData = {
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
    
    // Save booking
    const booking = saveBooking(formData);
    
    // Display booking confirmation
    showBookingConfirmation(booking);
    
    console.log("Booking saved:", booking);
}

function generateBookingId(destination, date) {
    const prefix = destination.substring(0, 3).toUpperCase();
    const dateStr = date.replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 90) + 10;
    return `${prefix}${dateStr}-${randomNum}`;
}

function saveBooking(formData) {
    // Calculate checkout date
    const checkinDate = new Date(formData.checkin);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + parseInt(formData.duration));
    
    // Create booking object
    const booking = {
        id: generateBookingId(formData.destination, formData.checkin),
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

    // Store in localStorage (replace with server API in production)
    let bookings = JSON.parse(localStorage.getItem('kenyaTravelBookings')) || { bookings: [] };
    bookings.bookings.push(booking);
    localStorage.setItem('kenyaTravelBookings', JSON.stringify(bookings));
    
    return booking;
}

function showBookingConfirmation(booking) {
    // Format dates for display
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const checkinDate = new Date(booking.trip.checkin).toLocaleDateString('en-US', dateOptions);
    const checkoutDate = new Date(booking.trip.checkout).toLocaleDateString('en-US', dateOptions);
    
    // Update feedback section
    document.getElementById("fbName").textContent = booking.customer.name;
    document.getElementById("fbEmail").textContent = booking.customer.email;
    document.getElementById("fbDestination").textContent = booking.trip.destination;
    document.getElementById("fbDestination2").textContent = booking.trip.destination;
    document.getElementById("fbPackage").textContent = booking.trip.package;
    document.getElementById("fbCheckin").textContent = checkinDate;
    document.getElementById("fbCheckout").textContent = checkoutDate;
    document.getElementById("fbDuration").textContent = booking.trip.duration;
    document.getElementById("fbTravelers").textContent = 
        `${booking.trip.travelers.adults} adult${booking.trip.travelers.adults > 1 ? 's' : ''}${
            booking.trip.travelers.children > 0 ? `, ${booking.trip.travelers.children} child${booking.trip.travelers.children > 1 ? 'ren' : ''}` : ''}`;
    document.getElementById("fbAccommodation").textContent = booking.trip.accommodation;
    
    // Show feedback and hide form
    document.getElementById("Booking").style.display = "none";
    document.getElementById("bookingFeedback").style.display = "block";
    document.getElementById("bookingFeedback").scrollIntoView({ behavior: 'smooth' });
}

function resetBookingForm() {
    document.getElementById("Booking").reset();
    document.getElementById("Booking").style.display = "block";
    document.getElementById("bookingFeedback").style.display = "none";
    document.getElementById("Booking").scrollIntoView({ behavior: 'smooth' });
}

