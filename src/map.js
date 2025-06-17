let map;
let markers = [];
let activeInfoWindow = null;

let data = {
	types: [
	{
		id: 1,
		title: 'tipas 1',
		description: 'aprasymas jei reikia',
		img: '',
		lat: 0,
		lng: 0
	},
	{
		id: 2,
		title: 'tipas 2',
		description: 'aprasymas jei reikia',
		img: '',
		lat: 0,
		lng: 0
	},
	{
		id: 3,
		title: 'tipas 3',
		description: 'aprasymas jei reikia',
		img: '',
		lat: 0,
		lng: 0
	}],
	groups: [{
		id: 1,
		title: 'Klaipėda',
		description: 'Klaipėdos miestas',
		img: '',
		lat: 55.6991,
		lng: 21.1625
	},
	{
		id: 2,
		title: 'Kaunas',
		description: 'Kauno miestas',
		img: 'paveikslelio url, jei reikia',
		lat: 54.8923,
		lng: 23.9035
	},
	{
		id: 3,
		title: 'Vilnius',
		description: 'Vilniaus miestas',
		img: 'paveikslelio url, jei reikia',
		lat: 54.6803,
		lng: 25.2771
	}],
	items: [{
		id: 1,
		title: 'Stendas 1',
		typeId: 3,
		groupId: 1,
		description: 'aprasymas jei reikia',
		img: 'https://images.pexels.com/photos/1634278/pexels-photo-1634278.jpeg',
		lat: 55.6919,
		lng: 21.1778
	},
	{
		id: 2,
		title: 'Stendas 2',
		typeId: 1,
		groupId: 1,
		description: 'aprasymas jei reikia',
		img: 'https://images.pexels.com/photos/1031700/pexels-photo-1031700.jpeg',
		lat: 55.687802,
		lng: 21.140623
	},
	{
		id: 3,
		title: 'Stendas 3',
		typeId: 1,
		groupId: 2,
		description: 'aprasymas jei reikia',
		img: 'https://images.pexels.com/photos/2448522/pexels-photo-2448522.jpeg',
		lat: 54.915137,
		lng: 23.889044
	},
	{
		id: 4,
		title: 'Stendas 4',
		typeId: 1,
		groupId: 2,
		description: 'aprasymas jei reikia',
		img: 'https://images.pexels.com/photos/1137511/pexels-photo-1137511.jpeg',
		lat: 54.912261,
		lng: 23.935949
	},
	{
		id: 5,
		title: 'Stendas 5',
		typeId: 1,
		groupId: 2,
		description: 'aprasymas jei reikia',
		img: 'https://images.pexels.com/photos/1058276/pexels-photo-1058276.jpeg',
		lat: 54.937347,
		lng: 23.898592
	},
	{
		id: 6,
		title: 'Stendas 6',
		typeId: 1,
		groupId: 3,
		description: 'aprasymas jei reikia',
		img: 'https://images.pexels.com/photos/2591761/pexels-photo-2591761.jpeg',
		lat: 54.698678,
		lng: 25.265185
	}]
}

export function setupMap(containerId = "map", apiKey) {
  if (!apiKey) throw new Error("Google Maps API key is required");

  loadGoogleMaps(apiKey)
    .then(() => initMap(containerId))
    .catch(err => console.error("Failed to load Google Maps:", err));
}

function loadGoogleMaps(apiKey) {
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.defer = true;
    script.async = true;
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        reject(new Error("Google Maps failed to load"));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function initMap(containerId) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`#${containerId} not found`);

  const center = { lat: 55.360307, lng: 24.095800 };

  map = new google.maps.Map(container, {
    zoom: 7,
    center,
  });

  class HtmlMarker extends google.maps.OverlayView {
    constructor(position, html, onClick) {
      super();
      this.position = position;
      this.html = html;
      this.onClick = onClick;
      this.div = null;
      this.setMap(map);
    }

    onAdd() {
      this.div = document.createElement('div');
      this.div.innerHTML = this.html;
      this.div.style.position = 'absolute';
      if (this.onClick) this.div.addEventListener('click', this.onClick);
      this.getPanes().overlayMouseTarget.appendChild(this.div);
    }

    draw() {
      const point = this.getProjection().fromLatLngToDivPixel(this.position);
      if (point && this.div) {
        this.div.style.left = point.x + 'px';
        this.div.style.top = point.y + 'px';
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    }
  }

  window.HtmlMarker = HtmlMarker;

  showGroupMarkers(data);
  renderGroupButtons(data);

}

function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

function showGroupMarkers(data) {
  clearMarkers();

  data.groups.forEach(group => {
    const position = new google.maps.LatLng(group.lat, group.lng);
    const html = `
      <div class="google-map-marker-city">
        <span>${group.title}</span>
      </div>
    `;

    const marker = new window.HtmlMarker(position, html, () => {
      map.setZoom(12);
      map.panTo(position);
      showItemMarkers(data, group.id);
    });

    markers.push(marker);
  });
}

function showItemMarkers(data, groupId) {
  clearMarkers();

  const items = data.items.filter(item => item.groupId === groupId);

  items.forEach(item => {
    const position = new google.maps.LatLng(item.lat, item.lng);
    const html = `
      <div class="google-map-marker-item">
        <span>${item.title}</span>
      </div>
    `;

    const marker = new HtmlMarker(position, html, () => {
      if (activeInfoWindow) {
        activeInfoWindow.close();
      }
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="max-width: 200px; max-height: 300px; padding: 12px; color: #333; box-sizing: border-box;">
            <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 16px;">${item.title}</h3>
            <img src="${item.img}" alt="${item.title}" style="width: 100%; height: auto; border-radius: 4px; margin-bottom: 8px;" />
            <p style="margin: 0; font-size: 14px;">${item.description}</p>
          </div>
        `
      });

      infoWindow.setPosition(position);
      infoWindow.open(map);
      activeInfoWindow = infoWindow;
    });

    markers.push(marker);
  });
}

function renderGroupButtons(data) {
  const container = document.getElementById('group-buttons');
  if (!container) return;

  container.innerHTML = ''; // Clear any existing buttons

  // "Show All" button
  const allBtn = document.createElement('button');
  allBtn.innerText = 'Rodyti visus';
  allBtn.onclick = () => {
    showGroupMarkers(data);
    map.setZoom(7);
    map.setCenter({ lat: 55.360307, lng: 24.095800 });
  };
  container.appendChild(allBtn);

  // One button per group
  data.groups.forEach(group => {
    const btn = document.createElement('button');
    btn.innerText = group.title;
    btn.style.marginLeft = '6px';
    btn.onclick = () => {
      const position = new google.maps.LatLng(group.lat, group.lng);
      map.setZoom(12);
      map.panTo(position);
      showItemMarkers(data, group.id);
    };
    container.appendChild(btn);
  });
}
