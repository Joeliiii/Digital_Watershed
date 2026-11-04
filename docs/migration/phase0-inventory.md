# Phase 0 — Existing-System Inventory and Migration Map

Audit of `Joeliiii/Digital_Watershed` @ `1b97080` (main), performed 2026-11-03.
This document is the input for Phase 1 (Spring Boot foundation). Everything here
was read from source; nothing about the live MongoDB database has been inspected
yet (see §9).

---

## 1. Repository layout (actual)

The repo is **not** split into `frontend/` and `backend/`. It is a single npm
project at the root:

| Path | Contents |
|---|---|
| `/` | `package.json` (one manifest for both client and server), `vite.config.ts`, `index.html`, `jest.config.js`, `babel.config.cjs`, `.env` |
| `src/` | React 18 + TypeScript app (Vite). `src/app/{pages,components,context,hooks,services,utils}` |
| `server/` | Express 5 API: `index.js`, `config/`, `routes/`, `controllers/`, `models/`, `middleware/`, `__tests__/` |

Scripts: `npm run dev` runs `node server/index.js` and `vite` together via `concurrently`.
`npm test` runs Jest over `server/__tests__/**`.

**Implication for target layout:** moving the React app into `frontend/` is a pure
file move (plus updating the root `package.json`). Recommended to do it during
Phase 7 cutover, not now, so the Node backend keeps running untouched while the
Java backend is built in a new `backend/` folder alongside it.

## 2. Runtime configuration

| Variable | Used by | Notes |
|---|---|---|
| `MONGO_URI` | `server/config/db.config.js`, `seed-user.js` | **Committed to Git in `.env`** (see §8.1) |
| `PORT` | `server/index.js` (default 5000) | Frontend hard-codes `http://localhost:5001/api` in `src/app/services/constants.ts` |
| `JWT_SECRET` | `authController.js` | Not set in `.env`; falls back to the literal `'default_secret'` |
| `MONGODB_URI` | `server/index.js` (audit-log migration block) | Different name from `MONGO_URI`; see §8.3 |

The committed `MONGO_URI` has **no database name in its path**, so Mongoose used
the driver default database **`test`** — that is where the existing data lives.
The Java backend defaults `MONGO_DATABASE` to `test` to match.

**As of 2026-11-03 the Atlas cluster in the committed `MONGO_URI` no longer
resolves** (SRV lookup returns NXDOMAIN on both the local resolver and 8.8.8.8),
so the cluster appears to have been deleted or renamed. The live data could not
be inspected (see D9).

The frontend API base URL was hard-coded; since Phase 1 it reads `VITE_API_URL`
and falls back to the old Node URL.

## 3. MongoDB data model (from Mongoose schemas)

Mongoose pluralises and lower-cases model names, so these are the real
collection names the Java `@Document(collection = ...)` annotations must use.

