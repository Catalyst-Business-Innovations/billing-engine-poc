import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';
import { Company } from '../models/company.interface';

/**
 * Company Service
 *
 * Simulates REST API endpoints for company management.
 * In production, replace the JSON file loading with actual HTTP calls to backend APIs.
 *
 * API Endpoints Pattern:
 * - GET    /api/companies          -> getAllCompanies()
 * - GET    /api/companies/:id      -> getCompanyById(id)
 * - POST   /api/companies          -> createCompany(company)
 * - PUT    /api/companies/:id      -> updateCompany(id, company)
 * - DELETE /api/companies/:id      -> deleteCompany(id)
 * - GET    /api/companies/search   -> searchCompanies(query)
 */
@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly API_BASE_URL = '/assets/api';
  private companiesCache$ = new BehaviorSubject<Company[]>([]);

  constructor(private http: HttpClient) {
    this.loadCompanies();
  }

  /**
   * Load companies from JSON file (simulates API call)
   * @private
   */
  private loadCompanies(): void {
    this.http
      .get<Company[]>(`${this.API_BASE_URL}/companies.json`)
      .pipe(tap(companies => this.companiesCache$.next(companies)))
      .subscribe();
  }

  /**
   * GET /api/companies
   * Retrieve all companies
   * @returns Observable<Company[]>
   */
  getAllCompanies(): Observable<Company[]> {
    // Simulate API delay
    return this.companiesCache$.asObservable().pipe(delay(300));
  }

  /**
   * GET /api/companies/:id
   * Retrieve a single company by ID
   * @param id Company ID
   * @returns Observable<Company | undefined>
   */
  getCompanyById(id: number): Observable<Company | undefined> {
    return this.companiesCache$.pipe(
      map(companies => companies.find(c => c.id === id)),
      delay(200)
    );
  }

  /**
   * GET /api/companies/search?q=query
   * Search companies by name or ID
   * @param query Search query
   * @returns Observable<Company[]>
   */
  searchCompanies(query: string): Observable<Company[]> {
    if (!query || !query.trim()) {
      return this.getAllCompanies();
    }

    const searchLower = query.toLowerCase();
    return this.companiesCache$.pipe(
      map(companies =>
        companies.filter(c => c.name.toLowerCase().includes(searchLower) || c.code.toLowerCase().includes(searchLower))
      ),
      delay(200)
    );
  }

  /**
   * POST /api/companies
   * Create a new company
   * @param company Company data
   * @returns Observable<Company>
   */
  createCompany(company: Omit<Company, 'id'>): Observable<Company> {
    // Simulate API call - in real implementation, backend generates ID
    const currentCompanies = this.companiesCache$.value;
    const maxId = Math.max(...currentCompanies.map(c => c.id), 0);
    const newId = maxId + 1;
    const newCompany: Company = {
      ...company,
      id: newId
    };

    const updatedCompanies = [...currentCompanies, newCompany];
    this.companiesCache$.next(updatedCompanies);

    return of(newCompany).pipe(delay(500));
  }

  /**
   * PUT /api/companies/:id
   * Update an existing company
   * @param id Company ID
   * @param company Updated company data
   * @returns Observable<Company | null>
   */
  updateCompany(id: number, company: Partial<Company>): Observable<Company | null> {
    const currentCompanies = this.companiesCache$.value;
    const index = currentCompanies.findIndex(c => c.id === id);

    if (index === -1) {
      return of(null).pipe(delay(200));
    }

    const updatedCompany: Company = {
      ...currentCompanies[index],
      ...company,
      id // Preserve original ID
    };

    const updatedCompanies = [...currentCompanies];
    updatedCompanies[index] = updatedCompany;
    this.companiesCache$.next(updatedCompanies);

    return of(updatedCompany).pipe(delay(500));
  }

  /**
   * DELETE /api/companies/:id
   * Delete a company
   * @param id Company ID
   * @returns Observable<boolean>
   */
  deleteCompany(id: number): Observable<boolean> {
    const currentCompanies = this.companiesCache$.value;
    const filtered = currentCompanies.filter(c => c.id !== id);

    if (filtered.length === currentCompanies.length) {
      return of(false).pipe(delay(200)); // Not found
    }

    this.companiesCache$.next(filtered);
    return of(true).pipe(delay(500));
  }

  /**
   * Force refresh companies from source
   * @returns Observable<Company[]>
   */
  refreshCompanies(): Observable<Company[]> {
    this.loadCompanies();
    return this.getAllCompanies();
  }
}
