export interface Coordinate {
    x: number
    y: number
}

export interface BoundingBox {
    xMin: number
    xMax: number
    yMin: number
    yMax: number
}

export interface SessionEvent {
    userTimeUtc: string
    position: Coordinate
}

export interface FlattenedUserSessionEvent {
    userId: string
    startTimeLocal: string
    userTimeUtc: string
    position: Coordinate
    venueId?: string
}

export interface SessionEventWithVenue extends SessionEvent {
    venueId: string
}

export interface UserSession {
    userId: string
    sessionId: string
    startTimeUtc: string
    endTimeUtc: string
    startTimeLocal: string
    path: SessionEvent[]
}

export interface UserSessionVenue {
    userId: string
    sessionId: string
    startTimeUtc: string
    endTimeUtc: string
    startTimeLocal: string
    path: (SessionEventWithVenue | null)[]
}

export interface Venue {
    id: string
    name: string
    position: Coordinate
}

export interface BoundedVenue extends Venue {
    bb: BoundingBox
}
