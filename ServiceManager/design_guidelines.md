# Tehniko System - Service Management Application Design Guidelines

## Design Approach: Material Design System

**Rationale:** Material Design is optimal for this productivity-focused application serving field technicians. Its emphasis on tactile surfaces, responsive elevation, and mobile-first principles aligns perfectly with the need for scannable data, quick actions, and reliable mobile performance in challenging field conditions.

**Core Principles:**
- Mobile-first responsive design (technicians work primarily on phones/tablets)
- Touch-friendly targets (minimum 48px tap areas)
- Immediate visual feedback for all interactions
- Clear hierarchy through elevation and shadows
- Efficient information density for scanning while moving

## Typography System

**Font Family:** Roboto (Material Design standard) via Google Fonts CDN
- **Display Headings:** Roboto 500 Medium, 32px-40px (service location names, dashboard headers)
- **Section Headings:** Roboto 500 Medium, 24px-28px (equipment categories, repair status headers)
- **Body Text:** Roboto 400 Regular, 16px (repair descriptions, notes, form labels)
- **Data Tables:** Roboto 400 Regular, 14px (equipment lists, service records)
- **Action Labels:** Roboto 500 Medium, 14px (buttons, tabs, status badges)
- **Metadata:** Roboto 400 Regular, 12px (timestamps, secondary info)

**Line Height:** 1.5 for body text, 1.2 for headings

## Layout System

**Spacing Scale:** Use Tailwind units of 2, 4, 8, 12, 16 for consistent rhythm
- Component padding: p-4 (mobile), p-8 (desktop)
- Section spacing: mb-8 between major components
- Card margins: gap-4 in grids
- Form field spacing: space-y-4

**Responsive Breakpoints:**
- Mobile-first base: Single column, full-width components
- Tablet (md: 768px): Two-column layouts for equipment grids
- Desktop (lg: 1024px): Three-column dashboards, side navigation

**Container Strategy:**
- Dashboard: max-w-7xl with px-4 mobile, px-8 desktop
- Forms: max-w-2xl centered for focused data entry
- Data tables: Full-width with horizontal scroll on mobile

## Component Library

### Navigation
**App Bar (Top):**
- Fixed position with elevation-4 shadow
- Height: 64px desktop, 56px mobile
- Contains: Menu icon (left), "Tehniko System" logo/text (center-left), profile icon and notifications (right)
- Uses teal primary color background with white text

**Bottom Navigation (Mobile):**
- Fixed position, elevation-8 shadow
- Four primary actions: Dashboard, Active Jobs, Schedule, More
- Icons above labels, 56px height
- Active state with filled icons and primary color

**Side Navigation (Desktop):**
- Persistent drawer, 240px width
- Main sections: Dashboard, Jobs, Equipment, Clients, Reports
- Elevation-2 surface
- Icons aligned left with text labels

### Dashboard Cards
**Service Overview Cards:**
- Elevation-2 surface with rounded corners (8px radius)
- Header: Icon + count + label (e.g., "12 Active Jobs")
- Body: Brief summary or quick action
- Footer: "View All" text link
- Padding: p-6
- Grid: 1 column mobile, 2 columns tablet, 3 columns desktop

**Quick Action Chips:**
- Elevated buttons (elevation-2) with icon + text
- Arranged horizontally with gap-2
- Examples: "New Job", "Scan QR", "Upload Photo"
- Height: 48px minimum for touch targets

### Data Tables
**Mobile-Optimized Cards:**
Transform tables into stacked cards on mobile:
- Each job/equipment as separate card with elevation-1
- Header row: Equipment name + status badge
- Body: Key details in label-value pairs (Client, Location, Last Service)
- Footer: Primary action button ("View Details", "Start Repair")
- Swipeable for quick actions (Archive, Call Client)

**Desktop Table:**
- Compact rows with 48px height
- Columns: Status indicator (dot), Equipment, Client, Location, Last Service, Actions
- Sticky header with elevation-4
- Sortable columns with arrow indicators
- Hover state: elevation-1 on rows

