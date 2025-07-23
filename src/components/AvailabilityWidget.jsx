import React, { useState, useEffect } from "react";
import DateTimePicker from "react-datetime-picker";
import CommonTimeFinder from "./CommonTimeFinder";
import { supabase } from "../supabaseClient";

const AvailabilityWidget = ({ onClose, currentUserEvents }) => {
  const [emails, setEmails] = useState("");
  const [period, setPeriod] = useState({
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
  });
  const [duration, setDuration] = useState(60);
  const [freeHours, setFreeHours] = useState({
    start: { hours: 9, minutes: 0 },
    end: { hours: 17, minutes: 0 }  
  });
  const [otherUsersEvents, setOtherUsersEvents] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getUserIdsFromEmails = async (emails) => {
    if (emails.length === 0) return [];
    
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .in("email", emails);
      
    if (error) {
      console.error("Error fetching user IDs:", error);
      return [];
    }
    
    return data.map(user => user.id);
  };

  const fetchOtherUsersEvents = async () => {
    if (!emails.trim()) return;
    
    setIsLoading(true);
    try {
      const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
      console.log('Fetching events for emails:', emailList); 
      const userIds = await getUserIdsFromEmails(emailList);
      console.log('Found user IDs:', userIds);

      if (userIds.length === 0) {
        console.log('No user IDs found for these emails'); // Debug 3
        setOtherUsersEvents([]);
        setAvailableSlots([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('calendar')
        .select('*')
        .in('user_id', userIds);

      if (!error) {
        console.log('Raw events from database:', data); // Debug 4
        const processedEvents = data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        console.log('Processed events:', processedEvents); // Debug 5
        setOtherUsersEvents(processedEvents);
        const allEvents = [...currentUserEvents, ...processedEvents];
        console.log('All events being analyzed:', allEvents); // Debug 6
        const slots = CommonTimeFinder({
            events: allEvents,
            duration,
            freeHours,
            period
        });
        console.log('Calculated available slots:', slots); // Debug 7
      setAvailableSlots(slots);
        

      }
    } catch (error) {
      console.error("Error fetching other users' events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const findCommonAvailability = (eventsToUse) => {
    const allEvents = [...currentUserEvents, ...otherUsersEvents];
    const slots = CommonTimeFinder({
        events: eventsToUse || [...currentUserEvents, ...otherUsersEvents],
        duration,
        freeHours,
        period
    });
    setAvailableSlots(slots);
    console.log('Available slots:', slots);
  };

  return (
    <div className="modal">
      <div className="modal-content availability-widget">
        <h3>Find Common Availability</h3>
        
        <div className="form-group">
          <label>Other Users (comma-separated emails):</label>
          <input
            type="text"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="user1@example.com, user2@example.com"
          />
        </div>

        <div className="form-group">
          <label>Time Period:</label>
          <div className="date-range">
            <DateTimePicker
              onChange={(date) => setPeriod(p => ({ ...p, start: date }))}
              value={period.start}
              disableClock
              calendarIcon={null}
              clearIcon={null}
              disableCalendar={true}
            />
            <span> to </span>
            <DateTimePicker
              onChange={(date) => setPeriod(p => ({ ...p, end: date }))}
              value={period.end}
              disableClock
              calendarIcon={null}
              clearIcon={null}
              disableCalendar={true}
              minDate={period.start}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Minimum Slot Duration (minutes):</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="15"
            step="15"
          />
        </div>

        <div className="form-group">
          <label>Free Hours:</label>
          <div className="time-range">
            <input
              type="time"
              value={`${freeHours.start.hours.toString().padStart(2, '0')}:${freeHours.start.minutes.toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                setFreeHours(f => ({ ...f, start: { hours, minutes } }));
              }}
            />
            <span> to </span>
            <input
              type="time"
              value={`${freeHours.end.hours.toString().padStart(2, '0')}:${freeHours.end.minutes.toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                setFreeHours(f => ({ ...f, end: { hours, minutes } }));
              }}
            />
          </div>
        </div>

        <div className="button-group">
          <button 
            onClick={fetchOtherUsersEvents}
            disabled={!emails.trim() || isLoading}
          >
            {isLoading ? 'Loading...' : 'Find Available Times'}
          </button>
          <button onClick={onClose}>Close</button>
        </div>

        {availableSlots.length > 0 && (
          <div className="results">
            <h4>Available Time Slots:</h4>
            <ul>
              {availableSlots.map((slot, i) => (
                <li key={i}>
                  {slot.start.toLocaleString()} - {slot.end.toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityWidget;