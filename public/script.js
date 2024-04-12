var MARKERS_MAX = 4;
var markers = 0;

var center = [47.64371189816165, -122.19894455582242];
var map = L.map("map").setView(center, 11);
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
  console.log(e.latlng);
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

// var latlngs = [
//   [47.64332055551951, 237.80129313468936],
//   [47.671123312785845, 237.80606227232607]
// ];

// var polyline = L.polyline(latlngs, {color: "#3273dc"}).addTo(map);

let geocode = {};
let carpools;


fetch("/api/events", {
  method: "GET",
})
  .then((response) => response.json())
  .then((data) => {
    events = data;

fetch("/api/userCarpools", {
  method: "GET",
})
  .then((response) => response.json())
  .then((data) => {
    carpools = data;
    console.log(carpools);

    for (let i = 0; i < carpools.length; i++) {
      
      carpools[i].carpoolers.forEach((carpooler) => {
        getAddressCoordinates(carpooler.address);
      });
      var result = events.find(obj => {
        return obj._id === carpools[i].nameOfEvent
      })
      getAddressCoordinates(result.address);
      getAddressCoordinates(carpools[i].wlocation);
    }
    
    function getAddressCoordinates(address) {
      const apiKey = "992ef3d60d434f2283ea8c6d70a4898d"; // Replace 'YOUR_API_KEY' with your actual API key
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        address,
      )}&apiKey=${apiKey}`;

      var request = new Request(url, {
        method: "GET",
        headers: new Headers({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
      });
      fetch(request)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          geocode[address] = [
            data.features[0].bbox[1],
            data.features[0].bbox[0],
          ];
        })
        .catch((error) => {
          console.error(error);
        });
    }
  })
  .catch((error) => console.error("Error:", error));
    })
    .catch((error) => console.error("Error:", error));

var polylines = [];


function add(carpoolId) {
  polylines.forEach(function (item) {
      map.removeLayer(item)
  });
  markersGroup.clearLayers();
  // var marker = L.marker(center).addTo(markersGroup);
  // marker.options.shadowSize = [0, 0];
  // var popup = marker.bindPopup("Eastside Preparatory School<br />Go eagles!");

  const carpool = carpools.find((carpool) => carpool._id === carpoolId);
  var carpoolPoints = []
  carpool.carpoolers.forEach((carpooler) => {
    addPoint(
      carpooler.firstName,
      carpooler.address,
      geocode[carpooler.address],
    );
    carpoolPoints.push(geocode[carpooler.address])
  });
  var result = events.find(obj => {
    return obj._id === carpool.nameOfEvent
  })
 
  if (carpool.route == "route") {
    console.log("route")
    //the creator's address
    var marker = L.marker(geocode[carpool.wlocation]).addTo(markersGroup);
    marker.options.shadowSize = [0, 0];
    var popup = marker.bindPopup(carpool.firstName + "'s house: " + carpool.wlocation);

    //the destination
    var marker = L.marker(geocode[result.address]).addTo(markersGroup);
    marker.options.shadowSize = [0, 0];
    var popup = marker.bindPopup(result.wlocation + "<br>" + result.address);

    carpoolPoints.push(geocode[carpool.wlocation])
    homeHomeLines(carpoolPoints, geocode[result.address])
  }
    
  else if (carpool.route == "point") {
    console.log("point")
    //the meeting point address
    var marker = L.marker(geocode[carpool.wlocation]).addTo(markersGroup);
    marker.options.shadowSize = [0, 0];
    var popup = marker.bindPopup("Meeting point<br>" + carpool.wlocation);

    //the destination
    var marker = L.marker(geocode[result.address]).addTo(markersGroup);
    marker.options.shadowSize = [0, 0];
    var popup = marker.bindPopup(result.wlocation + "<br> " + result.address);

    commonPointLines(geocode[carpool.wlocation], carpoolPoints, geocode[result.address])
  }

  function distance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2),
    );
  }

  function sortByProximity(arrays, target) {
    return arrays.sort((arr1, arr2) => {
      const distance1 = distance(arr1, target);
      const distance2 = distance(arr2, target);
      console.log(distance1, distance2)
      return distance2 - distance1;
    });
  }

  function commonPointLines(point, addresses, destination) {
    for (var i = 0; i < addresses.length; i++) {
      var latlngs = [point, addresses[i]];
      var toPoint = L.polyline(latlngs, {
        color: "#3273dc",
        dashArray: "4 8",
      }).addTo(map);
       polylines.push(toPoint);
    }
    var toDest = L.polyline([point, destination], { color: "#00d1b2" }).addTo(
      map,
    );
    polylines.push(toDest);
    map.fitBounds(toDest.getBounds());
  }
  // commonPointLines([47.64332055551951, 237.80129313468936], pointsP, [47.6441113460123, 238.08609008789065])

  function homeHomeLines(addresses, destination) {
    var addressesLatLng = addresses;
    console.log(addressesLatLng);
    const sortedAddresses = sortByProximity(addressesLatLng, destination);
    console.log(sortedAddresses);
    var toAddresses = L.polyline(sortedAddresses, {
      color: "#3273dc",
      dashArray: "4 8",
    }).addTo(map);
    var toDest = L.polyline(
      [sortedAddresses[sortedAddresses.length - 1], destination],
      { color: "#00d1b2" },
    ).addTo(map);
    polylines.push(toAddresses, toDest);
    map.fitBounds(toAddresses.getBounds());
  }

  // homeHomeLines(pointsP, [47.64332055551951, 237.80129313468936])

  // zoom the map to the polyline
}

function stuff() {
  for (let i = 0; i < points.length; i++) {
    var marker = points[i].addTo(markersGroup);
  }
}

function addPoint(firstName, address, point) {
  console.log(point);
  var marker = L.marker(point).addTo(markersGroup);
  marker.options.shadowSize = [0, 0];
  var popup = marker.bindPopup(firstName + "'s house<br> " + address);
}

var marker = L.marker(center).addTo(markersGroup);
marker.options.shadowSize = [0, 0];
var popup = marker.bindPopup("Eastside Preparatory School<br />Go eagles!");

window.addEventListener("click", function (e) {
  if (
    !document.getElementById("navbar-dropdown").contains(e.target) &&
    !document.getElementById("name_button").contains(e.target)
  ) {
    document.getElementById("navbar-dropdown").style.visibility = "hidden";
    //the same code you've used to hide the menu
  }
});
