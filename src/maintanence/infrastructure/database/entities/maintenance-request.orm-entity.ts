import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('maintenance_requests')
export class MaintenanceRequestOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ['Low', 'Medium', 'High'], default: 'Medium' })
  priority: 'Low' | 'Medium' | 'High';

  @Column({
    type: 'enum',
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending',
  })
  status: 'Pending' | 'In Progress' | 'Resolved';

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedStaff: string | null;

  @Column({ type: 'timestamp' })
  submittedDate: Date;

  // --- Technical Metadata (Only lives in the database) ---

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
