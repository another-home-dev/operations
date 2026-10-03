# Another Home — Operations Service

Handles the day-to-day requests in the hostel: maintenance complaints, visitor passes, and the notices wardens publish to students.

Part of [Another Home](https://github.com/another-home-dev). Reached through the API gateway at `/api/v1/operations`.

## What it does

The service has three independent modules:

| Module | Students | Wardens |
| --- | --- | --- |
| Maintenance | File a request with a category, description and optional photo; follow its status | See every request, filter it, view photos, change its status or assigned staff |
| Visitors | Request a pass for a guest | Approve or reject requests |
| Notices | Read notices | Publish, edit and delete notices |

Students only ever see their own maintenance and visitor requests. The service identifies them by the `x-user-id` header the gateway sets, never by an ID in the request body.

When a maintenance request is resolved or a visitor request is decided, the service calls the [Notification service](https://github.com/another-home-dev/another-home-notifications) to alert the student. A failed notification is logged and never blocks the update.

## API

Paths are relative to `/api/v1/operations`. "Staff" means the `warden`, `super-admin` or `staff` role.

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/maintenance` | Student | File a maintenance request |
| GET | `/maintenance` | Student (own) / staff (all) | Paginated, filterable list |
| GET | `/maintenance/stats` | Staff | Counts by status |
| GET | `/maintenance/:id/image` | Filer or staff | The attached photo |
| PATCH | `/maintenance/:id` | Staff | Update status and assigned staff |
| POST | `/visitors` | Student | Request a visitor pass |
| GET | `/visitors` | Student (own) / staff (all) | Paginated, filterable list |
| PATCH | `/visitors/:id` | Staff | Approve or reject |
| POST | `/notices` | Staff | Publish a notice |
| GET | `/notices` | Any signed-in user | Paginated list of notices |
| PATCH | `/notices/:id` | Staff | Edit a notice |
| DELETE | `/notices/:id` | Staff | Delete a notice |
| GET | `/health` | Anyone | Health check |

Interactive docs: `/api/docs` on the gateway, or `http://localhost:4002/api/docs` when running locally.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Port to listen on | `4002` |
| `DB_HOST`, `DB_PORT` | MySQL server | `localhost`, `3306` |
| `DB_USERNAME`, `DB_PASSWORD` | MySQL credentials | |
| `DB_DATABASE` | Database name | `operations_service` |
| `NOTIFICATION_SERVICE_URL` | Where to send student alerts | `http://notification:4004` |
| `CONSUL_HOST`, `CONSUL_PORT` | Service registry to register with | |
| `SERVICE_ADDRESS` | Address this service registers under in Consul | |

## Run locally

The easiest way is to start the whole system with `docker compose up --build` from [another-home-infra](https://github.com/another-home-dev/anotherhome-infrastructure). Its README shows how to clone every repository into the folder names it expects.

To run this service on its own, with a MySQL server available:

```bash
npm install
npm run start:dev
```

## Tests

```bash
npm test   # unit tests for the maintenance, visitor and notice services
```

## Project structure

Each module keeps its own domain and infrastructure code, so the three never depend on each other.

```
src/
├── maintanence/           maintenance requests (domain + infrastructure)
├── visitors/              visitor passes
├── notices/               warden notices
├── common/
│   ├── guards/            reads the gateway's identity headers
│   ├── decorators/        @CurrentUser()
│   └── notification-client.ts
└── health.controller.ts
```

## Deployment

`cloudbuild.yaml` runs on every push to `main`: tests, Docker build, push to Artifact Registry, then a rolling update of the `operations` deployment on GKE.
