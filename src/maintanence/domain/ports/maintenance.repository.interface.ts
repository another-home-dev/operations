import { MaintenanceRequest } from '../entities/MaintenanceRequest.entity';

// This is just a contract. No TypeORM logic allowed here!
export const MAINTENANCE_REPOSITORY = Symbol('MAINTENANCE_REPOSITORY');

export interface FindAllParams {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  category?: string;
  studentId?: string;
}

export interface FindAllResult {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  data: MaintenanceRequest[];
}

export interface MaintenanceStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export interface IMaintenanceRepository {
  save(request: MaintenanceRequest): Promise<MaintenanceRequest>;
  findById(id: string): Promise<MaintenanceRequest | null>;
  findAll(params: FindAllParams): Promise<FindAllResult>;
  findStats(): Promise<MaintenanceStats>;
  saveImage(id: string, imageData: string): Promise<void>;
  findImage(id: string): Promise<string | null>;
}
