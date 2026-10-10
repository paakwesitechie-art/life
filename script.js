
const menuToggle = document.querySelector("#menu-toggle");
const nav = document.querySelector("#nav");
const bookingForm = document.querySelector("#booking-form");
const serviceSelect = document.querySelector("#service");
const dateInput = document.querySelector("#booking-date");
const timeSelect = document.querySelector("#booking-time");
const formMessage = document.querySelector("#form-message");

// Mobile navigation
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    });
  });
}


// Current year in footer
document.querySelector("#year").textContent =
  new Date().getFullYear();

// Set today's date as the earliest selectable date
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = new Date();
dateInput.min = getLocalDateString(today);

// Preselect a service from the service cards
document.querySelectorAll(".service-book").forEach((button) => {
  button.addEventListener("click", () => {
    serviceSelect.value = button.dataset.service;

    document.querySelector("#booking").scrollIntoView({
      behavior: "smooth"
    });
  });
});

// Update available times for the selected date

function updateAvailableTimes() {
  const selectedDate = dateInput.value;
  const now = new Date();
  const todayString = getLocalDateString(now);

  // Reset every time option first
  Array.from(timeSelect.options).forEach((option, index) => {
    if (index !== 0) {
      option.disabled = false;
    }
  });

  if (!selectedDate) {
    timeSelect.value = "";
    return;
  }

  // Demo opening days: Monday to Saturday
  const selectedDay = new Date(
    `${selectedDate}T12:00:00`
  ).getDay();

  if (selectedDay === 0) {
    Array.from(timeSelect.options).forEach((option, index) => {
      if (index !== 0) {
        option.disabled = true;
      }
    });

    timeSelect.value = "";
    formMessage.textContent =
      "We're closed on Sundays. Please choose another date.";
    formMessage.className = "form-message error";
    return;
  }

  formMessage.textContent = "";
  formMessage.className = "form-message";

  // Disable past time slots when the selected date is today
  if (selectedDate === todayString) {
    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    Array.from(timeSelect.options).forEach((option, index) => {
      if (index === 0) return;

      const [hours, minutes] = option.value.split(":").map(Number);
      const slotMinutes = hours * 60 + minutes;

      if (slotMinutes <= currentMinutes) {
        option.disabled = true;
      }
    });
  }

  // Clear a previously selected time if it is no longer available
  if (
    timeSelect.selectedOptions[0] &&
    timeSelect.selectedOptions[0].disabled
  ) {
    timeSelect.value = "";
  }
}

  // Demo opening days: Monday through Saturday
  if (selectedDay === 0) {
    Array.from(timeSelect.options).forEach((option, index) => {
      if (index !== 0) option.disabled = true;
    });

    timeSelect.value = "";
    return;
  }

  // Hide past time slots when booking for today
  if (selectedDate === getLocalDateString(new Date())) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    Array.from(timeSelect.options).forEach((option, index) => {
      if (index === 0) return;

      const [hours, minutes] = option.value.split(":").map(Number);
      const slotMinutes = hours * 60 + minutes;

      if (slotMinutes <= currentMinutes) {
        option.disabled = true;
      }
    });

    if (
      timeSelect.selectedOptions[0] &&
      timeSelect.selectedOptions[0].disabled
    ) {
      timeSelect.value = "";
    }
  }
}

dateInput.addEventListener("change", updateAvailableTimes);

// Make a demo booking
bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  formMessage.textContent = "";
  formMessage.className = "form-message";

  if (!bookingForm.reportValidity()) return;

  const formData = new FormData(bookingForm);

  const appointment = {
    id: `VB-${Date.now()}`,
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    phone: formData.get("phone").trim(),
    service: formData.get("service"),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes").trim(),
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  if (
    !appointment.name ||
    !appointment.email ||
    !appointment.phone
  ) {
    formMessage.textContent =
      "Please complete all required fields.";
    formMessage.classList.add("error");
    return;
  }

  if (appointment.date < getLocalDateString(new Date())) {
    formMessage.textContent =
      "Please select today or a future date.";
    formMessage.classList.add("error");
    return;
  }

  if (
    appointment.date === getLocalDateString(new Date()) &&
    appointment.time <=
      `${String(new Date().getHours()).padStart(2, "0")}:${String(
        new Date().getMinutes()
      ).padStart(2, "0")}`
  ) {
    formMessage.textContent =
      "That time has passed. Please choose a later time.";
    formMessage.classList.add("error");
    return;
  }

  // This is local demo storage, not a live booking server.
  try {
    const saved = JSON.parse(
      localStorage.getItem("velibook-appointments") || "[]"
    );

    const alreadyBooked = saved.some((item) =>
      item.date === appointment.date &&
      item.time === appointment.time
    );

    if (alreadyBooked) {
      formMessage.textContent =
        "That time is already reserved in this browser demo. Please choose another.";
      formMessage.classList.add("error");
      return;
    }

    saved.push(appointment);

    localStorage.setItem(
      "velibook-appointments",
      JSON.stringify(saved)
    );

    formMessage.textContent =
      `Appointment request saved! Reference: ${appointment.id}. ` +
      "This is a demo confirmation, not a real salon booking.";

    formMessage.classList.add("success");
    bookingForm.reset();
    updateAvailableTimes();

  } catch (error) {
    formMessage.textContent =
      "We couldn't save your demo booking. Please check browser storage and try again.";
    formMessage.classList.add("error");
  }
});

updateAvailableTimes();