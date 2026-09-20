export class Notice {
  constructor(
    public readonly id: string,
    public readonly authorId: string,
    public title: string,
    public content: string,
    public readonly publishedDate: Date,
  ) {}

  // Notice this entity has NO extra methods, unlike MaintenanceRequest and
  // VisitorRequest. That's intentional, not an oversight: a notice has no
  // status workflow to protect (no "already reviewed" rule to enforce), so
  // there's nothing worth putting here. Don't invent domain logic where the
  // business genuinely has none.
}
