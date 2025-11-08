import { Component, Inject, OnInit, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Route, RouteClient, RouteDetail } from '../../models/route.model';
import { RoutesService } from '../../services/routes.service';

// Declarar google como variable global para TypeScript
declare var google: any;

// Coordenadas de la bodega principal (punto de inicio/fin)
const WAREHOUSE_LOCATION = { lat: 4.6097, lng: -74.0817, name: 'Bodega MediSupply', address: 'Bogotá, Colombia' };

@Component({
  selector: 'app-route-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './route-detail.html',
  styleUrls: ['./route-detail.scss'],
})
export class RouteDetailComponent implements OnInit, AfterViewInit {
  loading = signal(true);
  mapInitialized = signal(false);
  
  // Datos de la ruta
  route!: Route;
  clients: RouteClient[] = [];
  
  private map: any;
  private directionsService: any;
  private directionsRenderer: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public routeId: number,
    private dialogRef: MatDialogRef<RouteDetailComponent>,
    private routesService: RoutesService
  ) {}

  ngOnInit(): void {
    console.log('RouteDetailComponent initialized with route ID:', this.routeId);
    this.loadRouteDetail();
  }

  ngAfterViewInit(): void {
    // El mapa se inicializará después de cargar los datos
  }

  /**
   * Carga el detalle de la ruta desde el backend
   */
  private loadRouteDetail(): void {
    this.routesService.getRouteById(this.routeId).subscribe({
      next: (data: RouteDetail) => {
        console.log('Route detail loaded:', data);
        this.route = data.route;
        this.clients = data.clients;
        
        // Inicializar el mapa después de cargar los datos
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
    
    console.log(`Attempt ${attempts}:`, {
      hasGoogle: typeof google !== 'undefined',
      hasMaps: typeof google !== 'undefined' && google.maps,
      hasElement: !!mapElement
    });
    
    // Máximo 30 intentos (3 segundos)
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
   * Inicializa el mapa de Google Maps con la ruta de entrega
   */
  private initializeMap(mapElement: HTMLElement): void {
    try {
      console.log('Initializing map with element:', mapElement);
      
      if (!mapElement) {
        console.error('Map element is null');
        this.loading.set(false);
        return;
      }

      // Calcular el centro del mapa basado en las coordenadas de los clientes
      const center = this.calculateMapCenter();

      console.log('Creating map with center:', center);

      // Crear el mapa
      this.map = new google.maps.Map(mapElement, {
        zoom: 12,
        center: center,
        mapTypeControl: true,
        streetViewControl: true,
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

      console.log('Map created successfully');

      // Inicializar el servicio de direcciones
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true, // Suprimimos los marcadores por defecto para usar personalizados
        polylineOptions: {
          strokeColor: '#0d66d0',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });

      console.log('Adding markers...');
      // Agregar marcadores personalizados
      this.addCustomMarkers();

      console.log('Calculating route...');
      // Calcular y mostrar la ruta
      this.calculateAndDisplayRoute();

      this.mapInitialized.set(true);
      this.loading.set(false);
      console.log('Map initialization complete');
    } catch (error) {
      console.error('Error initializing map:', error);
      this.loading.set(false);
    }
  }

  /**
   * Calcula el centro del mapa basado en las ubicaciones
   */
  private calculateMapCenter(): { lat: number; lng: number } {
    if (this.clients.length === 0) {
      return { lat: WAREHOUSE_LOCATION.lat, lng: WAREHOUSE_LOCATION.lng };
    }

    // Calcular el promedio de todas las coordenadas (bodega + clientes)
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
      '#10b981', // Verde
      true
    );

    // Marcadores de clientes
    this.clients.forEach((client, index) => {
      this.createMarker(
        { lat: client.latitude, lng: client.longitude },
        client.name,
        client.address,
        index + 1,
        '#0d66d0', // Azul
        false
      );
    });

    // Marcador de fin (regreso a bodega)
    this.createMarker(
      { lat: WAREHOUSE_LOCATION.lat, lng: WAREHOUSE_LOCATION.lng },
      'Regreso a ' + WAREHOUSE_LOCATION.name,
      WAREHOUSE_LOCATION.address,
      this.clients.length + 1,
      '#ef4444', // Rojo
      false
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
    color: string,
    isStart: boolean
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

    // Agregar info window con información del punto
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: 'Poppins', sans-serif; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #41444f; font-size: 16px;">${title}</h3>
          <p style="margin: 0; color: #6d7183; font-size: 14px;">${address}</p>
          <p style="margin: 4px 0 0 0; color: #0d66d0; font-size: 12px;">
            ${isStart ? '📍 Punto de inicio' : index === this.clients.length + 1 ? '🏁 Punto final' : '📦 Punto de entrega'}
          </p>
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
      console.warn('No clients to calculate route');
      return;
    }

    // Punto de origen (bodega)
    const origin = new google.maps.LatLng(WAREHOUSE_LOCATION.lat, WAREHOUSE_LOCATION.lng);
    
    // Punto de destino (regreso a bodega)
    const destination = new google.maps.LatLng(WAREHOUSE_LOCATION.lat, WAREHOUSE_LOCATION.lng);
    
    // Puntos intermedios (clientes)
    const waypoints = this.clients.map(client => ({
      location: new google.maps.LatLng(client.latitude, client.longitude),
      stopover: true
    }));

    const request = {
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    };

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setDirections(result);
        
        // Calcular distancia y duración total
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;
        
        route.legs.forEach((leg: any) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });

        console.log(`Distancia total: ${(totalDistance / 1000).toFixed(2)} km`);
        console.log(`Duración estimada: ${Math.round(totalDuration / 60)} minutos`);
      } else {
        console.error('Error calculating route:', status);
      }
    });
  }

  /**
   * Cierra el diálogo
   */
  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day < 10 ? '0' + day : day}, ${year}`;
  }
}
