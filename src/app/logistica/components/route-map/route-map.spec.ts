import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouteMapComponent } from './route-map';
import { RoutesService } from '../../services/routes.service';
import { of, throwError } from 'rxjs';

// Stub global google object for map-related tests
declare global {
  interface Window { google: any; }
}

function setupGoogleStub() {
  (window as any).google = {
    maps: {
      Map: class { constructor(public el: any, public opts: any) {} },
      Marker: class { constructor(public opts: any) {} addListener() {} },
      InfoWindow: class { constructor(public opts: any) {} open() {} },
      LatLng: class { constructor(public lat: number, public lng: number) {} },
      DirectionsService: class { route(req: any, cb: any) { cb({ routes: [] }, 'OK'); } },
      DirectionsRenderer: class { constructor(public opts: any) {} setDirections(_: any) {} },
      DirectionsStatus: { OK: 'OK' },
      TravelMode: { DRIVING: 'DRIVING' },
      SymbolPath: { CIRCLE: 'CIRCLE' }
    }
  };
}

describe('RouteMapComponent', () => {
  let component: RouteMapComponent;
  let fixture: ComponentFixture<RouteMapComponent>;
  let mockRoutesService: jasmine.SpyObj<RoutesService>;

  const mockRouteDetail = {
    route: {
      id: 1,
      route_code: 'ROU-0001',
      assigned_truck: 'TRK-001',
      delivery_date: '2025-11-10',
      orders_count: 2,
      created_at: '2025-11-08T10:00:00',
      updated_at: '2025-11-08T10:00:00'
    },
    clients: [
      {
        id: 'client-1',
        name: 'Cliente 1',
        email: 'cliente1@test.com',
        address: 'Calle 123',
        phone: '1234567890',
        latitude: 4.6097,
        longitude: -74.0817
      },
      {
        id: 'client-2',
        name: 'Cliente 2',
        email: 'cliente2@test.com',
        address: 'Calle 456',
        phone: '0987654321',
        latitude: 4.6500,
        longitude: -74.1000
      }
    ]
  };

  beforeEach(async () => {
    mockRoutesService = jasmine.createSpyObj('RoutesService', ['getRouteById']);
    mockRoutesService.getRouteById.and.returnValue(of(mockRouteDetail));

    await TestBed.configureTestingModule({
      imports: [RouteMapComponent],
      providers: [
        { provide: RoutesService, useValue: mockRoutesService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RouteMapComponent);
    component = fixture.componentInstance;
    component.routeId = 1;
    component.enableMapInitInTests = true; // allow map init under Karma for coverage
    setupGoogleStub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load route detail on init', () => {
    fixture.detectChanges();
    expect(mockRoutesService.getRouteById).toHaveBeenCalledWith(1);
    expect(component.clients.length).toBe(2);
  });

  it('should initialize markers after route detail load', fakeAsync(() => {
    fixture.detectChanges();
    // advance timers for setTimeout in component
    tick(250); // 200ms + buffer
    expect(component.markers.length).toBeGreaterThan(0);
    // Expect markers: start warehouse + 2 clients + end warehouse = 4
    expect(component.markers.length).toBe(4);
  }));

  it('should calculate map center including warehouse and clients', () => {
    fixture.detectChanges();
    const center = component.getMapCenterForTest();
    // Simple sanity assertions: center lat between min/max of points
    const lats = [4.6097, 4.6097, 4.65];
    const lngs = [-74.0817, -74.0817, -74.10];
    expect(center.lat).toBeGreaterThanOrEqual(Math.min(...lats));
    expect(center.lat).toBeLessThanOrEqual(Math.max(...lats));
    expect(center.lng).toBeGreaterThanOrEqual(Math.min(...lngs));
    expect(center.lng).toBeLessThanOrEqual(Math.max(...lngs));
  });

  it('should build a directions request with waypoints', fakeAsync(() => {
    fixture.detectChanges();
    tick(250);
    const request = component.lastDirectionsRequest;
    expect(request).toBeTruthy();
    expect(request.waypoints.length).toBe(2);
    expect(request.travelMode).toBe((window as any).google.maps.TravelMode.DRIVING);
    expect(request.optimizeWaypoints).toBeTrue();
  }));

  it('should handle zero clients gracefully (no markers beyond warehouse start/end)', fakeAsync(() => {
    mockRoutesService.getRouteById.and.returnValue(of({ route: mockRouteDetail.route, clients: [] }));
    fixture = TestBed.createComponent(RouteMapComponent);
    component = fixture.componentInstance;
    component.routeId = 1;
    component.enableMapInitInTests = true;
    setupGoogleStub();
    fixture.detectChanges();
    tick(250);
    // markers: start warehouse + end warehouse = 2
    expect(component.markers.length).toBe(2);
    expect(component.lastDirectionsRequest).toBeNull(); // route not calculated
  }));

  it('should handle error when loading route detail', () => {
    mockRoutesService.getRouteById.and.returnValue(
      throwError(() => new Error('Error loading route'))
    );

    fixture.detectChanges();
    expect(component.loading()).toBe(false);
  });

  it('should have correct number of clients', () => {
    fixture.detectChanges();
    expect(component.clients.length).toBe(2);
    expect(component.clients[0].name).toBe('Cliente 1');
  });

  it('should set loading to true initially', () => {
    expect(component.loading()).toBe(true);
  });

  it('should require routeId input', () => {
    expect(component.routeId).toBeDefined();
  });
});
