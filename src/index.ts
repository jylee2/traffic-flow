// @ts-ignore
import * as userSessions from "../data/userSessions.json"
// @ts-ignore
import * as venues from "../data/venues.json"
import { BoundedVenue, BoundingBox, Coordinate, FlattenedUserSessionEvent, SessionEvent, SessionEventWithVenue, UserSession, UserSessionVenue, Venue } from "./models"

const RADIUS = 2 // metres

// console.log('--------userSessions', userSessions[0])
// console.log('--------typeof venues, venues[0], venues.length', typeof venues, venues[0], venues.length)

const venuesWithBB: BoundedVenue[] = venues["default"].map((venue: Venue) => {
    return {
    ...venue,
    bb: {
        xMin: venue.position.x - RADIUS,
        xMax: venue.position.x + RADIUS,
        yMin: venue.position.y - RADIUS,
        yMax: venue.position.y + RADIUS,
    }
}})

const isWithinBB = (
    userPosition: Coordinate,
    venueBB: BoundingBox
): boolean => {
    if (
        userPosition.x >= venueBB.xMin &&
        userPosition.x <= venueBB.xMax &&
        userPosition.y >= venueBB.yMin &&
        userPosition.y <= venueBB.yMax
    ) {
        return true
    }

    return false
}

const flattenedUserSessionEvents: FlattenedUserSessionEvent[] = []

userSessions["default"].forEach((userSession: UserSession) => {
    userSession.path.forEach((p: SessionEvent) => {
        flattenedUserSessionEvents.push({
            userId: userSession.userId,
            startTimeLocal: userSession.startTimeLocal,
            userTimeUtc: p.userTimeUtc,
            position: p.position
        })
    })
})

// console.log('--------venuesWithBB', venuesWithBB[0])

const filteredUserSessions: UserSessionVenue[] = userSessions["default"].map((userSession: UserSession) => {
    const filteredPaths: SessionEventWithVenue[] = (userSession.path.map((path: SessionEvent) => {
        for (let i = 0; i < venuesWithBB.length; i++) {
            if (isWithinBB(path.position, venuesWithBB[i].bb)) {
                return {
                    ...path,
                    venueId: venuesWithBB[i].id
                }
            }
        }
        return null
    })
    .filter(Boolean) as SessionEventWithVenue[])
    .sort((a: SessionEventWithVenue, b: SessionEventWithVenue) => new Date(a.userTimeUtc).getTime() - new Date(b.userTimeUtc).getTime())

    return {
        ...userSession,
        path: filteredPaths
    }
})
.filter((userSession: UserSessionVenue) => userSession.path.length)

console.log('--------filteredUserSessions[0]', filteredUserSessions[0])