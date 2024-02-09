var MARKERS_MAX = 4;
var markers = 0;

var map = L.map("map").setView([47.64332055551951, 237.80129313468936], 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(
  map,
);
map.attributionControl.setPrefix(false);

// a layer group, used here like a container for markers
var markersGroup = L.layerGroup();
map.addLayer(markersGroup);

const points = [];
map.on("click", function (e) {
  //var marker = L.marker(e.latlng).addTo(markersGroup);

  points[markers] = L.marker(e.latlng);
  markers++;
  console.log(L.marker(e.latlng));
  /*const datastuff = points[markers];

  const data = {
    datastuff,
  };

  const jsonData = JSON.stringify(data);

  const url = "/auth/signup";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: jsonData,
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      }
    })
    .catch((error) => console.error("Error:", error));
  return;*/
});

let pointsP;
fetch("/database/points", {
  method: "GET",
})
  .then((response) => response.json())
  .then((data) => {
    pointsP = data;
    console.log(pointsP);
    stuff2();
  })
  .catch((error) => console.log(error("Error:", error)));

function stuff() {
  for (let i = 0; i < points.length; i++) {
    var marker = points[i].addTo(markersGroup);
  }
}

function stuff2() {
  for (let i = 0; i < pointsP.length; i++) {
    var marker = pointsP[i].addTo(markersGroup);
  }
}

var marker = L.marker([47.64332055551951, 237.80129313468936]).addTo(map);
var popup = marker.bindPopup("Eastside Preparatory School<br />Go eagles!");
// .openPopup();
// script.js
/*
// Define an array to store events
let events = [];

console.log(eventsP);

// letiables to store event input fields and reminder list
let eventDateInput = document.getElementById("eventDate");
let eventTimeInput = document.getElementById("eventTime");
let eventTitleInput = document.getElementById("eventTitle");
let eventDescriptionInput = document.getElementById("eventDescription");
let reminderList = document.getElementById("reminderList");

// Counter to generate unique event IDs
let eventIdCounter = 1;

// Function to add events
function addEvent() {
  let date = eventDateInput.value;
  let time = eventTimeInput.value;
  let title = eventTitleInput.value;
  let description = eventDescriptionInput.value;

  if (date && title) {
    // Create a unique event ID
    let eventId = eventIdCounter++;
    var hours = time.substring(0, 2);
    var minutes = time.substring(3, 5);
    if (hours > 12) {
      hours -= 12;

      time = hours + ":" + minutes + " PM";
    } else {
      time = time + " AM";
    }
    events.push({
      id: eventId,
      date: date,
      time: time,
      title: title,
      description: description,
    });

    const event = {
      id: eventId,
      date: date,
      time: time,
      title: title,
      description: description,
    };

    const url = "/event";

    const jsonData = JSON.stringify(event);

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonData,
    })
      .then((response) => {
        if (response.redirected) {
          window.location.href = response.url;
        }
      })
      .catch((error) => console.log(error("Error:", error)));

    showCalendar(currentMonth, currentYear, time);
    eventDateInput.value = "";
    eventTimeInput.value = "";
    eventTitleInput.value = "";
    eventDescriptionInput.value = "";
    displayReminders();
  }
}

// Function to delete an event by ID
function deleteEvent(eventId) {
  // Find the index of the event with the given ID
  let eventIndex = events.findIndex((event) => event.id === eventId);

  if (eventIndex !== -1) {
    // Remove the event from the events array
    events.splice(eventIndex, 1);
    showCalendar(currentMonth, currentYear);
    displayReminders();
  }
}

// Function to display reminders
function displayReminders() {
  reminderList.innerHTML = "";
  for (let i = 0; i < events.length; i++) {
    let event = events[i];
    let eventDate = new Date(event.date);
    if (
      eventDate.getMonth() === currentMonth &&
      eventDate.getFullYear() === currentYear
    ) {
      let listItem = document.createElement("li");
      listItem.innerHTML = `<strong>${event.title}</strong> - 
            ${event.description} at ${event.time} on 
            ${eventDate.toLocaleDateString()} `;

      // Add a delete button for each reminder item
      let deleteButton = document.createElement("button");
      deleteButton.className = "delete-event";
      deleteButton.textContent = "Delete";
      deleteButton.onclick = function () {
        deleteEvent(event.id);
      };

      let seeButton = document.createElement("button");
      seeButton.className = "see-event";
      seeButton.textContent = "See who's registered";
      seeButton.onclick = function () {
        // seeButton function
      };

      listItem.appendChild(deleteButton);
      listItem.appendChild(seeButton);
      reminderList.appendChild(listItem);
    }
  }
}

// Function to generate a range of
// years for the year select input
function generate_year_range(start, end) {
  let years = "";
  for (let year = start; year <= end; year++) {
    years += "<option value='" + year + "'>" + year + "</option>";
  }
  return years;
}

// Initialize date-related letiables
today = new Date();
currentMonth = today.getMonth();
currentYear = today.getFullYear();
selectYear = document.getElementById("year");
selectMonth = document.getElementById("month");

createYear = generate_year_range(1970, 2050);

document.getElementById("year").innerHTML = createYear;

let calendar = document.getElementById("calendar");

let months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

$dataHead = "<tr>";
for (dhead in days) {
  $dataHead += "<th data-days='" + days[dhead] + "'>" + days[dhead] + "</th>";
}
$dataHead += "</tr>";

document.getElementById("thead-month").innerHTML = $dataHead;

monthAndYear = document.getElementById("monthAndYear");
showCalendar(currentMonth, currentYear);

// Function to navigate to the next month
function next() {
  currentYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  currentMonth = (currentMonth + 1) % 12;
  showCalendar(currentMonth, currentYear);
}

// Function to navigate to the previous month
function previous() {
  currentYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  currentMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  showCalendar(currentMonth, currentYear);
}

// Function to jump to a specific month and year
function jump() {
  currentYear = parseInt(selectYear.value);
  currentMonth = parseInt(selectMonth.value);
  showCalendar(currentMonth, currentYear);
}

// Function to display the calendar
function showCalendar(month, year) {
  let firstDay = new Date(year, month, 1).getDay();
  tbl = document.getElementById("calendar-body");
  tbl.innerHTML = "";
  monthAndYear.innerHTML = months[month] + " " + year;
  selectYear.value = year;
  selectMonth.value = month;

  let date = 1;
  for (let i = 0; i < 6; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < firstDay) {
        cell = document.createElement("td");
        cellText = document.createTextNode("");
        cell.appendChild(cellText);
        row.appendChild(cell);
      } else if (date > daysInMonth(month, year)) {
        break;
      } else {
        cell = document.createElement("td");
        cell.setAttribute("data-date", date);
        cell.setAttribute("data-month", month + 1);
        cell.setAttribute("data-year", year);
        cell.setAttribute("data-month_name", months[month]);
        cell.className = "date-picker";
        cell.innerHTML = "<span>" + date + "</span";

        if (
          date === today.getDate() &&
          year === today.getFullYear() &&
          month === today.getMonth()
        ) {
          cell.className = "date-picker selected";
        }

        // Check if there are events on this date
        if (hasEventOnDate(date, month, year)) {
          cell.classList.add("event-marker");
          cell.appendChild(createEventTooltip(date, month, year, event.time));
        }

        row.appendChild(cell);
        date++;
      }
    }
    tbl.appendChild(row);
  }

  displayReminders();
}

// Function to create an event tooltip
function createEventTooltip(date, month, year, time) {
  let tooltip = document.createElement("div");
  tooltip.className = "event-tooltip";
  let eventsOnDate = getEventsOnDate(date, month, year, time);
  for (let i = 0; i < eventsOnDate.length; i++) {
    let event = eventsOnDate[i];
    let eventDate = new Date(event.date);
    let eventText = `<strong>${event.title}</strong> - 
            ${event.description} at ${event.time} on 
            ${eventDate.toLocaleDateString()}`;
    let eventElement = document.createElement("p");
    eventElement.innerHTML = eventText;
    tooltip.appendChild(eventElement);
  }
  return tooltip;
}

// Function to get events on a specific date
function getEventsOnDate(date, month, year, time) {
  return events.filter(function (event) {
    let eventDate = new Date(event.date);
    return (
      eventDate.getDate() === date &&
      eventDate.getMonth() === month &&
      eventDate.getFullYear() === year
    );
  });
}

// Function to check if there are events on a specific date
function hasEventOnDate(date, month, year) {
  return getEventsOnDate(date, month, year).length > 0;
}

// Function to get the number of days in a month
function daysInMonth(iMonth, iYear) {
  return 32 - new Date(iYear, iMonth, 32).getDate();
}

// Call the showCalendar function initially to display the calendar
showCalendar(currentMonth, currentYear);
*/
