import { Notice } from '../entities/Notice.entity';

// This is just a contract. No TypeORM logic allowed here!
export const NOTICE_REPOSITORY = Symbol('NOTICE_REPOSITORY');

export interface FindAllNoticeParams {
  page?: number;
  pageSize?: number;
}

export interface FindAllNoticeResult {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  data: Notice[];
}

export interface INoticeRepository {
  save(notice: Notice): Promise<Notice>;
  findById(id: string): Promise<Notice | null>;
  findAll(params: FindAllNoticeParams): Promise<FindAllNoticeResult>;
  remove(id: string): Promise<void>;
}