| Collection | Model | Fields | Indexes | Status |
|---|---|---|---|---|
| `users` | User | `name`*, `email`* (unique), `passwordHash`*, `role` (`user`\|`admin`, default `user`), `createdAt`, `updatedAt` | `email` unique | Active |
| `items` | Item | `ownerId`*→users, `fileId`→fs.files, `title`*, `description`, `mediaType`*, `storageType` (default `local`, actually always `gridfs`), `filePath`, `storageUrl`, `externalUrl`, `projectIds[]`→projects, `tagIds[]`→tags, `metadata` (Mixed: `originalName`, `mimetype`, `size`, + user keys), `notes`, `isDeleted`, `deletedAt`, timestamps | text(`title`,`description`) | Active — this is "media" |
| `projects` | Project | `ownerId`*, `title`*, `description`, `color` (default `#3B82F6`), `visibility` (`public`\|`private`\|`shared`), `sharedLinkToken`, timestamps | — | Active |
| `tags` | Tag | `ownerId`*, `name`*, `color` (default `#000000`), timestamps | (`ownerId`,`name`) unique | Active |
| `tagrelationships` | TagRelationship | `ownerId`*, `fromTagId`*, `toTagId`*, `relationshipType`*, `createdAt` | — | Active |
| `artworks` | Artwork | `ownerId`*, `title`*, `description`, `mediaUrl`*, `sourceItemIds[]`→items, timestamps | — | API exists, **no UI uses it** |
| `notes` | Note | `ownerId`*, `entityId`*, `entityModel`* (`Artwork`\|`Item`\|`Project`\|`Tag`), `title` (≤200), `content`*, `isDeleted`, `deletedAt`, timestamps | `ownerId`, `entityId`, (`entityId`,`entityModel`), text(`title`,`content`) | Active; soft-delete filter applied to every find |
| `auditlogs` | AuditLog | `actorUserId`*, `actionType`*, `targetType`*, `targetId`, `details` (Mixed), timestamps | — | Active |
| `recentviews` | RecentView | `userId`*, `itemId`*, `lastViewedAt` | (`userId`, `lastViewedAt` desc) | **Unused** — no route/controller |
| `exports` | Export | `userId`*, `itemIds[]`, `exportFormat`*, `status` | — | **Unused** |
| `samples` | Sample | `testField`, `createdAt` | — | Test scaffolding only — do not migrate |
| `fs.files` / `fs.chunks` | GridFS bucket `fs` | `filename`, `length`, `metadata.{originalname,mimetype,size}` | GridFS defaults | **All uploaded media bytes live here** |

`*` = required. All references are `ObjectId`. No embedded sub-documents; all
relationships are ID arrays on the owning side (`items.projectIds`,
`items.tagIds`, `artworks.sourceItemIds`). Projects do **not** store item IDs —
membership is `items.projectIds`.

### 3.1 Identifier representation

The API returns raw Mongoose documents, so the frontend everywhere reads
`_id` (string), plus `createdAt`/`updatedAt` as ISO strings. Populated
references replace the ID with an object, e.g. `item.tagIds = [{_id, name, color}]`
and `item.projectIds = [{_id, title, color}]`. Write requests send plain ID
string arrays (`{ tagIds: ["..."] }`).

**Java implication:** response DTOs must serialise the id as `_id` and must
reproduce the populated-object shape for `tagIds`/`projectIds`, or every page
that reads `item.tagIds[n].name` breaks.

## 4. Express API inventory

Base path is `/api` (no version). **No route has any auth middleware.**

