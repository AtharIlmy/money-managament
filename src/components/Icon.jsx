import React from 'react';

// Mapping from standard emojis / keywords to Google Material Symbols font ligatures
const EMOJI_TO_ICON = {
  // Navigation & Core
  '⊞': 'grid_view',
  '↕': 'swap_vert',
  '◎': 'account_balance_wallet',
  '◈': 'pie_chart',
  '▤': 'bar_chart',
  
  // Arrows
  '↙': 'south_west',
  '↗': 'north_east',
  '↑': 'arrow_upward',
  '↓': 'arrow_downward',
  '→': 'arrow_forward',
  '←': 'arrow_back',
  
  // Finance & Money
  '💰': 'payments',
  '💸': 'payments',
  '💵': 'attach_money',
  '🪙': 'monetization_on',
  '💳': 'credit_card',
  '🏦': 'account_balance',
  '🏪': 'store',
  
  // Calendar & Notifications
  '📅': 'calendar_today',
  '🔔': 'notifications',
  '⏳': 'hourglass_empty',
  '✅': 'check_circle',
  '✓': 'check',
  '✗': 'close',
  
  // Plants & Nature
  '🌱': 'spa',
  
  // Settings & Help
  '⚙': 'settings',
  '⚙️': 'settings',
  '❓': 'help',
  
  // Shopping, Food, Work
  '🛒': 'shopping_cart',
  '👜': 'shopping_bag',
  '🛍️': 'local_mall',
  '🛍': 'local_mall',
  '☕': 'coffee',
  '💼': 'work',
  '🏷️': 'label',
  '🏷': 'label',
  
  // Security & Actions
  '🔒': 'lock',
  '🗑️': 'delete',
  '🗑': 'delete',
  '👁️': 'visibility',
  '👁': 'visibility',
  '🙈': 'visibility_off',
  '💡': 'lightbulb',
  '✦': 'auto_awesome',
  
  // Goals & Categories
  '🎯': 'track_changes',
  '🛡️': 'shield',
  '🛡': 'shield',
  '✈️': 'flight',
  '✈': 'flight',
  '🚗': 'directions_car',
  '🏡': 'home',
  '🏠': 'home',
  '📈': 'trending_up',
  '📉': 'trending_down',
  '📊': 'analytics',
  '🎓': 'school',
  '🕋': 'mosque',
  
  // Bills & Utilities
  '📶': 'wifi',
  '⚡': 'bolt',
  '🎬': 'movie',
  '🏥': 'local_hospital',
  '📱': 'smartphone',
  '📄': 'description',
  '📝': 'edit_note',
  '📋': 'assignment',
  '🥧': 'pie_chart',
  '👛': 'wallet',
};

export default function Icon({ name, size = 18, color, className = '', style = {} }) {
  if (!name) return null;

  // Check if name is in emoji map, otherwise use name as the icon ligature
  const iconName = EMOJI_TO_ICON[name] || name;

  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        color: color || 'currentColor',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {iconName}
    </span>
  );
}
