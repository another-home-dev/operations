import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NoticeService } from './notice.service';
import { INoticeRepository } from './domain/ports/notice.repository.interface';
import { Notice } from './domain/entities/Notice.entity';

describe('NoticeService', () => {
    let service: NoticeService;
    let mockRepo: jest.Mocked<INoticeRepository>;

    const student = { userId: 'student-1', roles: ['student'] };
    const warden = { userId: 'warden-1', roles: ['warden'] };

    beforeEach(() => {
        mockRepo = {
            save: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            remove: jest.fn(),
        };
        service = new NoticeService(mockRepo);
    });

    describe('createNotice', () => {
        it('forbids a student from publishing a notice', async () => {
            await expect(
                service.createNotice({ title: 'Hi', content: 'Body' } as any, student),
            ).rejects.toThrow(ForbiddenException);
        });

        it('lets a warden publish, recording them as the author', async () => {
            mockRepo.save.mockImplementation(async (n) => n);

            const notice = await service.createNotice({ title: 'Water outage', content: 'Tomorrow 9am-5pm' } as any, warden);

            expect(notice.authorId).toBe('warden-1');
            expect(notice.title).toBe('Water outage');
        });
    });

    describe('findAll', () => {
        it('is readable by any authenticated user, no role check', async () => {
            mockRepo.findAll.mockResolvedValue({ currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 10, data: [] });

            await expect(service.findAll({} as any)).resolves.toBeDefined();
        });
    });

    describe('updateNotice', () => {
        it('forbids a student from editing a notice', async () => {
            await expect(service.updateNotice('n-1', { title: 'x' } as any, student)).rejects.toThrow(ForbiddenException);
        });

        it('throws NotFoundException when the notice does not exist', async () => {
            mockRepo.findById.mockResolvedValue(null);

            await expect(service.updateNotice('missing', { title: 'x' } as any, warden)).rejects.toThrow(NotFoundException);
        });

        it('only changes the fields provided, leaving the rest untouched', async () => {
            const notice = new Notice('n-1', 'warden-1', 'Old title', 'Old content', new Date());
            mockRepo.findById.mockResolvedValue(notice);
            mockRepo.save.mockImplementation(async (n) => n);

            const updated = await service.updateNotice('n-1', { title: 'New title' } as any, warden);

            expect(updated.title).toBe('New title');
            expect(updated.content).toBe('Old content');
        });
    });

    describe('removeNotice', () => {
        it('forbids a student from deleting a notice', async () => {
            await expect(service.removeNotice('n-1', student)).rejects.toThrow(ForbiddenException);
        });

        it('throws NotFoundException when the notice does not exist', async () => {
            mockRepo.findById.mockResolvedValue(null);

            await expect(service.removeNotice('missing', warden)).rejects.toThrow(NotFoundException);
        });

        it('removes the notice for a warden', async () => {
            const notice = new Notice('n-1', 'warden-1', 'Title', 'Content', new Date());
            mockRepo.findById.mockResolvedValue(notice);

            const result = await service.removeNotice('n-1', warden);

            expect(result).toEqual({ success: true });
            expect(mockRepo.remove).toHaveBeenCalledWith('n-1');
        });
    });
});
