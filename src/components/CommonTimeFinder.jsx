import React, { useState, useEffect } from "react";


const CommonTimeFinder = ( { events, duration, freeHours, period } ) => {

    const getAvailableSlots = (start, end) => {
        const slots = [];
        const { hours: startHour, minutes: startMinute } = freeHours.start;
        const { hours: endHour, minutes: endMinute } = freeHours.end;
        
        let currentDay = new Date(start);
        currentDay.setHours(0, 0, 0, 0); 
        
        while (currentDay < end) {
            const dayStart = new Date(currentDay);
            dayStart.setHours(startHour, startMinute, 0, 0);
            
            const dayEnd = new Date(currentDay);
            dayEnd.setHours(endHour, endMinute, 0, 0);
            
            const slotStart = new Date(Math.max(dayStart, start));
            const slotEnd = new Date(Math.min(dayEnd, end));
            
            const slotDuration = (slotEnd - slotStart) / (1000 * 60); // minutes
            if (slotDuration >= duration) {
                slots.push({
                    start: new Date(slotStart),
                    end: new Date(slotEnd)
                });
            }
            
            currentDay = new Date(currentDay);
            currentDay.setDate(currentDay.getDate() + 1);
        }
        
        return slots;
    };
    const periodStart = period.start;
    const periodEnd = period.end;

    const sortedEvents = [...events].sort((a, b) => a.start - b.start)
                            .filter(event => event.end > periodStart && event.start < periodEnd);

    const { hours: startHour, minutes: startMinute } = freeHours.start;
    const { hours: endHour, minutes: endMinute } = freeHours.end;
    
    if (sortedEvents.length === 0) {
        return getAvailableSlots(periodStart, periodEnd);
    }

    const mergedEvents = [];
    let currentEvent = sortedEvents[0];

    for (let i = 1; i < sortedEvents.length; i++) {
        const nextEvent = sortedEvents[i];
        
        if (nextEvent.start <= currentEvent.end) {
            currentEvent.end = new Date(Math.max(currentEvent.end, nextEvent.end));
        } else {
            mergedEvents.push(currentEvent);
            currentEvent = nextEvent;
        }
    }
    mergedEvents.push(currentEvent);

    const gaps = [];
    let lastEnd = new Date(periodStart);
    lastEnd.setHours(freeHours.start.hours, freeHours.start.minutes, 0, 0);

    if (mergedEvents[0].start > lastEnd) {
        gaps.push(...getAvailableSlots(
            lastEnd,
            mergedEvents[0].start
        ));
    }
    lastEnd = new Date(mergedEvents[0].end);

    // Check gaps between events
    for (let i = 1; i < mergedEvents.length; i++) {
        if (mergedEvents[i].start > lastEnd) {
            gaps.push(...getAvailableSlots(
                lastEnd,
                mergedEvents[i].start
            ));
        }
        lastEnd = new Date(Math.max(lastEnd, mergedEvents[i].end));
    }

    if (lastEnd < periodEnd) {
        const slots = getAvailableSlots(
            new Date(Math.max(lastEnd, periodStart)),
            new Date(periodEnd)
        );
        gaps.push(...slots);
    }


    return gaps;

}

export default CommonTimeFinder;