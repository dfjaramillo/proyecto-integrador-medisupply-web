import { Component, Input, OnInit, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouteClient } from '../../models/route.model';
import { RoutesService } from '../../services/routes.service';

// Declarar google como variable global para TypeScript
declare var google: any;

// Coordenadas de la bodega principal (punto de inicio/fin)
const WAREHOUSE_LOCATION = { lat: 4.6097, lng: -74.0817, name: 'Bodega MediSupply', address: 'Bogotá, Colombia' };

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './route-map.html',
  styleUrls: ['./route-map.scss'],
})
export class RouteMapComponent implements OnInit, AfterViewInit {
  @Input() routeId!: number;
  // Habilita la inicialización del mapa durante pruebas unitarias (Karma)
  @Input() enableMapInitInTests = false;
  
  loading = signal(true);
  clients: RouteClient[] = [];
  // Referencias expuestas para facilitar pruebas
  public markers: any[] = [];
  public lastDirectionsRequest: any | null = null;
  
  private map: any;
  private directionsService: any;
  private directionsRenderer: any;

  constructor(private routesService: RoutesService) {}

  ngOnInit(): void {
    console.log('RouteMapComponent initialized with route ID:', this.routeId);
  }

  ngAfterViewInit(): void {
    // Cargar datos y luego inicializar mapa
    this.loadRouteDetail();
  }

  /**
   * Carga el detalle de la ruta desde el backend
   */
  private loadRouteDetail(): void {
    this.routesService.getRouteById(this.routeId).subscribe({
      next: (data) => {
        console.log('Route detail loaded:', data);
        this.clients = data.clients;
        
        // En pruebas unitarias (Karma), evitamos inicializar Google Maps para no depender del DOM ni del script externo
        const isKarma = typeof (window as any) !== 'undefined' && !!(window as any).__karma__;
        if (isKarma && !this.enableMapInitInTests) {
          this.loading.set(false);
          return;
        }

        // Inicializar el mapa después de cargar los datos (en entorno real)
        setTimeout(() => {
          this.waitForGoogleMapsAndElement(0);
        }, 200);
      },
      error: (error) => {
        console.error('Error loading route detail:', error);
        this.loading.set(false);
      }
    });
  }

  /**
   * Espera a que Google Maps API esté disponible y el elemento del mapa esté en el DOM
   */
  private waitForGoogleMapsAndElement(attempts: number): void {
    const mapElement = document.querySelector('.google-map') as HTMLElement;
    
    if (attempts >= 30) {
      console.error('Failed to initialize map after 30 attempts');
      this.loading.set(false);
      return;
    }

    if (typeof google !== 'undefined' && google.maps && mapElement) {
      console.log('Everything ready! Initializing map...');
      this.initializeMap(mapElement);
    } else {
      setTimeout(() => {
        this.waitForGoogleMapsAndElement(attempts + 1);
      }, 100);
    }
  }

  /**
   * Calcula el centro del mapa basado en las ubicaciones
   */
  private calculateMapCenter(): { lat: number; lng: number } {
    if (this.clients.length === 0) {
      return { lat: WAREHOUSE_LOCATION.lat, lng: WAREHOUSE_LOCATION.lng };
    }

    let totalLat = WAREHOUSE_LOCATION.lat;
    let totalLng = WAREHOUSE_LOCATION.lng;
    let count = 1;

    this.clients.forEach(client => {
      totalLat += client.latitude;
      totalLng += client.longitude;
      count++;
    });

    return {
      lat: totalLat / count,
      lng: totalLng / count
    };
  }

  // Método auxiliar para pruebas
  public getMapCenterForTest(): { lat: number; lng: number } {
    return this.calculateMapCenter();
  }

  /**
   * Inicializa el mapa de Google Maps con la ruta de entrega
   */
  private initializeMap(mapElement: HTMLElement): void {
    try {
      const center = this.calculateMapCenter();

      // Crear el mapa
      this.map = new google.maps.Map(mapElement, {
        zoom: 12,
        center: center,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      // Inicializar el servicio de direcciones
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#0d66d0',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });

      // Agregar marcadores
      this.addCustomMarkers();

      // Calcular y mostrar la ruta
      this.calculateAndDisplayRoute();

      this.loading.set(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      this.loading.set(false);
    }
  }

  /**
   * Agrega marcadores personalizados para cada punto de la ruta
   */
  private addCustomMarkers(): void {
    // Marcador de inicio (bodega)
    this.createMarker(
      { lat: WAREHOUSE_LOCATION.lat, lng: WAREHOUSE_LOCATION.lng },
      WAREHOUSE_LOCATION.name,
      WAREHOUSE_LOCATION.address,
      0,
      '#10b981'
    );

    // Marcadores de clientes
    this.clients.forEach((client, index) => {
      this.createMarker(
        { lat: client.latitude, lng: client.longitude },
        client.name,
        client.address,
        index + 1,
        '#0d66d0'
      );
    });

    // Marcador de fin (regreso a bodega)
    this.createMarker(
      { lat: WAREHOUSE_LOCATION.lat, lng: WAREHOUSE_LOCATION.lng },
      'Regreso a ' + WAREHOUSE_LOCATION.name,
      WAREHOUSE_LOCATION.address,
      this.clients.length + 1,
      '#ef4444'
    );
  }

  /**
   * Crea un marcador personalizado
   */
  private createMarker(
    position: { lat: number; lng: number },
    title: string,
    address: string,
    index: number,
    color: string
  ): void {
    const marker = new google.maps.Marker({
      position,
      map: this.map,
      title,
      label: {
        text: (index + 1).toString(),
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px'
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 3
      }
    });

    // Guardar para verificaciones en pruebas
    this.markers.push(marker);

    // Info window al hacer clic
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: 'Poppins', sans-serif; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #41444f; font-size: 16px;">${title}</h3>
          <p style="margin: 0; color: #6d7183; font-size: 14px;">${address}</p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(this.map, marker);
    });
  }

  /**
   * Calcula y muestra la ruta óptima entre los puntos
   */
  private calculateAndDisplayRoute(): void {
    if (this.clients.length === 0) {
      return;
    }

    const origin = new google.maps.LatLng(WAREHOUSE_LOCATION.lat, WAREHOUSE_LOCATION.lng);
    const destination = new google.maps.LatLng(WAREHOUSE_LOCATION.lat, WAREHOUSE_LOCATION.lng);
    
    const waypoints = this.clients.map(client => ({
      location: new google.maps.LatLng(client.latitude, client.longitude),
      stopover: true
    }));

    const request = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    };

    // Exponer la última solicitud para pruebas
    this.lastDirectionsRequest = request;

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setDirections(result);
      } else {
        console.error('Directions request failed:', status);
      }
    });
  }
}
