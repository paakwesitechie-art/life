
const STORAGE_KEY = "velibook-appointments";

const appointmentsBody = document.querySelector("#appointments-body");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#booking-search");
const statusFilter = document.querySelector("#status-filter");
const dateFilter = document.querySelector("#date-filter");
const resultsCount = document.querySelector("#results-count");
const tableWrap = document.querySelector(".table-wrap");

let appointments = [];

function loadAppointments() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    appointments = Array.isArray(saved)
      ? saved.filter((item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string"
        )
      : [];
  } catch {
    appointments = [];
  }

  renderDashboard();
}

function saveAppointments() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    return true;
  } catch {
    alert("Could not save changes. Please check browser storage.");
    return false;
  }
}

function updateStats() {
  document.querySelector("#stat-total").textContent =
    appointments.length;

  document.querySelector("#stat-pending").textContent =
    appointments.filter((item) => item.status === "Pending").length;

  document.querySelector("#stat-confirmed").textContent =
    appointments.filter((item) => item.status === "Confirmed").length;

  document.querySelector("#stat-cancelled").textContent =
    appointments.filter((item) => item.status === "Cancelled").length;
}

function formatDate(dateString) {
  if (!dateString) return "Date not set";

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function makeCell(text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text || "—";

  if (className) cell.className = className;

  return cell;
}

function makeActionButton(label, action, appointmentId, className) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = appointmentId;
  button.className = className;

  return button;
}

function getFilteredAppointments() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedDate = dateFilter.value;

  return appointments
    .filter((item) => {
      const searchableText = [
        item.name,
        item.email,
        item.phone,
        item.service,
        item.id
      ].join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const matchesStatus =
        selectedStatus === "all" || item.status === selectedStatus;
      const matchesDate =
        !selectedDate || item.date === selectedDate;

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      const dateA = `${a.date || ""} ${a.time || ""}`;
      const dateB = `${b.date || ""} ${b.time || ""}`;

      return dateB.localeCompare(dateA);
    });
}

function renderDashboard() {
  updateStats();

  const filtered = getFilteredAppointments();

  appointmentsBody.replaceChildren();

  resultsCount.textContent =
    `${filtered.length} appointment${filtered.length === 1 ? "" : "s"}`;

  emptyState.hidden = filtered.length !== 0;
  tableWrap.hidden = filtered.length === 0;

  filtered.forEach((appointment) => {
    const row = document.createElement("tr");

    const clientCell = document.createElement("td");
    const clientName = document.createElement("strong");
    const clientEmail = document.createElement("span");
    const reference = document.createElement("small");

    clientName.className = "client-name";
    clientName.textContent = appointment.name;

    clientEmail.className = "client-email";
    clientEmail.textContent = appointment.email || "No email provided";

    reference.className = "client-reference";
    reference.textContent = appointment.id;

    clientCell.append(clientName, clientEmail, reference);

    row.append(
      clientCell,
      makeCell(appointment.service),
      makeCell(
        `${formatDate(appointment.date)} · ${appointment.time || "No time"}`
      )
    );

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");

    const allowedStatuses = ["Pending", "Confirmed", "Cancelled"];
    const status = allowedStatuses.includes(appointment.status)
      ? appointment.status
      : "Pending";

    statusBadge.className =
      `status-badge status-${status.toLowerCase()}`;
    statusBadge.textContent = status;
    statusCell.append(statusBadge);

    row.append(statusCell);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");

    actions.className = "row-actions";

    if (status === "Pending") {
      actions.append(
        makeActionButton(
          "Confirm",
          "confirm",
          appointment.id,
          "action-confirm"
        )
      );
    }

    if (status !== "Cancelled") {
      actions.append(
        makeActionButton(
          "Cancel",
          "cancel",
          appointment.id,
          "action-cancel"
        )
      );
    }

    actions.append(
      makeActionButton(
        "Delete",
        "delete",
        appointment.id,
        "action-delete"
      )
    );

    actionsCell.append(actions);
    row.append(actionsCell);

    appointmentsBody.append(row);
  });
}

appointmentsBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const { action, id } = button.dataset;
  const appointment = appointments.find((item) => item.id === id);

  if (!appointment) return;

  if (action === "confirm") {
    appointment.status = "Confirmed";
  } else if (action === "cancel") {
    appointment.status = "Cancelled";
  } else if (action === "delete") {
    const approved = confirm(
      `Permanently delete the demo booking for ${appointment.name}?`
    );

    if (!approved) return;

    appointments = appointments.filter((item) => item.id !== id);
  } else {
    return;
  }

  if (saveAppointments()) {
    renderDashboard();
  }
});

searchInput.addEventListener("input", renderDashboard);
statusFilter.addEventListener("change", renderDashboard);
dateFilter.addEventListener("change", renderDashboard);

document.querySelector("#refresh-bookings").addEventListener(
  "click",
  loadAppointments
);

document.querySelector("#clear-filters").addEventListener("click", () => {
  searchInput.value = "";
  statusFilter.value = "all";
  dateFilter.value = "";

  renderDashboard();
});

document.querySelector("#today-date").textContent =
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date());

loadAppointments();