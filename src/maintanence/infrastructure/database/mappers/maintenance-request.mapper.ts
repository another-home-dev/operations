import { MaintenanceRequest } from '../../../domain/entities/MaintenanceRequest.entity';
import { MaintenanceRequestOrmEntity } from '../entities/maintenance-request.orm-entity';

export class MaintenanceRequestMapper {
  // Translates Database Data -> Pure Domain Object
  static toDomain(raw: MaintenanceRequestOrmEntity): MaintenanceRequest {
    // We skip createdAt, updatedAt, and deletedAt because the domain doesn't care about them
    return new MaintenanceRequest(
      raw.id,
      raw.studentId,
      raw.roomId,
      raw.category,
      raw.title,
      raw.description,
      raw.priority,
      raw.status,
      raw.assignedStaff,
      raw.submittedDate,
      raw.hasImage,
    );
  }

  // Translates Pure Domain Object -> Database Format
  static toPersistence(domain: MaintenanceRequest): MaintenanceRequestOrmEntity {
    const ormEntity = new MaintenanceRequestOrmEntity();

    ormEntity.id = domain.id;
    ormEntity.studentId = domain.studentId;
    ormEntity.roomId = domain.roomId;
    ormEntity.category = domain.category;
    ormEntity.title = domain.title;
    ormEntity.description = domain.description;
    ormEntity.priority = domain.priority;
    ormEntity.status = domain.status;
    ormEntity.assignedStaff = domain.assignedStaff;
    ormEntity.submittedDate = domain.submittedDate;
    ormEntity.hasImage = domain.hasImage;
    // imageData is deliberately left unset: save() then leaves the stored image
    // untouched on status updates. It is written once, via saveImage().

    // TypeORM will automatically generate createdAt/updatedAt when this is saved.

    return ormEntity;
  }
}
