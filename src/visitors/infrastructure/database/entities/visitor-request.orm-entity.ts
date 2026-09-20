import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('visitor_requests')
export class VisitorRequestOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'varchar', length: 100 })
  visitorName: string;

  @Column({ type: 'varchar', length: 30 })
  visitorContact: string;

  @Column({ type: 'varchar', length: 150 })
  purpose: string;

  @Column({ type: 'varchar', length: 20 })
  visitDate: string;

  @Column({ type: 'varchar', length: 20 })
  visitTime: string;

  @Column({ type: 'enum', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' })
  status: 'Pending' | 'Approved' | 'Rejected';

  // --- Technical Metadata (Only lives in the database) ---

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
