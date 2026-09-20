import { VisitorRequest } from '../../../domain/entities/VisitorRequest.entity';
import { VisitorRequestOrmEntity } from '../entities/visitor-request.orm-entity';

export class VisitorRequestMapper {
  // Translates Database Data -> Pure Domain Object
  static toDomain(raw: VisitorRequestOrmEntity): VisitorRequest {
    return new VisitorRequest(
      raw.id,
      raw.studentId,
      raw.roomId,
      raw.visitorName,
      raw.visitorContact,
      raw.purpose,
      raw.visitDate,
      raw.visitTime,
      raw.status,
    );
  }

  // Translates Pure Domain Object -> Database Format
  static toPersistence(domain: VisitorRequest): VisitorRequestOrmEntity {
    const ormEntity = new VisitorRequestOrmEntity();

    ormEntity.id = domain.id;
    ormEntity.studentId = domain.studentId;
    ormEntity.roomId = domain.roomId;
    ormEntity.visitorName = domain.visitorName;
    ormEntity.visitorContact = domain.visitorContact;
    ormEntity.purpose = domain.purpose;
    ormEntity.visitDate = domain.visitDate;
    ormEntity.visitTime = domain.visitTime;
    ormEntity.status = domain.status;

    return ormEntity;
  }
}
