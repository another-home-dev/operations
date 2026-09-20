export type MaintenancePriority = 'Low' | 'Medium' | 'High';
export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Resolved';

export class MaintenanceRequest {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly roomId: string,
    public category: string,
    public title: string,
    public description: string,
    public priority: MaintenancePriority,
    public status: MaintenanceStatus,
    public assignedStaff: string | null,
    public readonly submittedDate: Date,
    // Notice: no createdAt/updatedAt here — those are technical metadata
    // that only the database cares about, same as Accommodation's Room entity.
  ) {}

  // Domain logic — the actual business rule lives here, not in a controller
  // or service. Anything that calls this method gets this rule for free,
  // instead of every caller having to remember to check status themselves.
  markAsResolved(): void {
    if (this.status === 'Resolved') {
      throw new Error('This maintenance request has already been resolved.');
    }
    this.status = 'Resolved';
  }

  // Assigning staff also (by rule) moves a Pending request into progress —
  // that's a business decision, not a UI decision, so it belongs here too.
  assignStaff(staffName: string): void {
    this.assignedStaff = staffName;
    if (this.status === 'Pending') {
      this.status = 'In Progress';
    }
  }
}
