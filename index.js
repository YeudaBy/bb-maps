
function wktToLatLngArray(wkt) {
    // Extract the coordinates part from WKT
    const coordinatesParts = wkt.match(/\(\((.*?)\)\)/);
    console.log(coordinatesParts);

    if (!coordinatesParts || !coordinatesParts[1]) {
        throw new Error('No coordinates found in WKT');
    }

    const coordinatesArray = coordinatesParts[1].split(', ').map(coord => {
        const [lng, lat] = coord.split(' ').map(Number);
        return { lat, lng };
    });

    return coordinatesArray;
}

function init(ps, latCenter, lngCenter) {

    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: latCenter, lng: lngCenter},
        zoom: 13,
        // disable buttons
        disableDefaultUI: true,
    });
    // Create the search box and link it to the UI element.
    const input = document.getElementById("pac-input");
    const searchBox = new google.maps.places.SearchBox(input);

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", () => {
        // clear all the polygons from the map
        map.data.forEach((feature) => {
            map.data.remove(feature);
        });
        searchBox.setBounds(map.getBounds());
    });

    let pol = null
    let infoWin = null

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener("places_changed", () => {
        // clear all the polygons from the map
        pol?.setMap(null);
        infoWin?.close();

        const places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }
        const l = places[0].geometry.location

        // find in which polygon the point is
        const match = ps.find(po => {
            const triangleCoords = wktToLatLngArray(po.p);
            const p = new google.maps.Polygon({ paths: triangleCoords });
            return google.maps.geometry.poly.containsLocation(l, p)
        }
        )
        console.log(match);
        
        if (!match) {
            alert("הכתובת מופיעה מחוץ לגבולות המפה")
            return;
        }

        // draw the polygon on the map
        const triangleCoords = wktToLatLngArray(match.p);
        const p = new google.maps.Polygon({
            paths: triangleCoords,
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: match.color,
            fillOpacity: 0.35,
        });
        p.setMap(map);
        pol = p;

        // For each place, get the icon, name and location.
        const bounds = new google.maps.LatLngBounds();
        const marker = new google.maps.Marker({
            map,
            title: places[0].name,
            position: l,
        });

        bounds.extend(marker.getPosition());
        // add bound with the name of the polygon
        const infowindow = new google.maps.InfoWindow({
            content: `<h2 style="margin: 1rem; text-align: center">${match.name}</h2>`
        });
        infowindow.open(map, marker);
        infoWin = infowindow;
        input.value = "";
    });
}

