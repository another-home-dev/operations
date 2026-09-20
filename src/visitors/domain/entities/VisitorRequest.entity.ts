export type VisitorStatus = 'Pending' | 'Approved' | 'Rejected';

export class VisitorRequest {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly roomId: string,
    public visitorName: string,
    public visitorContact: string,
    public purpose: string,
    public visitDate: string,
    public visitTime: string,
    public status: VisitorStatus,
  ) {}

  // A visitor request can only be reviewed once — the domain rule lives here,
  // not in the controller or service, same pattern as MaintenanceRequest.
  approve(): void {
    if (this.status !== 'Pending') {
      throw new Error('This visitor request has already been reviewed.');
    }
    this.status = 'Approved';
  }

  reject(): void {
    if (this.status !== 'Pending') {
      throw new Error('This visitor request has already been reviewed.');
    }
    this.status = 'Rejected';
  }
}
