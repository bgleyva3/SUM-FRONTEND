export const LAYOUT = {
  // Main container
  CONTAINER_HEIGHT: 650,
  
  // Left column components
  THUMBNAIL_HEIGHT: 180,
  TITLE_SECTION_HEIGHT: 80, // For title and channel name
  VIDEO_INFO_TOTAL_HEIGHT: 260, // thumbnail + title section
  
  // Spacing and common values
  GAP: 24, // equivalent to gap-6
  PADDING: 24, // equivalent to p-6
  HEADER_HEIGHT: 40, // equivalent to 2.5rem for section headers
  
  // Right column components
  SUMMARY_HEADER_HEIGHT: 40,
  TRANSLATE_BUTTON_HEIGHT: 40,
  
  // Auth-related components
  AUTH_HEADER_HEIGHT: 64, // Height for the authentication header
  USER_PROFILE_WIDTH: 240, // Width for the user profile dropdown
} as const;

// Calculated heights
export const CONTENT_HEIGHTS = {
  // For transcript: remaining space after video info
  TRANSCRIPT: `calc(${LAYOUT.CONTAINER_HEIGHT}px - var(--video-info-height) - ${LAYOUT.GAP}px - ${LAYOUT.HEADER_HEIGHT}px - ${LAYOUT.PADDING * 2}px)`,
  
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