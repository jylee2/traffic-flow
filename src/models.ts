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

export interface UserSessionVenueEvent {
    userId: string
    startTimeUtc: string
    endTimeUtc: string
    startTimeLocal: string
    userTimeUtc: string
    position: Coordinate
    venueId?: string
}

export interface UserVenueResult {
    userId: string
    lastUserTimeUtc: string
    timeSpentMs: number
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

export interface Venue {
    id: string
    name: string
    position: Coordinate
}

export interface BoundedVenue extends Venue {
    bb: BoundingBox
}
