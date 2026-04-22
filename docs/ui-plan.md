# Deko UI Plan

## Purpose

This document locks the initial information architecture and UI implementation plan for the Deko web app.

It is intended to be used as a handoff document for future work by any agent or contributor.

## Core Product Direction

- [x] No landing page
- [x] App opens straight into the product dashboard
- [x] UI direction is minimal, polished, and data-dense where needed
- [x] Use dummy data during initial UI build where API wiring is not ready
- [x] Build on the existing Shadcn component base already installed in the repo

## IA Decisions Locked

- [x] No public marketing or landing surface for now
- [x] Log detail is not a standalone primary page
- [x] Log detail opens as a route-driven overlay drawer
- [x] On large screens, log detail opens in a right-side drawer
- [x] On small screens, log detail opens in a bottom sheet / drawer
- [x] The log detail overlay should not push page content; it should sit above it
- [x] Logs and Slow Requests live in the same Logs workspace
- [x] Service settings and token management live in the same Settings workspace
- [x] Drawer state should be tied to the URL so deep links and browser navigation work

## Note On "IA Weight"

IA means information architecture.

"IA weight" here means how much navigational and conceptual overhead a feature adds.

Examples:

- A separate top-level page adds more IA weight than a tab inside an existing page
- A dedicated Settings page with sections adds less IA weight than splitting settings into multiple top-level routes
- A Slow Requests tab inside Logs adds less IA weight than creating a separate full page in the main nav

The goal is to keep the app easy to understand without flattening everything into a single screen.

## Top-Level Route Map

These are the main application destinations.

- [x] `/` -> redirect to `/overview`
- [x] `/overview` -> overview dashboard
- [x] `/logs` -> logs workspace
- [x] `/errors` -> recurring errors and grouped failures
- [x] `/endpoints` -> endpoint leaderboard and performance analysis
- [x] `/settings` -> service configuration and token management

## Nested Route Plan

These are the nested or stateful route patterns that should exist under the top-level pages.

### Overview

- [x] `/overview`

### Logs

- [x] `/logs?view=all`
- [x] `/logs?view=slow`
- [x] `/logs?logId={logId}&timestamp={timestamp}`

Notes:

- `view` controls whether the user is in All Logs or Slow Requests
- navigating to `/logs/:logId` should open the log drawer over the logs workspace
- closing the drawer should navigate back to the matching base logs URL
- drawer content should be capable of loading directly from URL on refresh

### Errors

- [x] `/errors`
- [ ] optional future filter params for environment and period

### Endpoints

- [x] `/endpoints`
- [ ] optional future sort/filter params

### Settings

- [x] `/settings?section=general`
- [x] `/settings?section=tokens`
- [x] `/settings?section=danger`

Notes:

- `section` can control tabs or segmented sections
- do not split settings into separate top-level destinations

## Primary Layouts

### App Shell

- [x] Global app frame
- [x] Persistent left sidebar navigation on desktop
- [x] Top header bar with page title, service switcher, period selector, and quick actions
- [x] Mobile nav trigger
- [x] Content area optimized for dashboard and data-table pages
- [ ] Overlay-friendly layout so drawers sit above content cleanly

### Workspace Layout

Use for Overview, Logs, Errors, Endpoints, and Settings.

- [x] Page header
- [ ] Secondary actions area
- [ ] Filter row when needed
- [ ] Empty state slot
- [x] Loading state slot
- [x] Error state slot

## Page Plan

### Overview Page

Purpose:
Provide the default operational summary for a selected service.

Contains:

- [ ] Service header
- [ ] Time range selector
- [ ] KPI cards: total requests, error rate, avg duration, p95, p99
- [ ] Requests vs errors timeseries chart
- [ ] Status code breakdown chart
- [ ] Log level breakdown chart
- [ ] Top endpoints preview
- [ ] Error groups preview
- [ ] Recent logs preview or activity strip

Use dummy data for first build:

- [ ] KPI values
- [ ] Timeseries data
- [ ] Status breakdown
- [ ] Log level breakdown
- [ ] Top endpoints preview
- [ ] Error groups preview

### Logs Workspace

Purpose:
Provide the main searchable inspection interface for raw log events.

Contains:

- [x] Page header
- [x] View switcher: All Logs / Slow Requests
- [x] Search input
- [x] Filters: period, environment, method, level, status, path
- [x] Results table
- [ ] Density and column hierarchy optimized for observability workflows
- [x] Cursor-based pagination UI
- [x] Selected log overlay drawer

Behavior:

- [x] Clicking a row navigates to the selected log URL
- [x] URL change opens the drawer
- [x] Closing the drawer returns to the previous logs URL
- [x] Browser back closes or reopens drawer correctly
- [x] Drawer uses right-side overlay on desktop
- [x] Drawer uses bottom sheet overlay on mobile

### Log Detail Drawer

Purpose:
Inspect one log without losing table context.

Contains:

- [x] Timestamp
- [x] Method, path, status, duration
- [x] Environment and level
- [x] Request ID
- [x] Session ID if present
- [x] Message
- [x] Structured metadata view
- [x] Copy actions where useful
- [ ] Open request trace action placeholder for future

Design notes:

- [x] Desktop overlay from the right
- [x] Mobile overlay from the bottom
- [x] No content push
- [x] Visually consistent with dense technical workflows

### Errors Page

Purpose:
Surface recurring failures instead of isolated raw events.

Contains:

- [ ] Period filter
- [ ] Environment filter
- [ ] Grouped error list or table
- [ ] Count, first seen, last seen
- [ ] Method, path, status, message summary
- [ ] Quick action to inspect matching logs later

Use dummy data for first build:

- [ ] Error groups
- [ ] Counts and timestamps

### Endpoints Page

Purpose:
Highlight the endpoints that matter most by traffic, failure, and latency.

Contains:

- [ ] Sort control: requests, errors, error rate, p95, p99
- [ ] Endpoint leaderboard table
- [ ] Method + path emphasis
- [ ] Requests, errors, error rate, avg duration, p95, p99
- [ ] Potential sparkline slot for future enhancement

Use dummy data for first build:

- [ ] Endpoint rows
- [ ] Sorting states

### Settings Page

Purpose:
Manage service-level configuration in one place.

Sections:

- [x] General
- [x] Tokens
- [x] Danger Zone

#### General Section

Contains:

- [x] Service name
- [x] Service slug display
- [x] Save changes action

#### Tokens Section

Contains:

- [x] Token table (using DataTable component)
- [x] Name
- [x] Token preview
- [x] Created at (formatted with date-fns)
- [x] Last used at (formatted with date-fns, or "Never" badge)
- [x] Actions: create, rename, rotate, revoke

#### Danger Zone Section

Contains:

- [x] Delete service action
- [x] Confirmation flow (type service name to confirm)

Use dummy data for first build:

- [x] Service metadata
- [x] Token rows

## Modal / Drawer Inventory

### Must Have First

- [x] Log detail drawer
- [x] Create token modal (AlertDialog after token reveal)
- [x] Rotate token modal (AlertDialog after token reveal)
- [x] Rename token modal
- [x] Delete token confirmation (AlertDialog)
- [x] Edit service modal or inline form
- [x] Delete service confirmation (AlertDialog with name confirmation)

## Shared Components To Build

### Navigation and Shell

- [x] App sidebar
- [x] Sidebar nav item
- [x] Top header
- [x] Service switcher
- [x] Period selector

### Data Display

- [ ] KPI stat card
- [ ] Chart card
- [ ] Section card
- [ ] Status badge
- [ ] Level badge
- [x] Logs data table
- [ ] Endpoint leaderboard table
- [ ] Error groups table
- [ ] Key-value metadata block
- [x] DataTable (generic reusable table with sorting, filtering, pagination, row actions)
- [x] Alert component (default + destructive variants)

### Workflow Components

- [x] Logs filter bar
- [x] Logs view switcher
- [ ] Empty state block
- [x] Loading skeletons
- [x] Error state block
- [x] Token reveal card (AlertDialog with copy input)

## Recommended Build Order

### Phase 1

- [x] App shell
- [ ] Overview page with dummy data

### Phase 2

- [x] Logs workspace
- [x] All Logs view
- [x] Slow Requests view
- [x] Route-driven log detail drawer

### Phase 3

- [ ] Errors page
- [ ] Endpoints page

### Phase 4

- [x] Settings page
- [x] General section
- [x] Tokens section
- [x] Danger Zone section
- [x] Token and service modals

## Dummy Data Requirements

Create a single mock data source for early UI work.

- [x] Services list
- [ ] Overview KPI metrics
- [ ] Overview timeseries
- [ ] Status breakdown
- [ ] Log level breakdown
- [x] Logs table rows
- [x] Slow log rows
- [x] Selected log detail record
- [ ] Error groups
- [ ] Endpoint leaderboard rows
- [x] Service settings data
- [x] Token list

## Technical Notes For Future Implementation

- [x] Prefer route-driven overlay state for log detail instead of local component-only state
- [x] Keep the logs page mounted while nested log routes render the drawer
- [x] Use responsive drawer behavior: right-side sheet on desktop, bottom drawer on mobile
- [ ] Keep dummy data shapes close to backend response shapes to reduce rewrite cost later
- [x] Use Shadcn primitives, but compose app-specific components instead of filling route files with raw UI primitives
- [x] Build reusable data cards and filter components before over-specializing individual pages

## Open Questions

These are not blockers for starting UI work, but should stay visible.

- [ ] Should request trace remain an action inside the drawer until trace UI exists?
- [x] Should service switching be global in the top bar from day one or stubbed for now? (stubbed via service switcher in sidebar)
- [x] Should period selection be global across pages or local per page initially? (global in header)

## First Slice Recommendation

If starting implementation immediately, begin here:

- [x] Build app shell
- [ ] Build overview page with polished dummy data
- [x] Build logs workspace skeleton with view switcher
- [x] Build route-driven log detail drawer
