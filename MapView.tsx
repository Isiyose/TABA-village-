import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayersControl, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import { collection, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { Search, Map as MapIcon, Layers, Info, Maximize, Minimize, Loader2, Navigation, Crosshair, Split, Layout, Globe } from 'lucide-react';
import L from 'leaflet';

// Mock Rwanda Administrative Data for Search
const RWANDA_ADMIN_DATA = {
  districts: [
    { name: 'Kicukiro', lat: -1.9930, lng: 30.1030 },
    { name: 'Nyarugenge', lat: -1.9500, lng: 30.0500 },
    { name: 'Gasabo', lat: -1.9000, lng: 30.1000 },
    { name: 'Musanze', lat: -1.5000, lng: 29.6333 },
    { name: 'Rubavu', lat: -1.6833, lng: 29.2333 },
    { name: 'Huye', lat: -2.5167, lng: 29.7333 },
    { name: 'Kayonza', lat: -1.9333, lng: 30.5167 },
    { name: 'Rwamagana', lat: -1.9487, lng: 30.4347 },
    { name: 'Bugesera', lat: -2.1411, lng: 30.0892 },
    { name: 'Gicumbi', lat: -1.6167, lng: 30.0667 },
    { name: 'Nyanza', lat: -2.3500, lng: 29.7500 },
    { name: 'Ruhango', lat: -2.2333, lng: 29.7833 },
    { name: 'Muhanga', lat: -2.0833, lng: 29.7500 },
    { name: 'Kamonyi', lat: -1.9833, lng: 29.9167 },
  ],
  sectors: [
    { name: 'Gatenga', district: 'Kicukiro', lat: -1.9830, lng: 30.0860 },
    { name: 'Kigarama', district: 'Kicukiro', lat: -1.9950, lng: 30.0950 },
    { name: 'Nyamirambo', district: 'Nyarugenge', lat: -1.9700, lng: 30.0400 },
    { name: 'Kimironko', district: 'Gasabo', lat: -1.9300, lng: 30.1200 },
    { name: 'Remera', district: 'Gasabo', lat: -1.9500, lng: 30.1100 },
    { name: 'Gatenga', district: 'Kicukiro', lat: -1.9830, lng: 30.0860 },
    { name: 'Kacyiru', district: 'Gasabo', lat: -1.9333, lng: 30.0833 },
  ]
};

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    // Only fly if the difference is significant to avoid infinite loops
    const latDiff = Math.abs(currentCenter.lat - center[0]);
    const lngDiff = Math.abs(currentCenter.lng - center[1]);
    const zoomDiff = Math.abs(currentZoom - zoom);
    
    if (latDiff > 0.0001 || lngDiff > 0.0001 || zoomDiff > 0.5) {
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onMapClick, onMapMove, onMapZoom }: { onMapClick: (lat: number, lng: number) => void, onMapMove: (lat: number, lng: number) => void, onMapZoom: (zoom: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    moveend(e) {
      const center = e.target.getCenter();
      onMapMove(center.lat, center.lng);
    },
    zoomend(e) {
      onMapZoom(e.target.getZoom());
    }
  });
  return null;
}

// Sync component for dual maps
function MapSync({ otherMapRef }: { otherMapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  
  useEffect(() => {
    const onMove = () => {
      if (otherMapRef.current && otherMapRef.current !== map) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const otherCenter = otherMapRef.current.getCenter();
        const otherZoom = otherMapRef.current.getZoom();
        
        // Only sync if there is a real difference to prevent ping-pong loops
        if (Math.abs(center.lat - otherCenter.lat) > 0.00001 || 
            Math.abs(center.lng - otherCenter.lng) > 0.00001 || 
            Math.abs(zoom - otherZoom) > 0.1) {
          otherMapRef.current.setView(center, zoom, { animate: false });
        }
      }
    };
    
    map.on('move', onMove);
    return () => {
      map.off('move', onMove);
    };
  }, [map, otherMapRef]);
  
  return null;
}

