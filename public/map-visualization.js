// Initialize map variables
let map, markersGroup, points = [];
let geocode = {}, carpools;
const center = [47.64371189816165, -122.19894455582242];
function parseGeocode(res){
  if(res.features && res.features[0]){
    const f=res.features[0];
    const lat=f.properties?.lat ?? f.geometry?.coordinates[1];
    const lon=f.properties?.lon ?? f.geometry?.coordinates[0];
    return [lat,lon];
  }
  return null;
}


// Function to initialize the map
function initMap() {
    // Check if map container exists
    if (!document.getElementById('map')) {
        console.log('Map container not found, skipping map initialization');
        return;
    }

    // Initialize the map
    map = L.map('map').setView(center, 11);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialize markers group
    markersGroup = L.layerGroup().addTo(map);

    // Add click event to place markers
    map.on('click', function (e) {
        const marker = L.marker(e.latlng).addTo(markersGroup);
        points.push(e.latlng);
        console.log('Marker placed at:', e.latlng);

        // You can add a popup to the marker if needed
        // marker.bindPopup('Location: ' + e.latlng.lat.toFixed(4) + ', ' + e.latlng.lng.toFixed(4)).openPopup();
    });
}

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', function () {
    initMap();
}); fetch("/api/events", { method: "GET" }).then(o => o.json()).then(o => { events = o, fetch("/api/userCarpools", { method: "GET" }).then(o => o.json()).then(o => { carpools = o, console.log(carpools); for (let e = 0; e < carpools.length; e++) { var r; carpools[e].carpoolers.forEach(o => { a(o.address) }), ((r = events.find(o => o._id === carpools[e].nameOfEvent)) && a(r.address)), a(carpools[e].wlocation) } function a(o) { let e = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(o)}&apiKey=992ef3d60d434f2283ea8c6d70a4898d`; fetch(new Request(e, { method: "GET", headers: new Headers({ Accept: "application/json", "Content-Type": "application/json" }) })).then(o => o.json()).then(e => { console.log(e), geocode[o] = parseGeocode(e) }).catch(o => { console.error(o) }) } }).catch(o => console.error("Error:", o)) }).catch(o => console.error("Error:", o)); var polylines = []; function add(o) { addDirectionsButton(o), polylines.forEach(function (o) { map.removeLayer(o) }), markersGroup.clearLayers(); let e = carpools.find(e => e._id === o); var r = []; e.carpoolers.forEach(o => { addPoint(o.firstName, o.address, geocode[o.address]), r.push(geocode[o.address]) }); var a = events.find(o => o._id === e.nameOfEvent); if ("route" == e.route) { console.log("route"); var s, t, n = L.marker(geocode[e.wlocation]).addTo(markersGroup); n.options.shadowSize = [0, 0], n.bindPopup('<i class="fa-solid fa-house" style="color: Dodgerblue; font-size: 15px"></i> ' + e.firstName + "'s house<br> " + e.wlocation); var d, i, l, p, c, n = L.marker(geocode[a.address]).addTo(markersGroup); let u; n.options.shadowSize = [0, 0], n.bindPopup('<i class="fa-solid fa-location-dot" style="color: Tomato; font-size: 15px"></i> ' + a.wlocation + "<br>" + a.address), r.push(geocode[e.wlocation]), d = r, i = geocode[a.address], c = d, console.log(c), u = (l = c, p = i, l.sort((o, e) => { let r = m(o, p), a = m(e, p); return console.log(r, a), a - r })), console.log(u), s = L.polyline(u, { color: "#3273dc", dashArray: "4 8" }).addTo(map), t = L.polyline([u[u.length - 1], i], { color: "#00d1b2" }).addTo(map), polylines.push(s, t), map.fitBounds(s.getBounds()) } else if ("point" == e.route) { console.log("point"); var n = L.marker(geocode[e.wlocation]).addTo(markersGroup); n.options.shadowSize = [0, 0], n.bindPopup('<i class="fa-solid fa-location-crosshairs" style="color: #00d1b2; font-size: 15px"></i> Meeting point<br>' + e.wlocation); var n = L.marker(geocode[a.address]).addTo(markersGroup); n.options.shadowSize = [0, 0], n.bindPopup('<i class="fa-solid fa-location-dot" style="color: Tomato; font-size: 15px"></i> ' + a.wlocation + "<br> " + a.address), function o(e, r, a) { for (var s = 0; s < r.length; s++) { var t = [e, r[s]], n = L.polyline(t, { color: "#3273dc", dashArray: "4 8" }).addTo(map); polylines.push(n) } var d = L.polyline([e, a], { color: "#00d1b2" }).addTo(map); polylines.push(d), map.fitBounds(d.getBounds()) }(geocode[e.wlocation], r, geocode[a.address]) } function m(o, e) { return Math.sqrt(Math.pow(e[0] - o[0], 2) + Math.pow(e[1] - o[1], 2)) } } function stuff() { for (let o = 0; o < points.length; o++)points[o].addTo(markersGroup) } function addPoint(o, e, r) { console.log(r); var a = L.marker(r).addTo(markersGroup); a.options.shadowSize = [0, 0], a.bindPopup('<i class="fa-solid fa-house" style="color: Dodgerblue; font-size: 15px"></i> ' + o + "'s house<br> " + e) } // Add EPS marker when map is ready
if (map) {
    const epsMarker = L.marker(center).addTo(markersGroup);
    epsMarker.options.shadowSize = [0, 0];
    epsMarker.bindPopup("Eastside Preparatory School<br />Go eagles!");
}

// Handle navbar dropdown clicks
window.addEventListener("click", function (o) {
    document.getElementById("navbar-dropdown").contains(o.target) ||
        document.getElementById("name_button").contains(o.target) ||
        (document.getElementById("navbar-dropdown").style.visibility = "hidden");
});
