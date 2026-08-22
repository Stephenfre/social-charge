type EventLocationLike = {
  formatted_address?: string | null;
  location_text?: string | null;
};

const PUBLIC_EVENT_RANGE_MILES = 5;

export function getPublicEventLocation(event: EventLocationLike) {
  const publicLocation =
    event.location_text?.trim() ||
    cityStateFromAddress(event.formatted_address) ||
    'the event area';

  return `Within ${PUBLIC_EVENT_RANGE_MILES} miles of ${publicLocation}`;
}

export function getEventLocationForAccess(
  event: EventLocationLike,
  canViewExactAddress: boolean
) {
  if (!canViewExactAddress) return getPublicEventLocation(event);

  return event.formatted_address?.trim() || event.location_text?.trim() || 'Location TBA';
}

function cityStateFromAddress(address?: string | null) {
  if (!address) return null;

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return `${parts[parts.length - 3]}, ${parts[parts.length - 2]}`;
  }

  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }

  return null;
}
