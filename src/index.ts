// @ts-ignore
import * as rawUserSessions from "../data/userSessions.json"
// @ts-ignore
import * as rawVenues from "../data/venues.json"
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

export const getTimeSpentBySession = (
    userSessions: UserSession[],
    venues: Venue[]
): UserVenueResult[] => {
    const venuesWithBB: BoundedVenue[] = venues.map((venue: Venue) => {
        return {
            ...venue,
            bb: {
                xMin: venue.position.x - RADIUS,
                xMax: venue.position.x + RADIUS,
                yMin: venue.position.y - RADIUS,
                yMax: venue.position.y + RADIUS,
            }
        }
    })

    const flattenedUserSessionEvents: UserSessionVenueEvent[] = []

    userSessions.forEach((userSession: UserSession) => {
        userSession.path.forEach((p: SessionEvent) => {
            flattenedUserSessionEvents.push({
                userId: userSession.userId,
                startTimeUtc: userSession.startTimeUtc,
                endTimeUtc: userSession.endTimeUtc,
                startTimeLocal: userSession.startTimeLocal,
                userTimeUtc: p.userTimeUtc,
                position: p.position
            })
        })
    })

    const sessionsWithVenue: UserSessionVenueEvent[] =
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

    const sessionsWithVenueByUser: {
        [userId: string]: UserSessionVenueEvent[]
    } = _.groupBy(sessionsWithVenue, (s: UserSessionVenueEvent) => s.userId)

    const timeSpentByUserVenue: {
        [key: string]: UserVenueResult
    } = {}

    Object.keys(sessionsWithVenueByUser).forEach((userId: string) => {
        sessionsWithVenueByUser[userId].forEach((s: UserSessionVenueEvent) => {
            const foundSameVenue = timeSpentByUserVenue[`${s.userId}_${s.venueId}_${s.startTimeUtc}`]

            if (foundSameVenue) {
                const timeSpentMs: number =
                    foundSameVenue.timeSpentMs + (new Date(s.userTimeUtc).getTime() - new Date(foundSameVenue.lastUserTimeUtc).getTime())
                timeSpentByUserVenue[`${s.userId}_${s.venueId}_${s.startTimeUtc}`] = {
                    userId: s.userId,
                    lastUserTimeUtc: s.userTimeUtc,
                    timeSpentMs,
                    venueId: s.venueId as string
                }
            } else {
                timeSpentByUserVenue[`${s.userId}_${s.venueId}_${s.startTimeUtc}`] = {
                    userId: s.userId,
                    lastUserTimeUtc: s.userTimeUtc,
                    timeSpentMs: 0,
                    venueId: s.venueId as string
                }
            }
        })
    })

    const results: UserVenueResult[] = Object.values(timeSpentByUserVenue).filter((t) => t.timeSpentMs)
    return results;
}

console.log(
    "How long each person spends at various venues:",
    getTimeSpentBySession(rawUserSessions["default"], rawVenues["default"])
);