import { VisitorRequest } from '../entities/VisitorRequest.entity';

// This is just a contract. No TypeORM logic allowed here!
export const VISITOR_REPOSITORY = Symbol('VISITOR_REPOSITORY');

export interface FindAllVisitorParams {
  page?: number;
  pageSize?: number;
  status?: string;
  studentId?: string;
}

export interface FindAllVisitorResult {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  data: VisitorRequest[];
}

export interface IVisitorRepository {
  save(request: VisitorRequest): Promise<VisitorRequest>;
  findById(id: string): Promise<VisitorRequest | null>;
  findAll(params: FindAllVisitorParams): Promise<FindAllVisitorResult>;
}
