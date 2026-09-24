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
        };
        service = new MaintenanceService(mockRepo);
        (notifyUser as jest.Mock).mockClear();
    });

    describe('createRequest', () => {
        it('takes studentId from the authenticated caller, never the request body', async () => {
            mockRepo.save.mockImplementation(async (r) => r);

            const created = await service.createRequest(
                { roomId: 'room-1', category: 'Plumbing', title: 'Leak', description: 'Tap leaking', priority: 'Medium' } as any,
                student,
            );

            expect(created.studentId).toBe('student-1');
            expect(created.status).toBe('Pending');
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
