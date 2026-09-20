import { Notice } from '../../../domain/entities/Notice.entity';
import { NoticeOrmEntity } from '../entities/notice.orm-entity';

export class NoticeMapper {
  // Translates Database Data -> Pure Domain Object
  static toDomain(raw: NoticeOrmEntity): Notice {
    return new Notice(raw.id, raw.authorId, raw.title, raw.content, raw.publishedDate);
  }

  // Translates Pure Domain Object -> Database Format
  static toPersistence(domain: Notice): NoticeOrmEntity {
    const ormEntity = new NoticeOrmEntity();

    ormEntity.id = domain.id;
    ormEntity.authorId = domain.authorId;
    ormEntity.title = domain.title;
    ormEntity.content = domain.content;
    ormEntity.publishedDate = domain.publishedDate;

    return ormEntity;
  }
}
