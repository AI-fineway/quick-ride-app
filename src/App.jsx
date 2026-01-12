import React, { useState, useEffect, useRef } from 'react';
import './index.css';

// Simple icon components
const MapPinIcon = () => <span className="icon">📍</span>;
const PhoneIcon = () => <span className="icon">📞</span>;
const MessageIcon = () => <span className="icon">💬</span>;
const MailIcon = () => <span className="icon">✉️</span>;
const UserIcon = () => <span className="icon">👤</span>;
const StarIcon = () => <span className="icon">⭐</span>;
const PackageIcon = () => <span className="icon">📦</span>;
const CheckIcon = () => <span className="icon">✅</span>;
const LoaderIcon = () => <span className="icon spinner">⏳</span>;
const CloseIcon = () => <span className="icon">✖️</span>;
const CameraIcon = () => <span className="icon">📷</span>;
// Add theme icons
const SunIcon = () => <span className="icon theme-icon">☀️</span>;
const MoonIcon = () => <span className="icon theme-icon">🌙</span>;

const CustomerRideApp = () => {
  const [activeTab, setActiveTab] = useState('book');
  const [bookingStep, setBookingStep] = useState(1);
  const [searchingRider, setSearchingRider] = useState(false);
  const [rideActive, setRideActive] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSelectMode, setMapSelectMode] = useState(null);
  const [openLayersLoaded, setOpenLayersLoaded] = useState(false);
  const [packageImage, setPackageImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('quickride-theme');
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  
  // Fancy alert state
  const [showFancyAlert, setShowFancyAlert] = useState(false);
  const [alertRider, setAlertRider] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [explosions, setExplosions] = useState([]);
  
  // Multiple active rides (max 3)
  const [activeRides, setActiveRides] = useState([]);
  const MAX_RIDES = 3;
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  
  const [customerDetails, setCustomerDetails] = useState({
    phone: '',
    whatsapp: '',
    email: ''
  });

  const [booking, setBooking] = useState({
    pickupAddress: '',
    pickupLat: null,
    pickupLng: null,
    dropoffAddress: '',
    dropoffLat: null,
    dropoffLng: null,
    packageType: 'document',
    riderType: 'bike' // Only bike available now
  });

  const [tempLocation, setTempLocation] = useState({
    lat: null,
    lng: null,
    address: ''
  });

  const [riderLocation, setRiderLocation] = useState({
    lat: null,
    lng: null
  });

  // Rider data - This will come from backend in production
  const [assignedRider, setAssignedRider] = useState(null);
  
  // Fixed delivery price - 1000 Naira for all deliveries
  const DELIVERY_PRICE = 1000;
  
  // Sample rider data (Replace with API call in production)
  const sampleRiders = [
    {
      id: 1,
      name: "Ebuka Okonkwo",
      phone: "07059865233",
      rating: 4.9,
      totalDeliveries: 1234,
      profileImage: null, // Can add image URL here
      vehicleType: "bike"
    },
    {
      id: 2,
      name: "Chioma Adeleke",
      phone: "08012345678",
      rating: 4.8,
      totalDeliveries: 892,
      profileImage: null,
      vehicleType: "car"
    },
    {
      id: 3,
      name: "Ahmed Ibrahim",
      phone: "09087654321",
      rating: 4.7,
      totalDeliveries: 2156,
      profileImage: null,
      vehicleType: "bike"
    }
  ];

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quickride-theme', theme);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Load OpenLayers scripts
  useEffect(() => {
    // Load OpenLayers CSS
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/ol@v7.5.2/ol.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Load OpenLayers JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/ol@v7.5.2/dist/ol.js';
    script.onload = () => setOpenLayersLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  // Request user's GPS location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Initialize map when modal opens
  useEffect(() => {
    if (showMapModal && openLayersLoaded && mapContainerRef.current && !mapRef.current) {
      initializeMap();
    }
  }, [showMapModal, openLayersLoaded]);

  // Simulate rider movement for demo
  useEffect(() => {
    if (rideActive && booking.pickupLat && booking.pickupLng) {
      setRiderLocation({
        lat: booking.pickupLat + 0.01,
        lng: booking.pickupLng + 0.01
      });

      const interval = setInterval(() => {
        setRiderLocation(prev => {
          if (!prev.lat || !prev.lng) return prev;
          
          const latDiff = booking.pickupLat - prev.lat;
          const lngDiff = booking.pickupLng - prev.lng;
          
          return {
            lat: prev.lat + latDiff * 0.1,
            lng: prev.lng + lngDiff * 0.1
          };
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [rideActive, booking.pickupLat, booking.pickupLng]);

  const getUserLocation = () => {
    setLocationLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setLocationLoading(false);
        },
        (error) => {
          setLocationLoading(false);
          setLocationError('Unable to get your location. Please enable GPS.');
          setUserLocation({ lat: 4.8156, lng: 7.0498 }); // Port Harcourt
        }
      );
    } else {
      setLocationLoading(false);
      setLocationError('Geolocation is not supported by your browser.');
      setUserLocation({ lat: 4.8156, lng: 7.0498 });
    }
  };

  const initializeMap = () => {
    if (!window.ol || mapRef.current) return;

    const initialCenter = userLocation || { lat: 4.8156, lng: 7.0498 };
    
    // Transform coordinates to map projection
    const centerCoords = window.ol.proj.fromLonLat([initialCenter.lng, initialCenter.lat]);

    // Create marker
    const marker = new window.ol.Feature({
      geometry: new window.ol.geom.Point(centerCoords)
    });

    const markerStyle = new window.ol.style.Style({
      image: new window.ol.style.Icon({
        anchor: [0.5, 1],
        src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0giIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xNiA0OEMxNiA0OCAzMiAyOCAxNiAwQzAgMCAwIDI4IDE2IDQ4WiIgZmlsbD0iIzI1NjNFQiIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'
      })
    });

    marker.setStyle(markerStyle);

    const vectorSource = new window.ol.source.Vector({
      features: [marker]
    });

    const vectorLayer = new window.ol.layer.Vector({
      source: vectorSource
    });

    // Create map
    const map = new window.ol.Map({
      target: mapContainerRef.current,
      layers: [
        new window.ol.layer.Tile({
          source: new window.ol.source.OSM()
        }),
        vectorLayer
      ],
      view: new window.ol.View({
        center: centerCoords,
        zoom: 15
      })
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Add click event to map
    map.on('click', (evt) => {
      const coords = evt.coordinate;
      marker.getGeometry().setCoordinates(coords);
      const lonLat = window.ol.proj.toLonLat(coords);
      updateLocationFromCoords(lonLat[1], lonLat[0]);
    });

    // Set initial location
    updateLocationFromCoords(initialCenter.lat, initialCenter.lng);
  };

  const updateLocationFromCoords = async (lat, lng) => {
    try {
      // Use Nominatim (OpenStreetMap) for reverse geocoding - FREE!
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      setTempLocation({
        lat: lat,
        lng: lng,
        address: address
      });
    } catch (error) {
      console.error('Error getting address:', error);
      setTempLocation({
        lat: lat,
        lng: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    }
  };

  const searchLocation = async (query) => {
    if (!query || query.length < 3) return;

    try {
      // Use Nominatim for geocoding - FREE!
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        if (mapRef.current && markerRef.current) {
          const coords = window.ol.proj.fromLonLat([lng, lat]);
          mapRef.current.getView().setCenter(coords);
          mapRef.current.getView().setZoom(15);
          markerRef.current.getGeometry().setCoordinates(coords);
          updateLocationFromCoords(lat, lng);
        }
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const openMapForPickup = () => {
    setMapSelectMode('pickup');
    setShowMapModal(true);
    if (booking.pickupLat && booking.pickupLng) {
      setTempLocation({
        lat: booking.pickupLat,
        lng: booking.pickupLng,
        address: booking.pickupAddress
      });
    }
  };

  const openMapForDropoff = () => {
    setMapSelectMode('dropoff');
    setShowMapModal(true);
    if (booking.dropoffLat && booking.dropoffLng) {
      setTempLocation({
        lat: booking.dropoffLat,
        lng: booking.dropoffLng,
        address: booking.dropoffAddress
      });
    }
  };

  const confirmLocationSelection = () => {
    if (mapSelectMode === 'pickup') {
      setBooking({
        ...booking,
        pickupLat: tempLocation.lat,
        pickupLng: tempLocation.lng,
        pickupAddress: tempLocation.address
      });
    } else if (mapSelectMode === 'dropoff') {
      setBooking({
        ...booking,
        dropoffLat: tempLocation.lat,
        dropoffLng: tempLocation.lng,
        dropoffAddress: tempLocation.address
      });
    }
    closeMapModal();
  };

  const closeMapModal = () => {
    setShowMapModal(false);
    setMapSelectMode(null);
    if (mapRef.current) {
      mapRef.current.setTarget(null);
      mapRef.current = null;
      markerRef.current = null;
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions or use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPackageImage(reader.result);
          stopCamera();
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackageImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePackageImage = () => {
    setPackageImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinueToDetails = () => {
    if (booking.pickupLat && booking.pickupLng && booking.dropoffLat && booking.dropoffLng) {
      setBookingStep(2);
    }
  };

  const handleContinueToRider = () => {
    if (customerDetails.phone && customerDetails.whatsapp && customerDetails.email) {
      setBookingStep(3);
    }
  };

  const handleBookRide = () => {
    // Check if maximum rides reached
    if (activeRides.length >= MAX_RIDES) {
      alert(`You can only book up to ${MAX_RIDES} riders at a time. Please cancel an existing ride to book a new one.`);
      return;
    }

    const bookingData = {
      customer: customerDetails,
      userCurrentLocation: userLocation,
      pickup: {
        address: booking.pickupAddress,
        latitude: booking.pickupLat,
        longitude: booking.pickupLng
      },
      dropoff: {
        address: booking.dropoffAddress,
        latitude: booking.dropoffLat,
        longitude: booking.dropoffLng
      },
      packageType: booking.packageType,
      riderType: booking.riderType,
      packageImage: packageImage // Base64 image string
    };

    console.log('Booking Data:', bookingData);

    setSearchingRider(true);
    
    // Simulate finding a rider (Replace with actual API call)
    setTimeout(() => {
      // Get riders not already assigned to active rides
      const assignedRiderIds = activeRides.map(ride => ride.rider.id);
      const availableRiders = sampleRiders.filter(
        rider => !assignedRiderIds.includes(rider.id)
      );
      
      if (availableRiders.length === 0) {
        alert('All riders are currently busy. Please try again later.');
        setSearchingRider(false);
        return;
      }

      // Randomly assign an available rider
      const randomRider = availableRiders[Math.floor(Math.random() * availableRiders.length)];
      
      // Create new ride object
      const newRide = {
        id: Date.now(), // Unique ride ID
        rider: randomRider,
        booking: {
          pickup: booking.pickupAddress,
          dropoff: booking.dropoffAddress,
          pickupLat: booking.pickupLat,
          pickupLng: booking.pickupLng,
          dropoffLat: booking.dropoffLat,
          dropoffLng: booking.dropoffLng,
          packageType: booking.packageType,
          packageImage: packageImage
        },
        riderLocation: {
          lat: booking.pickupLat + 0.01,
          lng: booking.pickupLng + 0.01
        },
        status: 'active',
        bookedAt: new Date().toISOString()
      };

      // Add to active rides
      setActiveRides(prev => [...prev, newRide]);
      
      setSearchingRider(false);
      setActiveTab('active');
      
      // Show fancy alert
      setAlertRider(randomRider);
      setShowFancyAlert(true);
      setShowConfetti(true);
      
      // Create explosions
      const newExplosions = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setExplosions(newExplosions);
      
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 2000);
      setTimeout(() => setExplosions([]), 1000);
      
      // Reset booking form for next booking
      resetBookingForm();
    }, 3000);
  };

  // Book Another Ride functions
  const handleBookSameRide = () => {
    // Reset only the customer details, keep locations and package type
    setBookingStep(2);
    setCustomerDetails({
      phone: '',
      whatsapp: '',
      email: ''
    });
    setActiveTab('book');
  };

  const handleBookNewRide = () => {
    resetBookingForm();
    setActiveTab('book');
  };

  const closeFancyAlert = () => {
    setShowFancyAlert(false);
    setAlertRider(null);
  };

  // Function to generate confetti
  const generateConfetti = () => {
    const confettiElements = [];
    for (let i = 0; i < 50; i++) {
      const style = {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        background: `linear-gradient(45deg, 
          hsl(${Math.random() * 360}, 100%, 60%),
          hsl(${Math.random() * 360}, 100%, 60%)
        )`,
        width: `${Math.random() * 10 + 8}px`,
        height: `${Math.random() * 10 + 8}px`
      };
      confettiElements.push(<div key={i} className="confetti" style={style} />);
    }
    return confettiElements;
  };

  const resetBookingForm = () => {
    setBookingStep(1);
    setPackageImage(null);
    setBooking({
      pickupAddress: '',
      pickupLat: null,
      pickupLng: null,
      dropoffAddress: '',
      dropoffLat: null,
      dropoffLng: null,
      packageType: 'document',
      riderType: 'bike'
    });
    setCustomerDetails({
      phone: '',
      whatsapp: '',
      email: ''
    });
  };

  const calculateDistance = () => {
    if (!booking.pickupLat || !booking.dropoffLat) return '0';
    
    const R = 6371;
    const dLat = (booking.dropoffLat - booking.pickupLat) * Math.PI / 180;
    const dLng = (booking.dropoffLng - booking.pickupLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(booking.pickupLat * Math.PI / 180) * Math.cos(booking.dropoffLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  const calculateRiderDistance = () => {
    if (!riderLocation.lat || !booking.pickupLat) return '0';
    
    const R = 6371;
    const dLat = (booking.pickupLat - riderLocation.lat) * Math.PI / 180;
    const dLng = (booking.pickupLng - riderLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(riderLocation.lat * Math.PI / 180) * Math.cos(booking.pickupLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(2);
  };

  const calculateRiderDistanceForRide = (ride) => {
    if (!ride.riderLocation.lat || !ride.booking.pickupLat) return 0;
    
    const R = 6371;
    const dLat = (ride.booking.pickupLat - ride.riderLocation.lat) * Math.PI / 180;
    const dLng = (ride.booking.pickupLng - ride.riderLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(ride.riderLocation.lat * Math.PI / 180) * Math.cos(ride.booking.pickupLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };

  const resetBooking = () => {
    setBookingStep(1);
    setRideActive(false);
    setSearchingRider(false);
    setPackageImage(null);
    setAssignedRider(null);
    setActiveRides([]);
    setBooking({
      pickupAddress: '',
      pickupLat: null,
      pickupLng: null,
      dropoffAddress: '',
      dropoffLat: null,
      dropoffLng: null,
      packageType: 'document',
      riderType: 'bike'
    });
    setCustomerDetails({
      phone: '',
      whatsapp: '',
      email: ''
    });
    setActiveTab('book');
  };

  const cancelRide = (rideId) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this ride? This action cannot be undone.'
    );
    
    if (confirmed) {
      setActiveRides(prev => prev.filter(ride => ride.id !== rideId));
      alert('Ride cancelled successfully.');
    }
  };

  // Function to handle WhatsApp call
  const handleWhatsAppCall = (phoneNumber) => {
    // Remove any non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Format for WhatsApp (add country code if not present)
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith('234')) {
      // Assuming Nigerian number starting with 0
      if (cleanPhone.startsWith('0')) {
        formattedPhone = '234' + cleanPhone.substring(1);
      } else {
        formattedPhone = '234' + cleanPhone;
      }
    }
    
    // WhatsApp call link
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=Hello, I'm contacting you regarding my delivery order.`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* Theme Toggle Button */}
        <div className="theme-toggle-container">
          <button onClick={toggleTheme} className="theme-toggle-button">
            {theme === 'light' ? (
              <>
                <MoonIcon />
                Dark Mode
              </>
            ) : (
              <>
                <SunIcon />
                Light Mode
              </>
            )}
          </button>
        </div>

        {/* Header */}
        <div className="header-card">
          <h1 className="app-title">QuickRide Delivery</h1>
          <p className="app-subtitle">Fast, seamless delivery service</p>
          
          {userLocation && (
            <div className="location-status success">
              <CheckIcon />
              <span>GPS Location Active</span>
            </div>
          )}
          
          {locationLoading && (
            <div className="location-status loading">
              <LoaderIcon />
              <span>Getting your location...</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs-card">
          <div className="tabs-wrapper">
            <button
              onClick={() => setActiveTab('book')}
              className={`tab-button ${activeTab === 'book' ? 'active' : ''}`}
            >
              Book Ride
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            >
              Active Rides {activeRides.length > 0 && `(${activeRides.length})`}
            </button>
          </div>
          
          {/* Max rides info */}
          {activeRides.length > 0 && (
            <div className="rides-info">
              <span className="rides-count">
                {activeRides.length} of {MAX_RIDES} riders booked
              </span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="main-card">
          {activeTab === 'book' && (
            <div className="content-wrapper">
              {/* Multiple bookings notice */}
              {activeRides.length < MAX_RIDES && (
                <div className="info-notice">
                  <span className="info-icon">ℹ️</span>
                  <span className="info-text">
                    You can book up to {MAX_RIDES} riders at a time. {activeRides.length > 0 ? `Currently ${activeRides.length} active.` : ''}
                  </span>
                </div>
              )}

              {activeRides.length >= MAX_RIDES && (
                <div className="warning-notice">
                  <span className="warning-icon">⚠️</span>
                  <span className="warning-text">
                    Maximum {MAX_RIDES} riders limit reached. Cancel a ride to book another.
                  </span>
                </div>
              )}

              {!searchingRider && (
                <>
                  {/* Step 1: Location Selection */}
                  {bookingStep === 1 && (
                    <div className="step-content">
                      <h3 className="step-title">Where do you need delivery?</h3>
                      
                      <div className="form-group">
                        <div className="input-group">
                          <label className="input-label">Pickup Location</label>
                          <button
                            onClick={openMapForPickup}
                            className="map-select-button"
                          >
                            {booking.pickupLat ? (
                              <div className="location-selected">
                                <div className="location-header success">
                                  <MapPinIcon />
                                  <span>Location Selected</span>
                                </div>
                                <div className="location-address">{booking.pickupAddress}</div>
                                <div className="coordinates">
                                  {booking.pickupLat.toFixed(6)}, {booking.pickupLng.toFixed(6)}
                                </div>
                              </div>
                            ) : (
                              <div className="location-placeholder">
                                <MapPinIcon />
                                <span>Select pickup location on map</span>
                              </div>
                            )}
                          </button>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Dropoff Location</label>
                          <button
                            onClick={openMapForDropoff}
                            className="map-select-button"
                          >
                            {booking.dropoffLat ? (
                              <div className="location-selected">
                                <div className="location-header danger">
                                  <MapPinIcon />
                                  <span>Location Selected</span>
                                </div>
                                <div className="location-address">{booking.dropoffAddress}</div>
                                <div className="coordinates">
                                  {booking.dropoffLat.toFixed(6)}, {booking.dropoffLng.toFixed(6)}
                                </div>
                              </div>
                            ) : (
                              <div className="location-placeholder">
                                <MapPinIcon />
                                <span>Select dropoff location on map</span>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="input-label">Package Type</label>
                        <select
                          value={booking.packageType}
                          onChange={(e) => setBooking({...booking, packageType: e.target.value})}
                          className="select-input"
                        >
                          <option value="document">Document</option>
                          <option value="food">Food</option>
                          <option value="package">Small Package</option>
                          <option value="large">Large Item</option>
                        </select>
                      </div>

                      {/* Package Image Upload */}
                      <div className="input-group">
                        <label className="input-label">Package Photo (Optional)</label>
                        
                        {!packageImage && !showCamera && (
                          <div className="image-upload-buttons">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="btn btn-camera"
                            >
                              <CameraIcon /> Take Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="btn btn-upload"
                            >
                              📁 Upload Photo
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              style={{ display: 'none' }}
                            />
                          </div>
                        )}

                        {showCamera && (
                          <div className="camera-container">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="camera-preview"
                            />
                            <div className="camera-controls">
                              <button onClick={capturePhoto} className="btn btn-primary">
                                <CameraIcon /> Capture
                              </button>
                              <button onClick={stopCamera} className="btn btn-secondary">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {packageImage && (
                          <div className="image-preview-container">
                            <img src={packageImage} alt="Package" className="image-preview" />
                            <button onClick={removePackageImage} className="image-remove-btn">
                              <CloseIcon />
                            </button>
                          </div>
                        )}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </div>

                      <button
                        onClick={handleContinueToDetails}
                        disabled={!booking.pickupLat || !booking.dropoffLat}
                        className="btn btn-primary"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Step 2: Customer Details */}
                  {bookingStep === 2 && (
                    <div className="step-content">
                      <h3 className="step-title">Your Contact Details</h3>
                      
                      <div className="form-group">
                        <div className="input-group">
                          <label className="input-label">
                            <PhoneIcon /> Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+234 800 000 0000"
                            value={customerDetails.phone}
                            onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                            className="text-input"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">
                            <MessageIcon /> WhatsApp Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+234 800 000 0000"
                            value={customerDetails.whatsapp}
                            onChange={(e) => setCustomerDetails({...customerDetails, whatsapp: e.target.value})}
                            className="text-input"
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">
                            <MailIcon /> Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={customerDetails.email}
                            onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                            className="text-input"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleContinueToRider}
                        disabled={!customerDetails.phone || !customerDetails.whatsapp || !customerDetails.email}
                        className="btn btn-primary"
                      >
                        Continue
                      </button>

                      <button
                        onClick={() => setBookingStep(1)}
                        className="btn btn-secondary"
                      >
                        Back
                      </button>
                    </div>
                  )}

                  {/* Step 3: Confirm and Payment Info */}
                  {bookingStep === 3 && (
                    <div className="step-content">
                      <h3 className="step-title">Delivery Summary</h3>
                      
                      {/* Payment Notice */}
                      <div className="payment-notice">
                        <div className="payment-notice-header">
                          <span className="payment-icon">💳</span>
                          <span className="payment-title">Payment Information</span>
                        </div>
                        <div className="payment-notice-body">
                          <p className="payment-text">
                            <strong>Card or Bank Transfer Only</strong>
                          </p>
                          <p className="payment-text-secondary">
                            No cash payment is accepted. Please ensure you have your card or bank transfer ready for payment.
                          </p>
                        </div>
                      </div>

                      <div className="summary-card">
                        <div className="summary-row">
                          <span>Distance</span>
                          <span className="summary-value">{calculateDistance()} km</span>
                        </div>
                        <div className="summary-row">
                          <span>Delivery Type</span>
                          <span className="summary-value">🏍️ Bike</span>
                        </div>
                        <div className="summary-row">
                          <span>Est. Time</span>
                          <span className="summary-value">10-15 mins</span>
                        </div>
                        {packageImage && (
                          <div className="summary-row">
                            <span>Package Photo</span>
                            <span className="summary-value">✓ Included</span>
                          </div>
                        )}
                        <div className="summary-row total">
                          <span>Total</span>
                          <span className="summary-total">
                            ₦{DELIVERY_PRICE.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleBookRide}
                        className="btn btn-primary"
                        disabled={activeRides.length >= MAX_RIDES}
                      >
                        {activeRides.length >= MAX_RIDES ? 'Maximum Riders Reached' : 'Confirm Booking'}
                      </button>

                      <button
                        onClick={() => setBookingStep(2)}
                        className="btn btn-secondary"
                      >
                        Back
                      </button>
                    </div>
                  )}
                </>
              )}

              {searchingRider && (
                <div className="searching-container">
                  <div className="spinner-large"></div>
                  <h3 className="searching-title">Finding a rider near you...</h3>
                  <p className="searching-subtitle">This will only take a moment</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div className="content-wrapper">
              {activeRides.length === 0 ? (
                <div className="empty-state">
                  <PackageIcon />
                  <p>No active rides</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="link-button"
                  >
                    Book a ride
                  </button>
                </div>
              ) : (
                <>
                  <div className="active-rides-list">
                    <h3 className="active-rides-title">Your Active Rides</h3>
                    
                    {activeRides.map((ride, index) => (
                      <div key={ride.id} className="active-ride-content">
                        <div className="ride-number-badge">Ride #{index + 1}</div>
                        
                        <div className="status-banner success">
                          <CheckIcon />
                          <span>Rider on the way!</span>
                        </div>

                        {/* Live Map Tracking Simulation */}
                        <div className="tracking-card">
                          <div className="tracking-header">
                            <h4>Live Tracking</h4>
                            <p className="tracking-subtitle">(Real-time map tracking)</p>
                          </div>
                          
                          <div className="tracking-info">
                            <div className="tracking-row">
                              <span>Rider Location:</span>
                              <span className="tracking-coords">
                                {ride.riderLocation.lat?.toFixed(6)}, {ride.riderLocation.lng?.toFixed(6)}
                              </span>
                            </div>
                            <div className="tracking-row">
                              <span>Your Pickup:</span>
                              <span className="tracking-coords">
                                {ride.booking.pickupLat?.toFixed(6)}, {ride.booking.pickupLng?.toFixed(6)}
                              </span>
                            </div>
                            <div className="tracking-row highlight">
                              <span>Distance to you:</span>
                              <span className="tracking-distance">
                                {calculateRiderDistanceForRide(ride).toFixed(2)} km
                              </span>
                            </div>
                            <div className="tracking-row highlight">
                              <span>ETA:</span>
                              <span className="tracking-eta">
                                {Math.ceil(calculateRiderDistanceForRide(ride) * 3)} mins
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rider Info */}
                        <div className="rider-card">
                          <div className="rider-header">
                            <div className="rider-avatar">
                              {ride.rider.profileImage ? (
                                <img src={ride.rider.profileImage} alt={ride.rider.name} className="rider-avatar-img" />
                              ) : (
                                <UserIcon />
                              )}
                            </div>
                            <div className="rider-details">
                              <div className="rider-title">{ride.rider.name}</div>
                              <div className="rider-rating">
                                <StarIcon /> {ride.rider.rating} • {ride.rider.totalDeliveries} deliveries
                              </div>
                            </div>
                            <button 
                              className="call-button"
                              onClick={() => handleWhatsAppCall(ride.rider.phone)}
                              title="Call via WhatsApp"
                            >
                              <PhoneIcon />
                            </button>
                          </div>

                          <div className="rider-locations">
                            <div className="location-item">
                              <span className="location-icon pickup"><MapPinIcon /></span>
                              <div>
                                <div className="location-title">Pickup</div>
                                <div className="location-address-small">{ride.booking.pickup}</div>
                              </div>
                            </div>
                            <div className="location-item">
                              <span className="location-icon dropoff"><MapPinIcon /></span>
                              <div>
                                <div className="location-title">Dropoff</div>
                                <div className="location-address-small">{ride.booking.dropoff}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => cancelRide(ride.id)}
                          className="btn btn-danger"
                        >
                          Cancel This Ride
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Book Another Ride Section */}
                  {activeRides.length > 0 && activeRides.length < MAX_RIDES && (
                    <div className="book-another-container">
                      <h3 className="book-another-title">Need Another Delivery? 🚀</h3>
                      <p className="book-another-subtitle">
                        You can book up to {MAX_RIDES} riders simultaneously. 
                        {MAX_RIDES - activeRides.length} more available!
                      </p>
                      
                      <div className="book-another-buttons">
                        <button 
                          onClick={handleBookSameRide}
                          className="btn-book-same"
                        >
                          📦 Same Package
                        </button>
                        <button 
                          onClick={handleBookNewRide}
                          className="btn-book-new"
                        >
                          🆕 New Delivery
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OpenLayers Map Modal */}
      {showMapModal && (
        <div className="map-modal-overlay">
          <div className="map-modal">
            <div className="map-modal-header">
              <h3 className="map-modal-title">
                {mapSelectMode === 'pickup' ? 'Select Pickup Location' : 'Select Dropoff Location'}
              </h3>
              <button onClick={closeMapModal} className="map-modal-close">
                <CloseIcon />
              </button>
            </div>

            <div className="map-search-container">
              <input
                type="text"
                placeholder="Search for a location..."
                className="map-search-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchLocation(e.target.value);
                  }
                }}
              />
              <p className="search-hint">Press Enter to search</p>
            </div>

            <div className="map-container" ref={mapContainerRef}></div>

            <div className="map-selected-info">
              <div className="map-selected-address">
                <MapPinIcon />
                <span>{tempLocation.address || 'Click on map to select location'}</span>
              </div>
              {tempLocation.lat && (
                <div className="map-selected-coords">
                  {tempLocation.lat.toFixed(6)}, {tempLocation.lng.toFixed(6)}
                </div>
              )}
            </div>

            <div className="map-modal-actions">
              <button onClick={closeMapModal} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={confirmLocationSelection} 
                className="btn btn-primary"
                disabled={!tempLocation.lat}
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fancy Alert Modal */}
      {showFancyAlert && alertRider && (
        <div className="fancy-modal-overlay">
          <div className="fancy-modal">
            {/* Confetti Container */}
            {showConfetti && (
              <div className="confetti-container">
                {generateConfetti()}
              </div>
            )}
            
            {/* Explosion Effects */}
            {explosions.map((explosion) => (
              <div 
                key={explosion.id}
                className="explosion"
                style={{
                  left: `${explosion.x}%`,
                  top: `${explosion.y}%`,
                  animationDelay: `${Math.random() * 0.5}s`
                }}
              />
            ))}
            
            <div className="fancy-modal-header">
              <div className="success-icon-container">
                <div className="success-icon-circle">
                  <span className="success-icon">🚀</span>
                </div>
              </div>
              
              <h2 className="fancy-modal-title">Congratulations! 🎉</h2>
              <p className="fancy-modal-subtitle">Your delivery rider is on the way!</p>
            </div>
            
            <div className="fancy-modal-content">
              <div className="rider-highlight">
                <div className="rider-avatar-small">
                  {alertRider.name.charAt(0)}
                </div>
                <div className="rider-info-highlight">
                  <div className="rider-name-highlight">{alertRider.name}</div>
                  <div className="rider-details-highlight">
                    <span className="rating-star">⭐</span>
                    {alertRider.rating} • {alertRider.totalDeliveries} deliveries
                  </div>
                </div>
              </div>
              
              <p className="fancy-modal-message">
                Your rider will arrive in approximately <strong>10-15 minutes</strong>. 
                You can track their location in real-time on the Active Rides tab.
              </p>
              
              <p className="fancy-modal-message">
                Need another delivery? You can book up to <strong>{MAX_RIDES} riders</strong> at once!
              </p>
            </div>
            
            <div className="fancy-modal-footer">
              <button onClick={closeFancyAlert} className="btn-fancy-close">
                🎉 Awesome! Let's Go! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRideApp;