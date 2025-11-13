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
      delivery_date: '2025-11-20',
      orders_count: 2,
      created_at: '2025-11-10T10:00:00',
      updated_at: '2025-11-10T10:00:00'
    },
    clients: [
      {
        id: 'client-1',
        name: 'Cliente 1',
        email: 'cliente1@test.com',
        address: 'Calle 123',
        phone: '1234567890',
        latitude: 4.6107,
        longitude: -74.0810
      },
      {
        id: 'client-2',
        name: 'Cliente 2',
        email: 'cliente2@test.com',
        address: 'Calle 456',
        phone: '0987654321',
        latitude: 4.6117,
        longitude: -74.0820
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
    (window as any).__karma__ = {}; // simulate Karma
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load route detail and skip map init with enableMapInitInTests=false (no markers)', fakeAsync(() => {
    component.enableMapInitInTests = false;
    fixture.detectChanges();
    tick(300); // allow any timers to settle
    expect(mockRoutesService.getRouteById).toHaveBeenCalledWith(1);
    expect(component.clients.length).toBe(2);
    expect(component.markers.length).toBe(0);
    expect(component.lastDirectionsRequest).toBeNull();
    expect(component.loading()).toBeFalse();
  }));

  it('should initialize map and build markers/directions when enableMapInitInTests=true', fakeAsync(() => {
    component.enableMapInitInTests = true;
    setupGoogleStub();
    fixture.detectChanges();
    tick(250); // 200ms setTimeout + buffer
    expect(component.clients.length).toBe(2);
    // warehouse start + 2 clients + warehouse end
    expect(component.markers.length).toBe(4);
    expect(component.lastDirectionsRequest).not.toBeNull();
    expect(component.lastDirectionsRequest.waypoints.length).toBe(2);
    expect(component.loading()).toBeFalse();
  }));

  it('should calculate map center averaging warehouse + clients', fakeAsync(() => {
    component.enableMapInitInTests = false;
    fixture.detectChanges();
    tick(10);
    const center = component.getMapCenterForTest();
    const expectedLat = (4.6097 + 4.6107 + 4.6117) / 3;
    const expectedLng = (-74.0817 + -74.0810 + -74.0820) / 3;
    expect(center.lat).toBeCloseTo(expectedLat, 5);
    expect(center.lng).toBeCloseTo(expectedLng, 5);
  }));

  it('should handle zero clients gracefully (center = warehouse)', fakeAsync(() => {
    mockRoutesService.getRouteById.and.returnValue(of({ route: mockRouteDetail.route, clients: [] }));
    fixture = TestBed.createComponent(RouteMapComponent);
    component = fixture.componentInstance;
    component.routeId = 1;
    component.enableMapInitInTests = false;
    fixture.detectChanges();
    tick(50);
    const center = component.getMapCenterForTest();
    expect(center.lat).toBeCloseTo(4.6097, 5);
    expect(center.lng).toBeCloseTo(-74.0817, 5);
    expect(component.markers.length).toBe(0);
    expect(component.lastDirectionsRequest).toBeNull();
  }));

  it('should set loading false on error while fetching route detail', fakeAsync(() => {
    mockRoutesService.getRouteById.and.returnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(RouteMapComponent);
    component = fixture.componentInstance;
    component.routeId = 1;
    component.enableMapInitInTests = false;
    fixture.detectChanges();
    tick(10);
    expect(component.loading()).toBeFalse();
    expect(component.clients.length).toBe(0);
  }));
});
