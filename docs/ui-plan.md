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

- [ ] `/` -> redirect to `/overview`
- [ ] `/overview` -> overview dashboard
- [ ] `/logs` -> logs workspace
- [ ] `/errors` -> recurring errors and grouped failures
- [ ] `/endpoints` -> endpoint leaderboard and performance analysis
- [ ] `/settings` -> service configuration and token management

## Nested Route Plan

These are the nested or stateful route patterns that should exist under the top-level pages.

### Overview

- [ ] `/overview`

### Logs

- [ ] `/logs?view=all`
- [ ] `/logs?view=slow`
- [ ] `/logs/:logId`
- [ ] `/logs/:logId?view=all`
- [ ] `/logs/:logId?view=slow`

Notes:

- `view` controls whether the user is in All Logs or Slow Requests
- navigating to `/logs/:logId` should open the log drawer over the logs workspace
- closing the drawer should navigate back to the matching base logs URL
- drawer content should be capable of loading directly from URL on refresh

### Errors

- [ ] `/errors`
- [ ] optional future filter params for environment and period

### Endpoints

- [ ] `/endpoints`
- [ ] optional future sort/filter params

### Settings

- [ ] `/settings?section=general`
- [ ] `/settings?section=tokens`
- [ ] `/settings?section=danger`

Notes:

- `section` can control tabs or segmented sections
- do not split settings into separate top-level destinations

## Primary Layouts

### App Shell

- [ ] Global app frame
- [ ] Persistent left sidebar navigation on desktop
- [ ] Top header bar with page title, service switcher, period selector, and quick actions
- [ ] Mobile nav trigger
- [ ] Content area optimized for dashboard and data-table pages
- [ ] Overlay-friendly layout so drawers sit above content cleanly

### Workspace Layout

Use for Overview, Logs, Errors, Endpoints, and Settings.

- [ ] Page header
- [ ] Secondary actions area
- [ ] Filter row when needed
- [ ] Empty state slot
- [ ] Loading state slot
- [ ] Error state slot

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

- [ ] Page header
- [ ] View switcher: All Logs / Slow Requests
- [ ] Search input
- [ ] Filters: period, environment, method, level, status, path
- [ ] Results table
- [ ] Density and column hierarchy optimized for observability workflows
- [ ] Cursor-based pagination UI
- [ ] Selected log overlay drawer

Behavior:

- [ ] Clicking a row navigates to the selected log URL
- [ ] URL change opens the drawer
- [ ] Closing the drawer returns to the previous logs URL
- [ ] Browser back closes or reopens drawer correctly
- [ ] Drawer uses right-side overlay on desktop
- [ ] Drawer uses bottom sheet overlay on mobile

### Log Detail Drawer

Purpose:
Inspect one log without losing table context.

Contains:

- [ ] Timestamp
- [ ] Method, path, status, duration
- [ ] Environment and level
- [ ] Request ID
- [ ] Session ID if present
- [ ] Message
- [ ] Structured metadata view
- [ ] Copy actions where useful
- [ ] Open request trace action placeholder for future

Design notes:

- [ ] Desktop overlay from the right
- [ ] Mobile overlay from the bottom
- [ ] No content push
- [ ] Visually consistent with dense technical workflows

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

- [ ] General
- [ ] Tokens
- [ ] Danger Zone

#### General Section

Contains:

- [ ] Service name
- [ ] Service slug display
- [ ] Save changes action

#### Tokens Section

Contains:

- [ ] Token table
- [ ] Name
- [ ] Token preview
- [ ] Created at
- [ ] Last used at
- [ ] Actions: create, rename, rotate, revoke

#### Danger Zone Section

Contains:

- [ ] Delete service action
- [ ] Confirmation flow

Use dummy data for first build:

- [ ] Service metadata
- [ ] Token rows

## Modal / Drawer Inventory

### Must Have First

- [ ] Log detail drawer
- [ ] Create token modal
- [ ] Rotate token modal
- [ ] Rename token modal
- [ ] Delete token confirmation
- [ ] Edit service modal or inline form
- [ ] Delete service confirmation

### Can Wait

- [ ] Command palette
- [ ] Mobile filter sheet

## Shared Components To Build

### Navigation and Shell

- [ ] App sidebar
- [ ] Sidebar nav item
- [ ] Top header
- [ ] Service switcher
- [ ] Period selector

### Data Display

- [ ] KPI stat card
- [ ] Chart card
- [ ] Section card
- [ ] Status badge
- [ ] Level badge
- [ ] Logs data table
- [ ] Endpoint leaderboard table
- [ ] Error groups table
- [ ] Key-value metadata block

### Workflow Components

- [ ] Logs filter bar
- [ ] Logs view switcher
- [ ] Empty state block
- [ ] Loading skeletons
- [ ] Error state block
- [ ] Token reveal card

## Recommended Build Order

### Phase 1

- [ ] App shell
- [ ] Overview page with dummy data

### Phase 2

- [ ] Logs workspace
- [ ] All Logs view
- [ ] Slow Requests view
- [ ] Route-driven log detail drawer

### Phase 3

- [ ] Errors page
- [ ] Endpoints page

### Phase 4

- [ ] Settings page
- [ ] General section
- [ ] Tokens section
- [ ] Danger Zone section
- [ ] Token and service modals

## Dummy Data Requirements

Create a single mock data source for early UI work.

- [ ] Services list
- [ ] Overview KPI metrics
- [ ] Overview timeseries
- [ ] Status breakdown
- [ ] Log level breakdown
- [ ] Logs table rows
- [ ] Slow log rows
- [ ] Selected log detail record
- [ ] Error groups
- [ ] Endpoint leaderboard rows
- [ ] Service settings data
- [ ] Token list

## Technical Notes For Future Implementation

- [ ] Prefer route-driven overlay state for log detail instead of local component-only state
- [ ] Keep the logs page mounted while nested log routes render the drawer
- [ ] Use responsive drawer behavior: right-side sheet on desktop, bottom drawer on mobile
- [ ] Keep dummy data shapes close to backend response shapes to reduce rewrite cost later
- [ ] Use Shadcn primitives, but compose app-specific components instead of filling route files with raw UI primitives
- [ ] Build reusable data cards and filter components before over-specializing individual pages

## Open Questions

These are not blockers for starting UI work, but should stay visible.

- [ ] Should request trace remain an action inside the drawer until trace UI exists?
- [ ] Should service switching be global in the top bar from day one or stubbed for now?
- [ ] Should period selection be global across pages or local per page initially?
- [ ] Should the logs view switcher be tabs, segmented control, or pills?

## First Slice Recommendation

If starting implementation immediately, begin here:

- [ ] Build app shell
- [ ] Build overview page with polished dummy data
- [ ] Build logs workspace skeleton with view switcher
- [ ] Build route-driven log detail drawer
