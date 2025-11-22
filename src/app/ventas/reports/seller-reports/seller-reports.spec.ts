import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SellerReportsComponent } from './seller-reports';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SellerReportsService } from '../../services/seller-reports.service';
import { UserService } from '../../../usuarios/services/user.service';
import { AuthService } from '../../../auth/services/auth.service';

describe('SellerReportsComponent', () => {
  let component: SellerReportsComponent;
  let fixture: ComponentFixture<SellerReportsComponent>;
  let mockSellerReportsService: jasmine.SpyObj<SellerReportsService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockSellerReportsService = jasmine.createSpyObj('SellerReportsService', [
      'getStatusSummary',
      'getClientsSummary',
      'getMonthlySummary'
    ]);
    
    mockUserService = jasmine.createSpyObj('UserService', ['getUsers']);
    
  mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole', 'getUserId']);
  // Default to Admin role for existing tests
  mockAuthService.getUserRole.and.returnValue('Administrador');
  mockAuthService.getUserId.and.returnValue('admin-1');

    await TestBed.configureTestingModule({
      imports: [
        SellerReportsComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: SellerReportsService, useValue: mockSellerReportsService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    mockUserService.getUsers.and.returnValue(of({
      users: [
        { 
          id: '1', 
          name: 'Vendedor 1', 
          email: 'v1@test.com', 
          role: 'Ventas', 
          created_at: '2024-01-01',
          institution_type: 'Ventas',
          phone: '3001234567'
        }
      ],
      total: 1
    }));

    fixture = TestBed.createComponent(SellerReportsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sellers on init', () => {
    fixture.detectChanges();
    expect(mockUserService.getUsers).toHaveBeenCalledWith(1, 100, 'role', 'Ventas');
    expect(component.sellers().length).toBe(1);
  });

  it('should load reports when seller is selected', () => {
    const mockStatusData = {
      seller_id: '1',
      summary: { total_orders: 10, total_amount: 1000000 },
      status_summary: [
        { status: 'Recibido', count: 5, percentage: 50, total_amount: 500000 }
      ]
    };

    const mockClientsData = {
      seller_id: '1',
      summary: { total_clients: 5, total_orders: 20, total_amount: 2000000 },
      clients: [
        { client_id: '1', client_name: 'Cliente 1', orders_count: 10, total_amount: 1000000 }
      ],
      pagination: {
        page: 1,
        per_page: 10,
        total: 5,
        total_pages: 1,
        has_next: false,
        has_prev: false,
        next_page: null,
        prev_page: null
      }
    };

    const mockMonthlyData = {
      seller_id: '1',
      period: { start_date: '2024-12-01', end_date: '2025-11-20', months: 12 },
      summary: { total_orders: 50, total_amount: 5000000 },
      monthly_data: [
        {
          year: 2025,
          month: 11,
          month_name: 'noviembre',
          month_short: 'nov',
          label: 'nov-2025',
          orders_count: 10,
          total_amount: 1000000
        }
      ]
    };

    mockSellerReportsService.getStatusSummary.and.returnValue(of(mockStatusData));
    mockSellerReportsService.getClientsSummary.and.returnValue(of(mockClientsData));
    mockSellerReportsService.getMonthlySummary.and.returnValue(of(mockMonthlyData));

    fixture.detectChanges();
    
    component.selectedSellerId.set('1');
    component.onSellerChange();

    expect(mockSellerReportsService.getStatusSummary).toHaveBeenCalledWith('1');
    expect(mockSellerReportsService.getClientsSummary).toHaveBeenCalled();
    expect(mockSellerReportsService.getMonthlySummary).toHaveBeenCalledWith('1');
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(1000000);
    expect(formatted).toContain('1.000.000');
  });

  it('should clear reports when no seller is selected', () => {
    component.selectedSellerId.set('');
    component.onSellerChange();
    
    expect(component.statusSummary()).toBeNull();
    expect(component.clientsSummary()).toBeNull();
    expect(component.monthlySummary()).toBeNull();
  });

  describe('donutChartConfig', () => {
    it('should return null when no status data', () => {
      component.statusSummary.set(null);
      expect(component.donutChartConfig()).toBeNull();
    });

    it('should build chart config with filtered statuses', () => {
      const statusData = {
        seller_id: '1',
        summary: { total_orders: 3, total_amount: 3000 },
        status_summary: [
          { status: 'Recibido', count: 0, percentage: 0, total_amount: 0 },
          { status: 'En Preparación', count: 2, percentage: 66.7, total_amount: 2000 },
          { status: 'Entregado', count: 1, percentage: 33.3, total_amount: 1000 }
        ]
      };
      component.statusSummary.set(statusData as any);
      const config = component.donutChartConfig();
      expect(config).not.toBeNull();
      expect(config!.data.datasets[0].data).toEqual([2,1]); // filtered out the 0 count item
      expect(config!.data.labels).toEqual(['En Preparación','Entregado']);
    });
  });

  describe('lineChartConfig', () => {
    it('should return null when no monthly data', () => {
      component.monthlySummary.set(null);
      expect(component.lineChartConfig()).toBeNull();
    });

    it('should reverse monthly data for labels', () => {
      const monthlyData = {
        seller_id: '1',
        period: { start_date: '2024-12-01', end_date: '2025-11-20', months: 12 },
        summary: { total_orders: 2, total_amount: 2000 },
        monthly_data: [
          { year: 2025, month: 11, month_name: 'noviembre', month_short: 'nov', label: 'nov-2025', orders_count: 1, total_amount: 1000 },
          { year: 2025, month: 10, month_name: 'octubre', month_short: 'oct', label: 'oct-2025', orders_count: 1, total_amount: 1000 }
        ]
      };
      component.monthlySummary.set(monthlyData as any);
      const config = component.lineChartConfig();
      expect(config).not.toBeNull();
      // Should reverse so older month (oct) appears first
      expect(config!.data.labels).toEqual(['oct. 2025','nov. 2025']);
      expect(config!.data.datasets[0].data).toEqual([1000,1000]);
    });
  });

  describe('pagination logic', () => {
    function setClients(totalPages: number) {
      component.clientsSummary.set({
        seller_id: '1',
        summary: { total_clients: 0, total_orders: 0, total_amount: 0 },
        clients: [],
        pagination: {
          page: component.currentPage(),
          per_page: 10,
          total: 0,
          total_pages: totalPages,
          has_next: false,
          has_prev: false,
          next_page: null,
          prev_page: null
        }
      } as any);
    }

    it('should show all pages when small total', () => {
      setClients(4);
      component.currentPage.set(2);
      expect(component.pageNumbers).toEqual([1,2,3,4]);
    });

    it('should show ellipsis in middle range', () => {
      setClients(12);
      component.currentPage.set(6);
      expect(component.pageNumbers).toEqual([1,-1,4,5,6,7,8,-2,12]);
    });

    it('should show ellipsis near end range', () => {
      setClients(12);
      component.currentPage.set(11);
      // Algorithm includes the additional start back-off page 7 when near end
      expect(component.pageNumbers).toEqual([1,-1,7,8,9,10,11,12]);
    });
  });

  describe('search handler', () => {
    it('should reset page to 1 on search change', () => {
      component.currentPage.set(5);
      component.searchClientName = 'Clinica';
      component.onSearchChange();
      expect(component.currentPage()).toBe(1);
    });
  });

  // Extracted out of the search handler test (was incorrectly nested inside an `it`)
  describe('role-based seller filtering', () => {
    it('should show all sellers for Admin role', () => {
      mockAuthService.getUserRole.and.returnValue('Administrador');
      mockAuthService.getUserId.and.returnValue('admin-1');

      mockUserService.getUsers.and.returnValue(of({
        users: [
          { id: '1', name: 'Vendedor 1', email: 'v1@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234567', created_at: '2024-01-01' },
          { id: '2', name: 'Vendedor 2', email: 'v2@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234568', created_at: '2024-01-02' },
          { id: '3', name: 'Vendedor 3', email: 'v3@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234569', created_at: '2024-01-03' }
        ],
        total: 3
      }));

      fixture.detectChanges();

      expect(component.sellers().length).toBe(3);
      expect(component.sellers()[0].name).toBe('Vendedor 1');
      expect(component.sellers()[1].name).toBe('Vendedor 2');
      expect(component.sellers()[2].name).toBe('Vendedor 3');
    });

    it('should show only current user for Ventas role', () => {
      mockAuthService.getUserRole.and.returnValue('Ventas');
      mockAuthService.getUserId.and.returnValue('2');

      // Mock report services since Ventas auto-loads their reports
      mockSellerReportsService.getStatusSummary.and.returnValue(of({
        seller_id: '2',
        summary: { total_orders: 10, total_amount: 1000000 },
        status_summary: []
      }));
      mockSellerReportsService.getClientsSummary.and.returnValue(of({
        seller_id: '2',
        summary: { total_clients: 5, total_orders: 20, total_amount: 2000000 },
        clients: [],
        pagination: {
          page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
          next_page: null,
          prev_page: null
        }
      }));
      mockSellerReportsService.getMonthlySummary.and.returnValue(of({
        seller_id: '2',
        period: { start_date: '2024-12-01', end_date: '2025-11-20', months: 12 },
        summary: { total_orders: 50, total_amount: 5000000 },
        monthly_data: []
      }));

      fixture.detectChanges();

      // For Ventas role, sellers list is not loaded (bypasses loadSellers)
      expect(mockUserService.getUsers).not.toHaveBeenCalled();
      expect(component.sellers().length).toBe(0);
      // But selectedSellerId should be set to current user
      expect(component.selectedSellerId()).toBe('2');
    });

    it('should auto-select current user for Ventas role', () => {
      mockAuthService.getUserRole.and.returnValue('Ventas');
      mockAuthService.getUserId.and.returnValue('2');

      mockUserService.getUsers.and.returnValue(of({
        users: [
          { id: '1', name: 'Vendedor 1', email: 'v1@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234567', created_at: '2024-01-01' },
          { id: '2', name: 'Vendedor 2', email: 'v2@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234568', created_at: '2024-01-02' }
        ],
        total: 2
      }));

      // Mock report services to avoid actual API calls
      mockSellerReportsService.getStatusSummary.and.returnValue(of({
        seller_id: '2',
        summary: { total_orders: 10, total_amount: 1000000 },
        status_summary: []
      }));
      mockSellerReportsService.getClientsSummary.and.returnValue(of({
        seller_id: '2',
        summary: { total_clients: 5, total_orders: 20, total_amount: 2000000 },
        clients: [],
        pagination: {
          page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
          next_page: null,
          prev_page: null
        }
      }));
      mockSellerReportsService.getMonthlySummary.and.returnValue(of({
        seller_id: '2',
        period: { start_date: '2024-12-01', end_date: '2025-11-20', months: 12 },
        summary: { total_orders: 50, total_amount: 5000000 },
        monthly_data: []
      }));

      fixture.detectChanges();

      expect(component.selectedSellerId()).toBe('2');
    });

    it('should load reports directly for Ventas user without loading sellers list', () => {
      mockAuthService.getUserRole.and.returnValue('Ventas');
      mockAuthService.getUserId.and.returnValue('999');

      // Mock report services
      mockSellerReportsService.getStatusSummary.and.returnValue(of({
        seller_id: '999',
        summary: { total_orders: 10, total_amount: 1000000 },
        status_summary: []
      }));
      mockSellerReportsService.getClientsSummary.and.returnValue(of({
        seller_id: '999',
        summary: { total_clients: 5, total_orders: 20, total_amount: 2000000 },
        clients: [],
        pagination: {
          page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
          next_page: null,
          prev_page: null
        }
      }));
      mockSellerReportsService.getMonthlySummary.and.returnValue(of({
        seller_id: '999',
        period: { start_date: '2024-12-01', end_date: '2025-11-20', months: 12 },
        summary: { total_orders: 50, total_amount: 5000000 },
        monthly_data: []
      }));

      fixture.detectChanges();

      // Verify sellers list is not loaded
      expect(mockUserService.getUsers).not.toHaveBeenCalled();
      expect(component.sellers().length).toBe(0);
      // But reports should be loaded directly
      expect(mockSellerReportsService.getStatusSummary).toHaveBeenCalledWith('999');
      expect(mockSellerReportsService.getClientsSummary).toHaveBeenCalledWith('999', jasmine.any(Number), jasmine.any(Number));
      expect(mockSellerReportsService.getMonthlySummary).toHaveBeenCalledWith('999');
    });

    it('should show all sellers for Compras role', () => {
      mockAuthService.getUserRole.and.returnValue('Compras');
      mockAuthService.getUserId.and.returnValue('compras-1');

      mockUserService.getUsers.and.returnValue(of({
        users: [
          { id: '1', name: 'Vendedor 1', email: 'v1@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234567', created_at: '2024-01-01' },
          { id: '2', name: 'Vendedor 2', email: 'v2@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234568', created_at: '2024-01-02' }
        ],
        total: 2
      }));

      fixture.detectChanges();

      expect(component.sellers().length).toBe(2);
    });

    it('should show all sellers for Logistica role', () => {
      mockAuthService.getUserRole.and.returnValue('Logistica');
      mockAuthService.getUserId.and.returnValue('logistica-1');

      mockUserService.getUsers.and.returnValue(of({
        users: [
          { id: '1', name: 'Vendedor 1', email: 'v1@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234567', created_at: '2024-01-01' },
          { id: '2', name: 'Vendedor 2', email: 'v2@test.com', role: 'Ventas', institution_type: 'Ventas', phone: '3001234568', created_at: '2024-01-02' }
        ],
        total: 2
      }));

      fixture.detectChanges();

      expect(component.sellers().length).toBe(2);
    });
  });
});