export function MapView() {
  const { t } = useLanguage();
  const [isibos, setIsibos] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminSearch, setAdminSearch] = useState({ district: '', sector: '' });
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.9830, 30.0860]);
  const [mapZoom, setMapZoom] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('satellite');

  const map1Ref = useRef<L.Map | null>(null);
  const map2Ref = useRef<L.Map | null>(null);

  const handleMapClick = React.useCallback((lat: number, lng: number) => {
    setClickedCoords([lat, lng]);
  }, []);

  const handleMapMove = React.useCallback((lat: number, lng: number) => {
    setMapCenter(prev => {
      // Only update if the difference is significant to avoid infinite loops
      if (Math.abs(prev[0] - lat) < 0.00001 && Math.abs(prev[1] - lng) < 0.00001) {
        return prev;
      }
      return [lat, lng];
    });
  }, []);

  const handleMapZoom = React.useCallback((zoom: number) => {
    setMapZoom(prev => {
      if (Math.abs(prev - zoom) < 0.1) {
        return prev;
      }
      return zoom;
    });
  }, []);

  // Rwanda Bounds to "remove world map" (focus only on Rwanda)
  const rwandaBounds: L.LatLngBoundsExpression = [
    [-2.84, 28.86], // Southwest
    [-1.05, 30.89]  // Northeast
  ];

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setMapCenter([latitude, longitude]);
        setMapZoom(19); 
        setIsLoading(false);
      }, (error) => {
        console.error("Error getting location", error);
        setIsLoading(false);
        alert("Could not get your location. Please ensure location services are enabled.");
      }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleAdminSearch = () => {
    const { district, sector } = adminSearch;
    
    if (sector) {
      const foundSector = RWANDA_ADMIN_DATA.sectors.find(s => 
        s.name.toLowerCase().includes(sector.toLowerCase())
      );
      if (foundSector) {
        setMapCenter([foundSector.lat, foundSector.lng]);
        setMapZoom(18); // High zoom for sector
        return;
      }
    }
    
    if (district) {
      const foundDistrict = RWANDA_ADMIN_DATA.districts.find(d => 
        d.name.toLowerCase().includes(district.toLowerCase())
      );
      if (foundDistrict) {
        setMapCenter([foundDistrict.lat, foundDistrict.lng]);
        setMapZoom(16); // District level zoom
      }
    }
  };

  // Mock Village Boundary (Taba Village)
  const villageBoundary: any = {
    "type": "Feature",
    "properties": { "name": "Taba Village" },
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [30.0820, -1.9810],
        [30.0900, -1.9810],
        [30.0920, -1.9850],
        [30.0880, -1.9880],
        [30.0820, -1.9870],
        [30.0800, -1.9840],
        [30.0820, -1.9810]
      ]]
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubIsibos = onSnapshot(collection(db, 'isibos'), (snapshot) => {
      setIsibos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'isibos');
      setIsLoading(false);
    });
    const unsubCitizens = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      setCitizens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((c: any) => !c.isArchived));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'citizens');
    });
    return () => {
      unsubIsibos();
      unsubCitizens();
    };
  }, []);

  const renderMapContent = (isSatellite: boolean = false) => {
    // Determine which layer to show based on mapType or forced satellite (for compare mode)
    const showSatellite = isCompareMode ? isSatellite : mapType === 'satellite';
    
    return (
      <>
        <MapController center={mapCenter} zoom={mapZoom} />
        <MapEvents 
          onMapClick={handleMapClick} 
          onMapMove={handleMapMove}
          onMapZoom={handleMapZoom}
        />
        
        <TileLayer
          attribution="&copy; Google"
          url={showSatellite 
            ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          maxZoom={22}
          maxNativeZoom={showSatellite ? 20 : 19}
        />
      
      {clickedCoords && (
        <Marker position={clickedCoords}>
          <Popup>
            <div className="p-2">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Clicked Coordinates</p>
              <code className="text-[10px] bg-slate-100 p-1 rounded block mb-2">
                Lat: {clickedCoords[0].toFixed(6)}<br/>
                Lng: {clickedCoords[1].toFixed(6)}
              </code>
              <p className="text-[10px] text-slate-400 italic">Use these to update Isibo locations for better accuracy.</p>
            </div>
          </Popup>
        </Marker>
      )}

      {isibos.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(isibo => {
        const lat = Number(isibo.lat);
        const lng = Number(isibo.lng);
        
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
        
        const memberCount = citizens.filter(c => c.isibo === isibo.name).length;
        const radius = Math.min(50, 10 + memberCount * 2);

        return (
          <React.Fragment key={isibo.id}>
            <Marker position={[lat, lng]}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-lg text-emerald-700 m-0">{isibo.name}</h3>
                  <p className="text-sm text-slate-600 mb-2">Leader: {isibo.leader}</p>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-800 uppercase block">Population</span>
                    <span className="text-xl font-black text-emerald-600">{memberCount}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
            
            <CircleMarker 
              center={[lat, lng]} 
              radius={radius}
              pathOptions={{ 
                fillColor: '#10b981', 
                color: '#10b981', 
                weight: 1, 
                opacity: 0.3, 
                fillOpacity: 0.2 
              }}
            />
          </React.Fragment>
        );
      })}
    </>
    );
  };

  return (
    <div className={`animate-in fade-in flex flex-col transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white dark:bg-slate-950 p-4' : 'h-[calc(100vh-180px)] min-h-[600px]'}`}>
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 rounded-3xl text-white mb-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Globe className="text-emerald-300" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Advanced Geospatial Viewer</h2>
            <p className="text-white/80 text-sm">High-resolution satellite imagery and administrative search.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20">
            <button 
              onClick={() => {
                setIsCompareMode(false);
                setMapType('street');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${(!isCompareMode && mapType === 'street') ? 'bg-white text-emerald-900 shadow-lg' : 'text-white hover:bg-white/10'}`}
            >
              Street
            </button>
            <button 
              onClick={() => {
                setIsCompareMode(false);
                setMapType('satellite');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${(!isCompareMode && mapType === 'satellite') ? 'bg-white text-emerald-900 shadow-lg' : 'text-white hover:bg-white/10'}`}
            >
              Satellite
            </button>
            <button 
              onClick={() => setIsCompareMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCompareMode ? 'bg-white text-emerald-900 shadow-lg' : 'text-white hover:bg-white/10'}`}
            >
              Compare
            </button>
          </div>

          <button 
            onClick={handleLocateMe}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm font-bold"
            title="Find my location"
          >
            <Navigation size={18} />
            <span className="hidden sm:inline">Locate Me</span>
          </button>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm font-bold"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Advanced Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-wrap gap-4 items-end shrink-0">
        <div className="flex-grow min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">District Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="e.g. Kicukiro, Musanze..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={adminSearch.district}
              onChange={(e) => setAdminSearch(prev => ({ ...prev, district: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSearch()}
            />
          </div>
        </div>
        <div className="flex-grow min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Sector Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="e.g. Gatenga, Remera..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={adminSearch.sector}
              onChange={(e) => setAdminSearch(prev => ({ ...prev, sector: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSearch()}
            />
          </div>
        </div>
        <button 
          onClick={handleAdminSearch}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
        >
          Fly to Location
        </button>
        
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block"></div>
        
        <div className="flex-grow min-w-[150px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Isibo Filter</label>
          <input 
            type="text" 
            placeholder="Filter Isibos on map..." 
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-grow flex gap-6 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-[2000] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-3xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Initializing Geospatial Data...</p>
            </div>
          </div>
        )}
        
        <div className={`flex-grow rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl z-0 relative flex ${isCompareMode ? 'flex-row' : 'flex-col'}`}>
          {!isCompareMode ? (
            <MapContainer 
              key="single"
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ height: '100%', width: '100%' }}
              maxBounds={rwandaBounds}
              maxBoundsViscosity={1.0}
              minZoom={8}
              maxZoom={22}
            >
              {renderMapContent()}
            </MapContainer>
          ) : (
            <>
              <div className="w-1/2 h-full border-r-2 border-slate-200 dark:border-slate-700 relative">
                <div className="absolute top-4 left-4 z-[1000] bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md">Street View</div>
                <MapContainer 
                  key="map1"
                  center={mapCenter} 
                  zoom={mapZoom} 
                  style={{ height: '100%', width: '100%' }}
                  ref={(map) => { map1Ref.current = map; }}
                  maxBounds={rwandaBounds}
                  maxBoundsViscosity={1.0}
                  minZoom={8}
                  maxZoom={22}
                >
                  {renderMapContent(false)}
                  <MapSync otherMapRef={map2Ref} />
                </MapContainer>
              </div>
              <div className="w-1/2 h-full relative">
                <div className="absolute top-4 right-4 z-[1000] bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md">Satellite View</div>
                <MapContainer 
                  key="map2"
                  center={mapCenter} 
                  zoom={mapZoom} 
                  style={{ height: '100%', width: '100%' }}
                  ref={(map) => { map2Ref.current = map; }}
                  maxBounds={rwandaBounds}
                  maxBoundsViscosity={1.0}
                  minZoom={8}
                  maxZoom={22}
                >
                  {renderMapContent(true)}
                  <MapSync otherMapRef={map1Ref} />
                </MapContainer>
              </div>
            </>
          )}
          
          {/* Precision Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-emerald-500 rounded-full opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-10 bg-emerald-500 opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-px bg-emerald-500 opacity-50"></div>
            </div>
          </div>

          {/* Map Overlay Legend */}
          <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Map Legend</h4>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs font-medium">Isibo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
                <span className="text-xs font-medium">Density</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Center Coordinates</p>
                <code className="text-[10px] text-emerald-600 font-mono">
                  {mapCenter[0].toFixed(6)}, {mapCenter[1].toFixed(6)}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with stats */}
        <div className="hidden xl:flex flex-col w-80 gap-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Layout size={18} className="text-emerald-500" />
              Top Isibos
            </h3>
            <div className="space-y-4">
              {isibos
                .map(i => ({ ...i, count: citizens.filter(c => c.isibo === i.name).length }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((isibo, idx) => (
                  <div key={isibo.id} className="flex items-center justify-between group cursor-pointer" onClick={() => {
                    if (isibo.lat && isibo.lng) {
                      setMapCenter([Number(isibo.lat), Number(isibo.lng)]);
                      setMapZoom(19);
                    }
                  }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300 dark:text-slate-700">0{idx + 1}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 transition-colors">{isibo.name}</span>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{isibo.count}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-grow">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Crosshair size={18} className="text-emerald-500" />
              Map Tools
            </h3>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-1 uppercase">House Viewing</p>
                <p className="text-[11px]">Use <strong>Satellite View</strong> and zoom level <strong>19</strong> to clearly identify individual houses and structures.</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-xs font-bold text-blue-800 dark:text-blue-400 mb-1 uppercase">Compare Mode</p>
                <p className="text-[11px]">Enable <strong>Compare Mode</strong> to see Street View and Satellite View side-by-side. Both maps stay synchronized as you move.</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1 uppercase">Admin Search</p>
                <p className="text-[11px]">Search by <strong>District</strong> or <strong>Sector</strong> to instantly navigate to administrative centers across Rwanda.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
