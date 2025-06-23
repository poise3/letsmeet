  import React, { useState, useEffect } from "react";
  import { Calendar, momentLocalizer } from "react-big-calendar";
  import moment from "moment";
  import events from "./events";
  import "react-big-calendar/lib/css/react-big-calendar.css";
  import { supabase } from "../supabaseClient";
  import { UserAuth } from "../context/AuthContext";
  import DateTimePicker from 'react-datetime-picker';
  import '../Calendar.css';

  moment.locale("en-GB");
  const localizer = momentLocalizer(moment);

  function MonthCalendar() {
    const { session } = UserAuth(); // get current user
    const [eventsData, setEventsData] = useState([]);
    const [currentView, setCurrentView] = useState("month");
    const [currentDate, setCurrentDate] = useState(new Date());


    const [showModal, setShowModal] = useState(true);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [newStartDate, setNewStartDate] = useState(new Date());
    const [newEndDate, setNewEndDate] = useState(new Date());

    const fetchEvents = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("calendar")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error loading events:", error);
      } else {
        const parsedEvents = data.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        setEventsData(parsedEvents);
      }
    };

    const handleViewChange = (newView) => {
      setCurrentView(newView); // Update the current view state
    };

    const handleDateChange = (newDate) => {
      console.log("I am running + ${newDate}", currentDate);
      setCurrentDate(newDate); // Update the current view state
    };

    const handleDelete = async (event) => {
      const index = eventsData.findIndex((e) => e.id === event.id);
      const removal = confirm("Are you sure you want to delete this event?");
      if (!removal) return;

      const { error } = await supabase
        .from("calendar")
        .delete()
        .eq("id", event.id)
        .eq("user_id", session.user.id); // safety

      if (error) {
        console.error("Error deleting event:", error);
      } else {
        fetchEvents();
        setEventToEdit(null);
      }
    };
    


    const handleEdit = async () => {
      if (!eventToEdit) return;

      // Delete the old event
      const { error: deleteError } = await supabase
        .from("calendar")
        .delete()
        .eq("id", eventToEdit.id)
        .eq("user_id", session.user.id); // safety check with user ID

      if (deleteError) {
        console.error("Error deleting event:", deleteError);
        return;
      }

      // Insert the new event with updated date and time
      const { error: insertError } = await supabase
        .from("calendar")
        .insert([
          {
            title: eventToEdit.title, // keep the same title
            start: newStartDate,
            end: newEndDate,
            user_id: session.user.id,
          },
        ]);

      if (insertError) {
        console.error("Error saving event:", insertError);
      } else {
        fetchEvents(); // refresh events list
        setEventToEdit(null);
      }
    };

    const handleSelect = async ({ start, end }) => {
      console.log(start);
      console.log(end);
      const title = window.prompt("New Event name");
      if (!title || !session?.user?.id) return;

      const { data, error } = await supabase.from("calendar").insert([
        {
          title,
          start,
          end,
          user_id: session.user.id,
        },
      ]);

      if (error) {
        console.error("Error saving event:", error);
      } else {
        fetchEvents();
      }
    };

    
    const openModal = (event) => {
      setEventToEdit(event);
      setNewStartDate(event.start);
      setNewEndDate(event.end);
      setShowModal(true);
    };

    const handleDateSelect = (selectedDate, isStartDate) => {
      if (isStartDate) {
        setNewStartDate(selectedDate);
      } else {
        setNewEndDate(selectedDate);
      }
    };

    useEffect(() => {
      fetchEvents();
    }, [session]);

    return (
      <div className="App">
        <Calendar
          views={["day", "agenda", "work_week", "month"]}
          selectable
          localizer={localizer}
          date={currentDate}
          view={currentView}
          events={eventsData}
          style={{ height: "85vh" }}
          onSelectEvent={openModal}
          onSelectSlot={handleSelect}
          onView={handleViewChange}
          onNavigate={handleDateChange}
        />

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>{eventToEdit ? "Edit Event" : "Create New Event"}</h3>
              <label>Start Date & Time:</label>
              <DateTimePicker
                onChange={(date) => {handleDateSelect(date, true);}
                }
                disableCalendar={true}
                value={newStartDate}
                disableClock={true}
                clearIcon={null}
              />
              <br />
              <label>End Date & Time:</label>
              <DateTimePicker
                onChange={(date) => {handleDateSelect(date, false);}
                }
                disableCalendar={true}
                value={newEndDate}
                disableClock={false}
                clearIcon={null}
              />
              <br />
              
              {/* Show "Save Changes" and "Delete Event" only when editing an existing event */}
              {eventToEdit ? (
                <>
                  <button onClick={handleEdit}>Save Changes</button>
                  <button onClick={() => handleDelete(eventToEdit)}>Delete Event</button>
                </>
              ) : (
                <button onClick={() => {
                  if (!newStartDate || !newEndDate || newStartDate >= newEndDate) {
                    alert("Please select valid start and end dates!");
                    return;
                  }
                  // Make sure the start and end dates are set
                  handleSelect({ start: newStartDate, end: newEndDate }); // Pass the correct start and end dates
                }}>Create Event</button>
              )}

              <button onClick={() => setEventToEdit(null)}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    );
  }

  export default MonthCalendar;