| # | Method & path | Controller | Behaviour notes |
|---|---|---|---|
| A1 | `POST /api/auth/login` | authController.loginUser | bcrypt compare; returns `{_id,name,email,role,token}`; JWT `{id}` 30 d. No register endpoint. |
| I1 | `GET /api/items` | itemController.getItems | All items, all owners, populate projects(title,color) + tags(name,color), newest first. Ignores `isDeleted`. |
| I2 | `POST /api/items` | createItem | multipart `file` (optional) → temp disk → GridFS; merges file info into `metadata`; `ownerId` from body or hard-coded ID |
| I3 | `POST /api/items/bulk` | bulkCreateItems | multipart `files[]` ≤20; shared `projectIds`, `tagIds`, `description`, `notes`; returns `{created, errors}` |
| I4 | `GET /api/items/:id` | getItemById | populate projects(title), tags(name,color) |
| I5 | `PUT /api/items/:id` | updateItem | **mass-assigns `req.body`**; diffs `projectIds` to emit `add_to_project` / `remove_from_project` audit entries |
| I6 | `DELETE /api/items/:id` | deleteItem | Hard delete + GridFS delete (file deleted first; DB delete after) |
| I7 | `GET /api/items/:id/file` | getItemFile | Streams GridFS; supports `Range` (206); `inline` for image/video/audio/pdf/text else `attachment` |
| P1 | `GET /api/projects` | getProjects | All projects |
| P2 | `POST /api/projects` | createProject | title, description, color, visibility |
| P3 | `GET /api/projects/:id` | getProjectById | Returns `{project, items}` |
| P4 | `PUT /api/projects/:id` | updateProject | mass-assign `req.body` |
| P5 | `DELETE /api/projects/:id` | deleteProject | Hard delete; **does not clean `items.projectIds`** |
| P6 | `POST /api/projects/:id/share` | generateShareLink | `crypto.randomUUID()` → `sharedLinkToken`; returns `{token, sharedLinkToken}` |
| P7 | `DELETE /api/projects/:id/share` | revokeShareLink | nulls token |
| P8 | `GET /api/projects/shared/:token` | getSharedProject | **Public by design.** Returns `{project, items}` |
| T1 | `GET /api/tags` | getTags | All tags sorted by name |
| T2 | `POST /api/tags` | createTag | Idempotent: returns existing (200) if same name+owner, else 201 |
| T3 | `PUT /api/tags/:id` | updateTag | mass-assign |
| T4 | `DELETE /api/tags/:id` | deleteTag | Hard delete; **does not clean `items.tagIds` or relationships** |
| R1 | `GET /api/tag-relationships` | getTagRelationships | populate from/to tag |
| R2 | `POST /api/tag-relationships` | create | rejects self-link and duplicates in either direction |
| R3 | `GET /api/tag-relationships/suggestions` | getSuggestions | Tag-pair co-occurrence ≥2 across items, excluding existing pairs, top 20 |
| R4 | `GET /api/tag-relationships/by-tag/:tagId` | getRelationshipsByTag | |
| R5 | `PUT /api/tag-relationships/:id` | update | only `relationshipType` |
| R6 | `DELETE /api/tag-relationships/:id` | delete | |
| N1–N5 | `GET/POST /api/notes`, `GET/PUT/DELETE /api/notes/:id` | noteController | Filter `entityId`+`entityModel`; soft delete; owner-scoped (hard-coded owner) |
| W1–W8 | `/api/artworks` CRUD + `GET /:id/sources`, `POST|DELETE /:id/link` | artworkController | Owner-scoped (hard-coded owner); not used by UI |
| L1 | `GET /api/audit-logs` | getAuditLogs | `page`, `limit` (≤100), `targetType`, `actionType`; returns `{logs,page,limit,total,totalPages}`; sorts by non-existent `timestamp` field |
| L2 | `POST /api/audit-logs` | createAuditLog | Manual entry; not used by UI |
| U1–U4 | `GET/POST /api/admin/users`, `PUT/DELETE /api/admin/users/:id` | adminController | bcrypt cost 10; strips `passwordHash` |
| S1 | `GET /api/admin/storage` | getStorageStats | Sums `fs.files.length`, breakdown by MIME top-level type, entity counts, `db.stats()` |
| X1 | `POST /api/admin/export` | bulkExport | Body `{itemIds?, includeFiles?}` → ZIP stream of `metadata.json` + `files/*` |

Audit logging: `logAction()` is called on create/update/delete of Item, Project,
Tag, User (+ project membership changes). Tag relationships, notes, artworks and
share-link changes are **not** audited. Every entry uses the hard-coded actor
`6987c45da0cb4423e71e1ffd`.

## 5. Frontend inventory

All calls go through `src/app/services/api.ts` except: `LoginPage` (direct
`fetch` to `/auth/login`) and `<img>/<video>/<a>` tags that hit
`${API_URL}/items/:id/file` directly (MediaPage, ProjectsPage, SharedProjectPage,
BatchTagging, MediaPreview, MediaDetailPage).