### Forms & Data Entry
**Input Fields:**
- Material outlined variant with floating labels
- Height: 56px
- Border: 1px, increases to 2px on focus
- Helper text below for validation feedback
- Full-width on mobile, constrained max-width on desktop

**Image Upload Component:**
- Large drop zone: dashed border, 200px height
- Camera icon with "Tap to capture or upload" text
- Thumbnail grid below showing uploaded images (3 columns mobile, 4 desktop)
- Each thumbnail: 120px square with delete icon overlay
- Add button for multiple uploads

**Action Buttons:**
- Primary (Filled): Elevated, 48px height, full-width mobile, auto-width desktop
- Secondary (Outlined): 1px border, same sizing
- Floating Action Button (FAB): 56px circular, bottom-right fixed, primary action (e.g., "Add Job")

### Status Indicators
**Chips/Badges:**
- Rounded corners (16px)
- Padding: px-3 py-1
- Small text (12px)
- Status colors: Pending (amber), In Progress (blue), Completed (green), Urgent (red)
- Icon optional on left side

### Image Gallery
**Repair Photos Section:**
- Masonry grid layout (2 columns mobile, 4 desktop)
- Images: aspect-ratio-square with object-cover
- Lightbox on click with swipe navigation
- Timestamp and uploader name overlay
- Download and share actions in lightbox

## Images

**Hero Section (Dashboard/Landing):**
Large horizontal hero image (16:9 aspect ratio, full-width, 400px height desktop, 300px mobile):
- Subject: Technician in branded Tehniko System uniform using tablet in hotel kitchen, focused on equipment maintenance
- Style: Professional photography, bright and clean, shows modern hotel equipment
- Overlay: Semi-transparent gradient (dark at bottom) for text readability
- Content on image: "Tehniko System" heading (48px), "Professional Equipment Maintenance" subheading (20px), primary CTA button with blurred background

**Equipment Type Icons:**
Reference or use Material Icons for equipment categories:
- HVAC systems, refrigeration units, ovens, dishwashers, coffee machines
- Display in service type selector and equipment cards

**Empty States:**
- Illustration or photo placeholder for "No active jobs" states
- Friendly technician illustration with wrench, simple and clean
- Size: 200px square, centered with message below

**Client Logos:**
Small thumbnail logos (80px height) of hotel/restaurant clients in "Trusted By" section on landing/about page

## Elevation & Depth

**Material Elevation Scale:**
- Level 0: App background surface
- Level 1: Cards in lists, table rows on hover
- Level 2: Default card state, navigation drawer
- Level 4: App bar, sticky table headers
- Level 8: Bottom navigation, floating action button
- Level 16: Navigation drawer on mobile (overlay)

**Shadow Implementation:**
Use Material Design shadow specifications for each elevation level to create depth perception critical for touch interfaces.

## Interactions & Micro-animations

**Touch Feedback:**
- Ripple effect on all tappable elements (Material Design ripple)
- Duration: 300ms
- Origin: Touch point

**Loading States:**
- Circular progress indicators (48px) for page loads
- Linear progress bar (4px height) under app bar for background operations
- Skeleton screens for data tables during fetch

**Transitions:**
- Page transitions: 250ms ease-in-out
- Card elevation changes: 150ms
- Form field focus: 200ms

**Pull-to-Refresh:**
Implement on job lists and dashboard for manual sync

## Mobile-Specific Patterns

**Touch Optimization:**
- All interactive elements: 48px minimum hit area with visible 40px size
- Increased spacing between stacked buttons (space-y-4)
- Form fields spaced for thumb-friendly navigation

**Offline Capability Indicators:**
- Status badge in app bar showing sync status
- Visual indicator for items saved locally pending upload
- Queue indicator for pending image uploads

**Camera Integration:**
Inline camera access for image capture with immediate preview and retake option

This comprehensive Material Design implementation creates a professional, efficient tool optimized for field technicians working in challenging conditions while maintaining the Tehniko System brand identity through strategic use of teal accents and clear information hierarchy.