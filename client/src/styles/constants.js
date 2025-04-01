export const LAYOUT = {
  // Navbar
  NAV_HEIGHT: 64,
  TOP_PADDING: 8,
  
  // Main container
  CONTAINER_HEIGHT: 650,
  CONTENT_PADDING: 24,
  
  // Content positioning
  CONTENT_TOP_MARGIN: 24,
  TITLE_SECTION_HEIGHT: 120,
  
  // Spacing and common values
  GAP: 24,
  PADDING: 24,
  
  // Components
  SUMMARY_HEADER_HEIGHT: 40,
  TRANSLATE_BUTTON_HEIGHT: 40,
  TITLE_ICON_SIZE: 48,
  
  // Auth-related
  AUTH_HEADER_HEIGHT: 64,
  USER_PROFILE_WIDTH: 240,
  
  // Center content positioning
  CENTER_CONTENT_OFFSET: -90,
  SUMMARY_CONTENT_OFFSET: -40,
  
  // Preview thumbnail size
  THUMBNAIL_HEIGHT: 120,
  THUMBNAIL_WIDTH: 160,
  VIDEO_INFO_TOTAL_HEIGHT: 195,
  
  // Title section
  TITLE_SPACING: 8,
  TITLE_SECTION_PADDING: 16,
  ICON_BOTTOM_MARGIN: 0,
};

// Content heights
export const CONTENT_HEIGHTS = {
  MAIN_CONTENT: `calc(100vh - ${LAYOUT.NAV_HEIGHT}px)`,
  TRANSCRIPT: `calc(100vh - ${LAYOUT.NAV_HEIGHT}px - ${LAYOUT.CONTENT_PADDING * 2}px)`,
  SUMMARY: `calc(100vh - ${LAYOUT.NAV_HEIGHT}px - ${LAYOUT.CONTENT_PADDING * 2}px)`,
  
  // For video info section (fixed height)
  VIDEO_INFO: `${LAYOUT.VIDEO_INFO_TOTAL_HEIGHT}px`,
  
  // For login container
  LOGIN_CONTAINER: '480px',
};

// Auth-related constants
export const AUTH = {
  TRANSITION_DURATION: 300,
  USER_MENU_WIDTH: 240,
  PROFILE_PICTURE_SIZE: 32,
};