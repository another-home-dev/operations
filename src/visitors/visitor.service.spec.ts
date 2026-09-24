import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { VisitorService } from './visitor.service';
import { IVisitorRepository } from './domain/ports/visitor.repository.interface';
import { VisitorRequest } from './domain/entities/VisitorRequest.entity';
import { notifyUser } from '../common/notification-client';

jest.mock('../common/notification-client', () => ({ notifyUser: jest.fn() }));

describe('VisitorService', () => {
    let service: VisitorService;
    let mockRepo: jest.Mocked<IVisitorRepository>;

    const student = { userId: 'student-1', roles: ['student'] };
    const warden = { userId: 'warden-1', roles: ['warden'] };

    beforeEach(() => {
        mockRepo = {
            save: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
        };
        service = new VisitorService(mockRepo);
        (notifyUser as jest.Mock).mockClear();
    });

    describe('createRequest', () => {
        it('takes studentId from the authenticated caller, never the request body', async () => {
            mockRepo.save.mockImplementation(async (r) => r);

            const created = await service.createRequest(
                { roomId: 'room-1', visitorName: 'Jane', visitorContact: '0771234567', purpose: 'Family visit', visitDate: '2026-10-01', visitTime: '14:00' } as any,
                student,
            );

            expect(created.studentId).toBe('student-1');
            expect(created.status).toBe('Pending');
        });
    });

    describe('updateStatus', () => {
        it('throws NotFoundException when the request does not exist', async () => {
            mockRepo.findById.mockResolvedValue(null);

            await expect(service.updateStatus('missing', { status: 'Approved' } as any, warden)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('forbids even the owning student from approving their own request', async () => {
            const request = new VisitorRequest('vis-1', 'student-1', 'room-1', 'Jane', '077', 'Visit', '2026-10-01', '14:00', 'Pending');
            mockRepo.findById.mockResolvedValue(request);

            await expect(service.updateStatus('vis-1', { status: 'Approved' } as any, student)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('lets a warden approve a pending request and notifies the student', async () => {
            const request = new VisitorRequest('vis-1', 'student-1', 'room-1', 'Jane', '077', 'Visit', '2026-10-01', '14:00', 'Pending');
            mockRepo.findById.mockResolvedValue(request);
            mockRepo.save.mockImplementation(async (r) => r);

            const result = await service.updateStatus('vis-1', { status: 'Approved' } as any, warden);

            expect(result.status).toBe('Approved');
            expect(notifyUser).toHaveBeenCalledWith('student-1', 'Visitor request approved', expect.stringContaining('Jane'));
        });

        it('lets a warden reject a pending request', async () => {
            const request = new VisitorRequest('vis-1', 'student-1', 'room-1', 'Jane', '077', 'Visit', '2026-10-01', '14:00', 'Pending');
            mockRepo.findById.mockResolvedValue(request);
            mockRepo.save.mockImplementation(async (r) => r);

            const result = await service.updateStatus('vis-1', { status: 'Rejected' } as any, warden);

            expect(result.status).toBe('Rejected');
        });

        it('turns the domain rule against reviewing twice into a 400, not a 500', async () => {
            const request = new VisitorRequest('vis-1', 'student-1', 'room-1', 'Jane', '077', 'Visit', '2026-10-01', '14:00', 'Approved');
            mockRepo.findById.mockResolvedValue(request);

            await expect(service.updateStatus('vis-1', { status: 'Rejected' } as any, warden)).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});
