export const LAYOUT = {
  // Main container
  CONTAINER_HEIGHT: 650,
  TOP_PADDING: 24, // Keep this for user dropdown spacing
  NAV_HEIGHT: 50,
  
  // Center content positioning
  CENTER_CONTENT_OFFSET: -100, // Keep this for home/preview/loading
  SUMMARY_CONTENT_OFFSET: -80, // Changed from -20 to -80 to move summary content up
  
  // Content spacing
  CONTENT_TOP_MARGIN: 80, // Increased to ensure icon stays in viewport
  TITLE_SECTION_HEIGHT: 180, // Added to account for total height of title + subtitle + input
  
  // Preview thumbnail size
  THUMBNAIL_HEIGHT: 120,
  THUMBNAIL_WIDTH: 160,
  VIDEO_INFO_TOTAL_HEIGHT: 195,
  
  // Spacing and common values
  GAP: 24,
  PADDING: 24,
  HEADER_HEIGHT: 40,
  
  // Title section
  TITLE_ICON_SIZE: 48,
  TITLE_SPACING: 8,
  TITLE_SECTION_PADDING: 16,
  ICON_BOTTOM_MARGIN: 0,
  
  // Right column components
  SUMMARY_HEADER_HEIGHT: 40,
  TRANSLATE_BUTTON_HEIGHT: 40,
  
  // Auth-related components
  AUTH_HEADER_HEIGHT: 64,
  USER_PROFILE_WIDTH: 240,
  
  // Transcript max height
  TRANSCRIPT_MAX_HEIGHT: 400,
} as const;

// Calculated heights
export const CONTENT_HEIGHTS = {
  // For transcript: calculate height to match summary component
  // Container height - video info height - gaps - padding - header
  TRANSCRIPT: `calc(${LAYOUT.CONTAINER_HEIGHT}px - ${LAYOUT.VIDEO_INFO_TOTAL_HEIGHT}px - ${LAYOUT.GAP}px - ${LAYOUT.PADDING * 2}px - ${LAYOUT.HEADER_HEIGHT}px)`,
  
  // For summary: container - header - translate button - padding
  SUMMARY: `calc(${LAYOUT.CONTAINER_HEIGHT}px - ${LAYOUT.SUMMARY_HEADER_HEIGHT}px - ${LAYOUT.PADDING * 2}px)`,
  
  // For video info section (fixed height)
  VIDEO_INFO: `${LAYOUT.VIDEO_INFO_TOTAL_HEIGHT}px`,
  
  // For login container
  LOGIN_CONTAINER: '480px',
} as const;

// Auth-related constants
export const AUTH = {
  TRANSITION_DURATION: 300, // ms for animations
  USER_MENU_WIDTH: 240, // Width of user dropdown menu
  PROFILE_PICTURE_SIZE: 32, // Size of profile picture
} as const;