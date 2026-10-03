import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { IMaintenanceRepository } from './domain/ports/maintenance.repository.interface';
import { MaintenanceRequest } from './domain/entities/MaintenanceRequest.entity';
import { notifyUser } from '../common/notification-client';

jest.mock('../common/notification-client', () => ({ notifyUser: jest.fn() }));

describe('MaintenanceService', () => {
    let service: MaintenanceService;
    let mockRepo: jest.Mocked<IMaintenanceRepository>;

    const student = { userId: 'student-1', roles: ['student'] };
    const otherStudent = { userId: 'student-2', roles: ['student'] };
    const warden = { userId: 'warden-1', roles: ['warden'] };

    beforeEach(() => {
        mockRepo = {
            save: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findStats: jest.fn(),
            saveImage: jest.fn(),
            findImage: jest.fn(),
        };
        service = new MaintenanceService(mockRepo);
        (notifyUser as jest.Mock).mockClear();
    });

    const baseDto = { roomId: 'room-1', category: 'Plumbing', title: 'Leak', description: 'Tap leaking', priority: 'Medium' };
    const photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

    describe('findAll', () => {
        it("scopes a student to their own requests, ignoring any studentId they send", async () => {
            await service.findAll({ page: 1, studentId: 'accommodation-student-uuid' }, student);

            expect(mockRepo.findAll).toHaveBeenCalledWith({ page: 1, studentId: 'student-1' });
        });

        it('lets staff list every request and filter by any student', async () => {
            await service.findAll({ studentId: 'student-2' }, warden);

            expect(mockRepo.findAll).toHaveBeenCalledWith({ studentId: 'student-2' });
        });
    });

    describe('createRequest', () => {
        it('takes studentId from the authenticated caller, never the request body', async () => {
            mockRepo.save.mockImplementation(async (r) => r);

            const created = await service.createRequest(baseDto as any, student);

            expect(created.studentId).toBe('student-1');
            expect(created.status).toBe('Pending');
            expect(created.hasImage).toBe(false);
            expect(mockRepo.saveImage).not.toHaveBeenCalled();
        });

        it('stores an attached photo against the new request', async () => {
            mockRepo.save.mockImplementation(async (r) => r);

            const created = await service.createRequest({ ...baseDto, imageData: photo } as any, student);

            expect(created.hasImage).toBe(true);
            expect(mockRepo.saveImage).toHaveBeenCalledWith(created.id, photo);
        });

        it('rejects imageData that is not an image data URL', async () => {
            await expect(
                service.createRequest({ ...baseDto, imageData: 'data:text/html;base64,PHNjcmlwdD4=' } as any, student),
            ).rejects.toThrow(BadRequestException);
            expect(mockRepo.save).not.toHaveBeenCalled();
        });
    });

    describe('getImage', () => {
        const withImage = () =>
            new MaintenanceRequest('req-1', 'student-1', 'room-1', 'Plumbing', 'Leak', 'desc', 'Low', 'Pending', null, new Date(), true);

        it('returns the photo to the student who filed the request', async () => {
            mockRepo.findById.mockResolvedValue(withImage());
            mockRepo.findImage.mockResolvedValue(photo);

            await expect(service.getImage('req-1', student)).resolves.toBe(photo);
        });

        it('returns the photo to a warden', async () => {
            mockRepo.findById.mockResolvedValue(withImage());
            mockRepo.findImage.mockResolvedValue(photo);

            await expect(service.getImage('req-1', warden)).resolves.toBe(photo);
        });

        it("forbids another student from viewing someone else's photo", async () => {
            mockRepo.findById.mockResolvedValue(withImage());

            await expect(service.getImage('req-1', otherStudent)).rejects.toThrow(ForbiddenException);
            expect(mockRepo.findImage).not.toHaveBeenCalled();
        });

        it('throws NotFoundException when the request has no photo', async () => {
            mockRepo.findById.mockResolvedValue(
                new MaintenanceRequest('req-1', 'student-1', 'room-1', 'Plumbing', 'Leak', 'desc', 'Low', 'Pending', null, new Date()),
            );

            await expect(service.getImage('req-1', student)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateStatus', () => {
        it('throws NotFoundException when the request does not exist', async () => {
            mockRepo.findById.mockResolvedValue(null);

            await expect(service.updateStatus('missing', { status: 'Resolved' } as any, warden)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('forbids a student who does not own the request from modifying it', async () => {
            const request = new MaintenanceRequest('req-1', 'student-1', 'room-1', 'Electrical', 'Fan', 'desc', 'Low', 'Pending', null, new Date());
            mockRepo.findById.mockResolvedValue(request);

            await expect(service.updateStatus('req-1', { status: 'In Progress' } as any, otherStudent)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('allows the owning student to update their own request', async () => {
            const request = new MaintenanceRequest('req-1', 'student-1', 'room-1', 'Electrical', 'Fan', 'desc', 'Low', 'Pending', null, new Date());
            mockRepo.findById.mockResolvedValue(request);
            mockRepo.save.mockImplementation(async (r) => r);

            const result = await service.updateStatus('req-1', { status: 'In Progress' } as any, student);

            expect(result.status).toBe('In Progress');
        });

        it('allows a warden to act on any request regardless of ownership', async () => {
            const request = new MaintenanceRequest('req-1', 'student-1', 'room-1', 'Electrical', 'Fan', 'desc', 'Low', 'Pending', null, new Date());
            mockRepo.findById.mockResolvedValue(request);
            mockRepo.save.mockImplementation(async (r) => r);

            const result = await service.updateStatus('req-1', { assignedStaff: 'Jane' } as any, warden);

            expect(result.assignedStaff).toBe('Jane');
            // Assigning staff moves a Pending request into progress (domain rule).
            expect(result.status).toBe('In Progress');
        });

        it('notifies the student once their request is marked Resolved', async () => {
            const request = new MaintenanceRequest('req-1', 'student-1', 'room-1', 'Electrical', 'Fan', 'desc', 'Low', 'In Progress', 'Jane', new Date());
            mockRepo.findById.mockResolvedValue(request);
            mockRepo.save.mockImplementation(async (r) => r);

            await service.updateStatus('req-1', { status: 'Resolved' } as any, warden);

            expect(notifyUser).toHaveBeenCalledWith('student-1', 'Maintenance request resolved', expect.stringContaining('Fan'));
        });

        it('turns the domain rule against resolving twice into a 400, not a 500', async () => {
            const request = new MaintenanceRequest('req-1', 'student-1', 'room-1', 'Electrical', 'Fan', 'desc', 'Low', 'Resolved', 'Jane', new Date());
            mockRepo.findById.mockResolvedValue(request);

            await expect(service.updateStatus('req-1', { status: 'Resolved' } as any, warden)).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});
