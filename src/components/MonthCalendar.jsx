import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import events from "./events";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import DateTimePicker from "react-datetime-picker";
import "../Calendar.css";

moment.locale("en-GB");
const localizer = momentLocalizer(moment);

function MonthCalendar() {
  const { session } = UserAuth(); // get current user
  const [eventsData, setEventsData] = useState([]);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [eventToEdit, setEventToEdit] = useState(null);
  const [sharedWithInput, setSharedWithInput] = useState("");
  const [newStartDate, setNewStartDate] = useState(new Date());
  const [newEndDate, setNewEndDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);


  const fetchEvents = async () => {
    if (!session?.user?.id) return;

    const userId = session.user.id;

    const { data, error } = await supabase
      .from("calendar")
      .select("*")
      .or(`user_id.eq.${userId},shared_with.cs.{"${userId}"}`);

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
    setIsModalOpen(false);
  };

  const handleEdit = async () => {
    if (!eventToEdit) return;

    // Process emails from input
    const emails = sharedWithInput
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const sharedWithUserIds = await getUserIdsFromEmails(emails);


    if (
      !newStartDate ||
      !newEndDate ||
      newStartDate >= newEndDate
    ) {
      alert("Please select valid start and end dates!");
      return;
    }

    // Update (not delete + insert) the event:
    const { error } = await supabase
      .from("calendar")
      .update({
        start: newStartDate,
        end: newEndDate,
        shared_with: sharedWithUserIds,
      })
      .eq("id", eventToEdit.id)
      .eq("user_id", session.user.id);

    if (error) {
      alert("Error saving changes!");
      console.error("Error editing event:", error);
      return;
    }
    fetchEvents();
    setEventToEdit(null);
    setSharedWithInput("");
    setIsModalOpen(false);
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
    setIsModalOpen(false);
  };

  const openModal = async (event) => {
    setEventToEdit(event);
    setNewStartDate(event.start);
    setNewEndDate(event.end);
    if (event.shared_with) {
      const emailsString = await getEmailsFromUserIds(event.shared_with);
      setSharedWithInput(emailsString);
    } else {
      setSharedWithInput("");
    }
    setIsModalOpen(true);
  };

  const handleDateSelect = (selectedDate, isStartDate) => {
    if (isStartDate) {
      setNewStartDate(selectedDate);
    } else {
      setNewEndDate(selectedDate);
    }
  };

  async function getUserIdsFromEmails(emails) {
    if (emails.length === 0) return [];
    // Assuming you have a 'users' table with columns 'id' and 'email'
    const { data, error } = await supabase
      .from("users")
      .select("id, email")
      .in("email", emails);

    if (error) {
      alert("Failed to look up users for sharing.");
      return [];
    }
    console.log(data);
    return data.map((user) => user.id);
  }

  async function getEmailsFromUserIds(userIds) {
    if (!userIds || userIds.length === 0) return "";
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .in("id", userIds);

    if (error) return "";
    return data.map((user) => user.email).join(", ");
  }

  const canEdit = (event) => {
    const userId = session.user.id;
    return (
      event.user_id === userId || (event.shared_with || []).includes(userId)
    );
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
      {isModalOpen && (
      <div className="modal">
        <div className="modal-content">
          <h3>{eventToEdit ? "Edit Event" : "Create New Event"}</h3>
          <label>Start Date & Time:</label>
          <DateTimePicker
            onChange={(date) => {
              handleDateSelect(date, true);
            }}
            disableCalendar={true}
            value={newStartDate}
            disableClock={true}
            clearIcon={null}
          />
          <br />
          <label>End Date & Time:</label>
          <DateTimePicker
            onChange={(date) => {
              handleDateSelect(date, false);
            }}
            disableCalendar={true}
            value={newEndDate}
            disableClock={false}
            clearIcon={null}
          />
          <br />

          <label>Share With (comma-separated emails):</label>
          <input
            type="text"
            value={sharedWithInput}
            onChange={(e) => setSharedWithInput(e.target.value)}
            placeholder="user1@example.com, user2@example.com"
            className="w-full p-2 border rounded"
          />

          {/* Show "Save Changes" and "Delete Event" only when editing an existing event */}
          {eventToEdit ? (
            <>
              <button onClick={handleEdit}>Save Changes</button>
              <button onClick={() => handleDelete(eventToEdit)}>
                Delete Event
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (
                  !newStartDate ||
                  !newEndDate ||
                  newStartDate >= newEndDate
                ) {
                  alert("Please select valid start and end dates!");
                  return;
                }
                // Make sure the start and end dates are set
                handleSelect({ start: newStartDate, end: newEndDate }); // Pass the correct start and end dates
              }}
            >
              Create Event
            </button>
          )}

          <button onClick={() => {setEventToEdit(null);
            () => setIsModalOpen(false);}
          }>Cancel</button>
        </div>
      </div>
      )}
    </div>
  );
}

export default MonthCalendar;
