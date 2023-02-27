// @ts-ignore
import * as userSessions from "../data/userSessions.json"
// @ts-ignore
import * as venues from "../data/venues.json"
import {
    BoundedVenue,
    BoundingBox,
    Coordinate,
    UserSessionVenueEvent,
    SessionEvent,
    UserSession,
    Venue,
    UserVenueResult
} from "./models"
import _ from "lodash"

const RADIUS = 2 // metres

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

const flattenedUserSessionEvents: UserSessionVenueEvent[] = []

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

const sessionsAndVenues: UserSessionVenueEvent[] =
    (flattenedUserSessionEvents.map((e: UserSessionVenueEvent) => {
        for (let i = 0; i < venuesWithBB.length; i++) {
            if (isWithinBB(e.position, venuesWithBB[i].bb)) {
                return {
                    ...e,
                    venueId: venuesWithBB[i].id
                }
            }
        }
        return null
    })
    .filter(Boolean) as UserSessionVenueEvent[])
    .sort((a: UserSessionVenueEvent, b: UserSessionVenueEvent) =>
        new Date(a.userTimeUtc).getTime() - new Date(b.userTimeUtc).getTime())

const sessionsAndVenuesByUser: {
    [userId: string]: UserSessionVenueEvent[]
} = _.groupBy(sessionsAndVenues, (s: UserSessionVenueEvent) => s.userId)

const timeSpentByUserVenue: {
    [userVenueId: string]: UserVenueResult
} = {}

Object.keys(sessionsAndVenuesByUser).forEach((userId: string) => {
    sessionsAndVenuesByUser[userId].forEach((s: UserSessionVenueEvent, i: number, arr: UserSessionVenueEvent[]) => {
        const foundSameVenue = timeSpentByUserVenue[`${s.userId}_${s.venueId}`]

        if (foundSameVenue) {
            timeSpentByUserVenue[`${s.userId}_${s.venueId}`] = {
                userId: s.userId,
                lastUserTimeUtc: s.userTimeUtc,
                timeSpentMs: foundSameVenue.timeSpentMs + (new Date(s.userTimeUtc).getTime() - new Date(foundSameVenue.lastUserTimeUtc).getTime()),
                venueId: s.venueId as string
            }
        } else {
            timeSpentByUserVenue[`${s.userId}_${s.venueId}`] = {
                userId: s.userId,
                lastUserTimeUtc: s.userTimeUtc,
                timeSpentMs: 0,
                venueId: s.venueId as string
            }
        }
    })
})

const results = Object.values(timeSpentByUserVenue).filter((t) => t.timeSpentMs)
console.log("How long each person spends at various venues:", results)