| Route | Page | API calls |
|---|---|---|
| `/`, `/login` | LoginPage | A1 — **response discarded; token never stored** |
| `/home` | HomePage | P1, I1, T1 |
| `/dashboard` | DashboardPage + widgets | I1, P1, T1, R1, L1 (RecentActivity), localStorage (RecentlyViewed, layout) |
| `/media` | MediaPage | I1, P1, I7 — **search/filter is client-side** |
| `/media/create` | CreateMediaPage | P1, T1, T2, I2 |
| `/media/bulk-upload` | BulkUploadPage | P1, T1, I2 (one call per file — does **not** use I3) |
| `/media/:id` | MediaDetailPage + MediaPreview + NotesPanel | I4, I5, I6, I7, N1–N5 |
| `/tagging` | TaggingPage + BatchTagging + TagManagement | I1, T1–T4, I5, R1, R2, R3, R6 |
| `/projects` | ProjectsPage + ProjectManagement | P1–P7, I1, I5, T1 |
| `/network` | NetworkGraphPage | I1, P1, T1, R1 |
| `/timeline` | TimelinePage | I1, P1, L1 |
| `/shared/:token` | SharedProjectPage | P8, I7 |
| `/admin` | AdminPage | U1–U4, L1, S1 — Export button shows "not yet implemented" (`api.exportData` sends `{type, ids}`, which X1 doesn't understand) |

Client-only state (no backend): Recently Viewed (`localStorage`
`watershed_view_history`), dashboard layout, pinned graph nodes. There is no
route guard, no auth context, and nothing sends an `Authorization` header.

## 6. Handoff feature list vs. reality

| Handoff feature | What actually exists |
|---|---|
| 1. Search Media | Client-side filter over `GET /items` (text, type, project, tag). Server text index exists but is unused. |
| 2. Manage Tags | Tags CRUD **plus tag relationships + co-occurrence suggestions** (not in handoff) |
| 3. Manage Items | Items CRUD, single + bulk upload, metadata JSON editing |
| 4. Media Preview | GridFS streaming with HTTP Range support |
| 5. Create Projects | Projects CRUD, membership via `items.projectIds` |
| 6. Monitor Storage | `GET /admin/storage` (GridFS-based) |
| 7. Audit Log | Server-side logging + paginated viewer + Timeline/RecentActivity consumers |
| 8. Manage Users | Admin CRUD only. **No self-registration, no `/users/me`** |
| 9. Shared Links | One revocable UUID token per project; **no expiry, no permissions, project-only** |
| 10. Recently Viewed | **localStorage only**; `RecentView` model unused |
| *(not in handoff)* | Notes (polymorphic, soft-delete), Artworks (API only), Bulk Export ZIP, Network Graph, Timeline, Dashboard |

## 7. Tests

- 27 Jest files under `server/__tests__` (models, controllers, routes, db config, index).
- Route tests mock controllers; controller tests mock models — so they exercise
  wiring, not real Mongo behaviour. No auth tests (there is no auth to test).
- Missing coverage: admin controller, audit controller, storage stats, export,
  GridFS streaming/Range, bulk upload.
- `src/app/services/__tests__/{audit,export}.test.js` exist but are outside
  Jest's `testMatch`, so they never run.

## 8. Defects and risks found during audit

These affect migration decisions; the Java backend should not reproduce them.

1. **Committed secret.** `.env` (with `MONGO_URI`, i.e. Atlas credentials) is
   tracked in Git since commit `fe637b4`, and `.gitignore` only ignores
   `node_modules`. The credential should be rotated; removing the file from the
   current tree does not remove it from history.
2. **No authentication or authorization anywhere.** JWT is minted but never
   verified; every endpoint (including `/admin/*` and file download) is open;
   ownership is a hard-coded ObjectId `6987c45da0cb4423e71e1ffd` or whatever the
   client sends as `ownerId`. JWT secret defaults to `'default_secret'`.
3. `server/index.js` calls `mongoose.connect(process.env.MONGODB_URI)` at the
   bottom without importing `mongoose` — the one-time audit-log "migration" block
   throws a `ReferenceError` at startup.
4. `server/middleware/auditLogger.js` is a syntactically incomplete fragment and
   is imported nowhere.
5. Mass assignment: `PUT /items/:id`, `/projects/:id`, `/tags/:id` pass
   `req.body` straight to `findByIdAndUpdate` (a client can change `ownerId`,
   `fileId`, `sharedLinkToken`, …).
6. Audit log shape mismatch: frontend reads `log.timestamp` and `log.user.name`;
   the schema stores `createdAt` and `actorUserId`. The list query sorts by
   `timestamp`, which does not exist, so ordering is effectively natural order.
7. Referential cleanup missing: deleting a tag/project leaves dangling IDs in
   `items` and `tagrelationships`; deleting an item leaves notes, artwork links
   and recent views.
8. `isDeleted` on items is never set and never filtered (except in artwork code).
9. Share tokens: `randomUUID()` is cryptographically random (OK), but there is
   no expiry and the shared page's file URLs (`/items/:id/file`) are open to
   anyone with an item ID rather than scoped to the token.
10. `getItemFile` does not validate `Range` bounds (e.g. `start > end` or
    `end >= size`).
11. Request logger prints every request body — including login passwords — to stdout.

## 9. Decisions that need the project owner

| # | Question | Evidence | Recommendation |
|---|---|---|---|
| D1 | **File storage: GridFS or local disk?** Handoff says local filesystem, but all existing media bytes are in GridFS bucket `fs`. | §3, §4 I2/I7 | Java backend reads/writes GridFS via `GridFsTemplate` behind a `MediaStorageService` interface; add a filesystem implementation later if wanted. Avoids a data migration on day one. |
| D2 | **API path: keep `/api` or move to `/api/v1`?** | §4 | Keep `/api/...` paths and response shapes so the React app only needs a base-URL change. Versioning can be added later. |
| D3 | **Auth rollout.** The frontend sends no token today, so enforcing auth in Java will break every page until the React side stores and sends the JWT. | §5 | Keep stateless JWT (bearer header), add a small auth context + `Authorization` header in `api.ts`, a route guard, and for `<img>/<video>` sources use fetched blob URLs or short-lived signed file URLs. |
| D4 | **Multi-tenancy rules.** Today everything is global. Should standard users see only their own items/tags/projects, or is this a shared team library? | §4, `ownerId` everywhere | Needs owner input — it changes every repository query. |
| D5 | **Self-registration?** Handoff lists `POST /auth/register`; the app has admin-created users only. | §6 | Keep admin-only unless the owner wants sign-up. |
| D6 | **Recently Viewed** — keep localStorage, or move to the `recentviews` collection? | §6 | Move server-side (model already exists); handoff lists it as a backend feature. |
| D7 | **Shared links** — add expiry/permissions (handoff) or keep current semantics? | §6 | Keep one token per project, add optional `sharedLinkExpiresAt`, and scope file access to the token. |
| D8 | **Artworks and Exports** — migrate unused Artwork API and unused Export model? | §3 | Port Artworks (small, has tests); skip `exports`/`samples` collections. |
| D9 | Can the live database be inspected (read-only) to confirm collection names, extra fields and real indexes? | §3 is schema-derived only | Yes — one read-only `listCollections` / sample-document pass before Phase 2. **Blocked:** the committed Atlas host no longer resolves; need a current connection string or a dump. |

## 10. Feature-by-feature migration matrix

Proposed Java packages under `com.digitalwatershed`. "DTO" columns describe
response shapes that must match §3.1.

| Feature | React page/component | Express route(s) | Collection(s) | Spring controller | Service | Repository / model / DTOs | Required tests |
|---|---|---|---|---|---|---|---|
| Auth / login | LoginPage | A1 | users | `security.AuthController` | `security.AuthService`, `JwtService` | `user.UserRepository`, `User`; `LoginRequest`, `LoginResponse` | bad email, bad password, good login returns token, BCrypt hash from bcryptjs (`$2a$/$2b$`) verifies |
| Manage users | AdminPage (Users tab) | U1–U4 | users | `user.AdminUserController` | `user.UserService` | `User`; `CreateUserRequest`, `UpdateUserRequest`, `UserResponse` (no hash) | duplicate email 400, password hashed, admin-only (403 for user role), delete |
| Manage items | CreateMedia, BulkUpload, MediaDetail, Tagging, Projects | I1–I6 | items, fs.* | `media.MediaController` | `media.MediaService` | `MediaRepository`, `MediaItem`; `MediaResponse` (populated tags/projects), `MediaUpdateRequest` (whitelisted fields) | create with/without file, bulk partial failure, update whitelist, project add/remove audit, delete removes file *after* auth + DB delete, orphan file cleanup on DB failure |
| Media preview | MediaPreview, all `<img>` | I7 | items, fs.* | `media.MediaFileController` | `storage.MediaStorageService` (GridFS impl) | `GridFsTemplate` | full 200, Range 206, invalid Range 416, inline vs attachment, missing file 404, unauthorized 401/403 |
| Search media | MediaPage | I1 (+ optional `?search=`) | items | `MediaController` | `MediaService` | custom query / text index | text match, tag/project/type filter |
| Tags | TagManagement, TaggingPage, CreateMedia | T1–T4 | tags | `tags.TagController` | `tags.TagService` | `TagRepository`, `Tag`; `TagRequest`, `TagResponse` | idempotent create (200 vs 201), unique per owner, delete cascades from items |
| Tag relationships | TaggingPage, NetworkGraph, Dashboard | R1–R6 | tagrelationships, items | `tags.TagRelationshipController` | `tags.TagRelationshipService` | `TagRelationshipRepository`; `RelationshipResponse` (populated), `SuggestionResponse` | self-link 400, reverse duplicate 400, suggestion counting ≥2 & exclusion |
| Projects | ProjectsPage, ProjectManagement, CreateProjectPage | P1–P5 | projects, items | `projects.ProjectController` | `projects.ProjectService` | `ProjectRepository`, `Project`; `ProjectRequest`, `ProjectResponse`, `ProjectDetailResponse {project, items}` | CRUD, detail includes items, delete detaches items |
| Shared links | ProjectManagement, SharedProjectPage | P6–P8 | projects | `sharing.ShareController` | `sharing.ShareService` | `Project.sharedLinkToken`; `ShareTokenResponse {token, sharedLinkToken}` | 32-byte SecureRandom token, revoke → 404, (expiry if D7), file access scoped to token |
| Notes | NotesPanel | N1–N5 | notes | `notes.NoteController` | `notes.NoteService` | `NoteRepository`, `Note` | entity filter validation, soft delete hidden from list, owner scoping |
| Artworks | — | W1–W8 | artworks | `artworks.ArtworkController` | `artworks.ArtworkService` | `ArtworkRepository`, `Artwork` | link/unlink `$addToSet`/`$pull`, foreign item rejected |
| Audit log | AdminPage, Timeline, RecentActivityWidget | L1, L2 + `logAction` | auditlogs | `audit.AuditLogController` | `audit.AuditService` | `AuditLogRepository`, `AuditLog`; `AuditLogResponse` adds `timestamp` and `user{_id,name}` | real actor recorded, pagination bounds, filters, admin-only, failure never breaks caller |
| Storage stats | AdminPage (Storage tab) | S1 | fs.files + counts | `storage.AdminStorageController` | `storage.StorageStatsService` | `MongoTemplate` (aggregation on `fs.files`, `dbStats`) | size sums, by-type breakdown, admin-only |
| Bulk export | AdminPage (Export) | X1 | items, fs.* | `media.ExportController` | `media.ExportService` | `ZipOutputStream` streaming | metadata.json content, files included/excluded, empty → 400 |
| Recently viewed | RecentlyViewed, RecentlyViewedWidget | — (new, if D6) | recentviews | `media.RecentlyViewedController` | `RecentlyViewedService` | `RecentViewRepository`, `RecentView` | upsert on view, per-user ordering, limit |
| Health | — | `GET /` ("API is running...") | — | Actuator `/actuator/health` | — | — | context loads, health UP |

## 11. Target Spring Boot version (verified)

- Maven Central `spring-boot-starter-parent` latest GA: **4.1.2**; `4.2.0-RC1`
  is a release candidate (checked 2026-11-03). Spring Initializr default is 4.1.2.
- Spring Boot 4.1 supports Java 17–26, so **Java 21 is supported**.
- Plan: **Spring Boot 4.1.2**, Java 21, Maven (via the Maven wrapper — Maven is
  not installed on this machine), starters: web, security, data-mongodb,
  validation, actuator, test; `jjwt` (or Spring Security's
  `oauth2-resource-server` JWT decoder) for tokens; Testcontainers MongoDB for
  integration tests.
- Revisit 4.2.0 once it reaches GA.

## 12. Phase 1 entry criteria

Phase 1 (Spring Boot skeleton, Mongo connection, health, CORS, error format)
can start once D1–D3 are answered. D4–D8 can be decided before the phases that
need them (D4 before Phase 3, D6–D7 before Phase 4).
