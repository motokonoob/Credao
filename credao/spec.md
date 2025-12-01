# Credao

## Overview
A marketplace application connecting local farmers and gardeners with buyers for fresh produce sales. The app features interactive garden mapping, crop tracking, and a marketplace for buying/selling produce at any growth stage.

## Core Features

### Seller Features
- **Garden Creation Options**: Two modes for creating gardens:
  - **Map Mode**: Use Leaflet.js with OpenStreetMap to search locations and draw garden boundaries as polygon shapes on the map
  - **Simple Grid Mode**: Create gardens by specifying dimensions in meters (width x height) with default values of 5x5 meters
- **Garden Grid System**: Display saved gardens with 1x1 meter grid overlay where each square can store crop information
- **Multi-Square Crop Management**: Select multiple grid squares to add crop details including name, species, growth stage, planting/harvest dates, and sensor links. Crops can span across multiple grid positions using click-and-drag selection or multi-select toggles
- **Grid Selection Interface**: Visual highlighting of selected grid regions during crop creation, allowing users to confirm which squares are linked before saving
- **Growth Tracking**: Track crop stages with predictive harvest date estimation
- **Manual Growth Stage Control**: On the My Assets page, sellers can manually update the growth stage of each crop asset using a dropdown or toggle control with options including Germination, Seedling, Vegetative, Flowering, and Harvest-ready
- **Automatic Marketplace Eligibility**: When a seller marks an asset as "harvest-ready," the system automatically updates the crop's marketplace status to make it eligible for immediate purchase
- **Real-time Status Updates**: Changes to growth stage immediately reflect across both My Assets and Marketplace views without requiring page refresh
- **Marketplace Listing**: List crops for sale at any growth stage with price, quantity, availability status, and harvest readiness information
- **Progress Calendar**: View care reminders and upcoming harvest milestones

### Buyer Features
- **Browse Marketplace**: Card-style listings showing crop name, price, location, growth stage, and harvest date information
- **Product Details**: View complete growing information, grid placement across multiple squares, sensor data, and harvest readiness
- **Filtering**: Filter listings by crop type, harvest date, location, price range, and availability status
- **Purchase System**: Select quantities and complete purchases for harvest-ready crops only
- **Direct Purchase Interface**: Each marketplace listing card includes dynamic availability status with:
  - **"Available Now"** badge (green) with "Order Now" button for harvest-ready crops (`isHarvestReady = true`)
  - **"Available Soon"** badge (orange) with "Ready by [harvest date]" label and disabled order button for crops not yet harvest-ready
- **Order Creation**: Purchase dialog displays selected product details, allows quantity selection, shows dynamic total price calculation, and validates harvest-ready status (only "Available Now" listings can proceed to purchase)
- **Order Confirmation**: Clear confirmation message upon successful purchase completion

### Calendar Features
- **Interactive Visual Calendar**: Monthly view calendar displaying harvest schedules for all crops
- **Crop Event Display**: Each crop appears as an event on its predicted or actual harvest date
- **Color-Coded Status**: "Ready Now" crops displayed in green, "Available Soon" crops in orange
- **Interactive Crop Details**: Hover or click on calendar days to view crop details including name, growth stage, and garden name
- **Month Navigation**: Easy navigation between months to view future and past harvest schedules
- **Real-time Updates**: Calendar automatically updates when growth stages or harvest dates change
- **Care Reminders**: Display care alerts and harvest notifications alongside crop events

### Navigation
The app includes tabbed navigation with:
1. Garden Grid (seller view)
2. My Assets (seller crop management with growth stage controls)
3. Calendar (interactive visual calendar with harvest schedules and care reminders)
4. Marketplace (buyer/seller marketplace)

## Backend Data Storage
The backend stores:
- User profiles with seller/buyer roles
- Garden data including boundary coordinates (polygon arrays for map-based gardens, auto-generated placeholder coordinates for grid-based gardens)
- Garden grid metadata including dimensions (width x height in meters) and garden type (map-based or grid-based)
- Garden assets with crop details, growth stages, sensor links, and multiple grid positions stored as arrays of coordinate pairs
- Marketplace listings for crops at any growth stage with harvest date information and harvest readiness status (`isHarvestReady` field)
- Purchase orders and transaction history (restricted to harvest-ready crops)
- Order records with buyer principal, listing ID, quantity, total price, and order status
- Care alerts and harvest notifications

## Backend Operations
- CRUD operations for all data entities with support for multi-position crop assets
- Garden creation supporting both map-drawn polygons and simple grid dimensions
- Garden polygon coordinate management and auto-generation for grid-based gardens
- Multi-position crop asset management with array-based grid position storage
- **Secure Growth Stage Updates**: Backend function to update crop growth stage with validation that only the asset owner can make changes
- **Automatic Harvest Status Management**: When growth stage is updated to "harvest-ready," automatically set `isHarvestReady = true` and update marketplace eligibility
- **Owner Validation**: Security checks to ensure only the crop asset owner can modify growth stages
- Marketplace listing management supporting crops at any growth stage with harvest date tracking
- Order processing restricted to harvest-ready crops only
- Order creation function accepting buyer principal, listing ID, quantity, total price, and status
- Order storage and tracking for both buyers and sellers
- Alert generation for care reminders
- Backward compatibility handling for existing single-square crops

## Design Requirements
- Responsive, mobile-friendly interface
- Agricultural theme using green, beige, and natural earth tones
- Card-based layout for marketplace listings with visual distinction between harvest-ready and upcoming crops
- **Growth Stage Controls**: Dropdown or toggle interface on My Assets page for each crop asset allowing manual stage selection
- **Real-time UI Updates**: Immediate visual feedback when growth stage changes, updating both My Assets and Marketplace views
- **Interactive Calendar Design**: Monthly grid layout with clear date cells, crop events displayed as colored indicators or badges within date cells
- **Calendar Color Coding**: Green indicators for "Ready Now" crops, orange indicators for "Available Soon" crops
- **Calendar Navigation**: Previous/next month buttons and month/year selector for easy navigation
- **Crop Detail Tooltips**: Hover or click interactions showing crop name, growth stage, and garden name in popup or sidebar
- **Dynamic Availability Badges**: 
  - Green "Available Now" badge for harvest-ready crops with enabled "Order Now" button
  - Orange "Available Soon" badge for non-harvest-ready crops with "Ready by [Date]" label and disabled order button
- Grid visualization for garden management with multi-square crop display as grouped rectangles or highlighted areas
- Visual selection highlighting during crop creation process
- Crop-specific icons for different plant types
- Toggle interface for switching between Map Mode and Simple Grid Mode in garden creation
- Click-and-drag and multi-select toggle functionality for grid square selection
- Purchase buttons that are dynamically enabled/disabled based on harvest readiness status
- Purchase dialog with quantity selection, price calculation, and harvest status validation (only allows "Available Now" listings to proceed)
- Clear purchase confirmation messaging
- **App Branding**: All UI components, headers, titles, modals, and text elements display "Credao" as the application name
- **Browser Tab Title**: Main tab title and meta-title display "Credao"

## Technical Integration
- Leaflet.js integration for interactive mapping (Map Mode only)
- OpenStreetMap as the base map layer (Map Mode only)
- **Calendar Component Integration**: Interactive calendar component with monthly view, event rendering, and navigation controls
- **Real-time Calendar Updates**: Frontend state management to automatically refresh calendar when crop data changes
- **Calendar Event Handling**: Click and hover event handlers for crop detail display
- Placeholder endpoints for Arduino sensor data integration
- Future-ready architecture for real sensor connectivity
- Default 5x5 grid garden creation when no specific dimensions are provided
- Multi-position data handling with backward compatibility for single-square crops
- **Real-time State Management**: Frontend state synchronization to reflect growth stage changes immediately across all views including calendar
- **Secure API Endpoints**: Backend endpoints for growth stage updates with proper authentication and authorization
- Purchase dialog component integration with marketplace listings with harvest readiness validation
- Dynamic price calculation and order validation restricted to harvest-ready crops
- Frontend logic to dynamically render availability badges and button states based on `isHarvestReady` field

## User Experience
- Clean, intuitive interface suitable for farmers and gardeners
- Visual crop tracking with progress indicators
- **Interactive Calendar Navigation**: Smooth month-to-month navigation with visual feedback
- **Intuitive Crop Event Interaction**: Easy-to-discover hover and click interactions for viewing crop details
- **Visual Harvest Planning**: Clear overview of upcoming harvests and current availability across monthly timeline
- **Intuitive Growth Stage Management**: Easy-to-use controls for updating crop growth stages with immediate visual feedback
- **Seamless Status Updates**: Real-time synchronization between My Assets management, Marketplace availability, and Calendar display
- Easy-to-use drawing tools for garden boundary creation (Map Mode)
- Simple dimension input fields for quick garden setup (Simple Grid Mode)
- Intuitive multi-square selection with visual feedback and confirmation
- Seamless transition between map-based and grid-based garden views
- **Clear Marketplace Status Indicators**: Immediate visual distinction between crops available for immediate purchase versus those available in the future
- **Conditional Purchase Flow**: Only harvest-ready crops can proceed through the purchase dialog, with clear visual feedback on availability status
- One-click purchase initiation from marketplace cards (when harvest-ready)
- Clear visual representation of crops spanning multiple grid squares
- Marketplace browsing showing both current and future harvest availability with distinct styling
- Immediate purchase confirmation and order tracking
- **Consistent Branding**: "Credao" branding throughout all user interface elements and components
