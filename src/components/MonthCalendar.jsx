import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import events from "./events";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import DateTimePicker from "react-datetime-picker";
import "../Calendar.css";
import TodoList from "./ToDoList.jsx";
import MFA from "./MFA.jsx";
import VisualisationPanel from "./VisualisationPanel";
import "../VisualisationPanel.css";
import AvailabilityWidget from "./AvailabilityWidget.jsx";
import "../AvailabilityWidget.css"

moment.locale("en-GB");
const localizer = momentLocalizer(moment);

function MonthCalendar() {
  const { session } = UserAuth();
  const [eventsData, setEventsData] = useState([]);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [eventToEdit, setEventToEdit] = useState(null);
  const [sharedWithInput, setSharedWithInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [newStartDate, setNewStartDate] = useState(new Date());
  const [newEndDate, setNewEndDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharedUpcomingEvents, setSharedUpcomingEvents] = useState([]);
  const [isPanelOnTop, setPanelOnTop] = useState(false);
  const [showAvailabilityWidget, setShowAvailabilityWidget] = useState(false);

  const fetchEvents = async () => {
    if (!session?.user?.id) return;

    const userId = session.user.id;

    const { data, error } = await supabase
      .from("calendar")
      .select("*")
      .or(`user_id.eq.${userId},shared_with.cs.{"${userId}"}`);

    if (error) {
      console.error("error fetching:", error);
    } else {
      const parsedEvents = data.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEventsData(parsedEvents);

      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const sharedEvents = parsedEvents.filter(
        (event) =>
          event.shared_with.length > 0 &&
          event.start >= now &&
          event.start <= sevenDaysFromNow
      );

      setSharedUpcomingEvents(sharedEvents);
    }
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
  };

  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleDelete = async (event) => {
    const index = eventsData.findIndex((e) => e.id === event.id);
    const removal = confirm("Are you sure you want to delete this event?");
    if (!removal) return;

    const { error } = await supabase
      .from("calendar")
      .delete()
      .eq("id", event.id);

    if (error) {
      console.error("error deleting:", error);
    } else {
      fetchEvents();
      setEventToEdit(null);
    }
    setIsModalOpen(false);
  };

  const handleEdit = async () => {
    if (!eventToEdit) return;

    const emails = sharedWithInput
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const sharedIDs = await getUserIdsFromEmails(emails);

    if (!eventTitle) {
      alert("Please enter event title!");
      return;
    }

    if (!newStartDate || !newEndDate || newStartDate >= newEndDate) {
      alert("Please select valid start and end dates!");
      return;
    }

    const { error } = await supabase
      .from("calendar")
      .update({
        title: eventTitle,
        desc: descInput,
        start: newStartDate,
        end: newEndDate,
        shared_with: sharedIDs,
      })
      .eq("id", eventToEdit.id);

    if (error) {
      alert("Error saving changes!");
      console.error("error editing:", error);
      return;
    }
    fetchEvents();
    setEventToEdit(null);
    setSharedWithInput("");
    setIsModalOpen(false);
  };

  const handleCreateEvent = async () => {
    if (!session?.user?.id) return;

    const emails = sharedWithInput
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const sharedIDs = await getUserIdsFromEmails(emails);

    if (!eventTitle) {
      alert("Please enter event title!");
      return;
    }

    if (!newStartDate || !newEndDate || newStartDate >= newEndDate) {
      alert("Please select valid start and end dates!");
      return;
    }

    const { data, error } = await supabase.from("calendar").insert([
      {
        title: eventTitle,
        desc: descInput,
        start: newStartDate,
        end: newEndDate,
        user_id: session.user.id,
        shared_with: sharedIDs,
      },
    ]);

    if (error) {
      alert("Error creating event");
      console.error("error creating: ", error);
      return;
    }
    fetchEvents();
    setEventToEdit(null);
    setSharedWithInput("");
    setIsModalOpen(false);
  };

  const handleSelect = async ({ start, end }) => {
    openModalForCreate();
    setNewStartDate(start);
    setNewEndDate(end);
  };

  const openModal = async (event) => {
    setEventToEdit(event);
    setEventTitle(event.title);
    setDescInput(event.desc);
    setNewStartDate(event.start);
    setNewEndDate(event.end);
    if (event.shared_with) {
      const emails = await getEmailsFromUserIds(event.shared_with);
      setSharedWithInput(emails);
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

    const { data, error } = await supabase
      .from("users")
      .select("id, email")
      .in("email", emails);

    if (error) {
      alert("failed lookup");
      return [];
    }
    console.log("fetched: ", emails, data);

    return data.map((user) => user.id);
  }

  async function getEmailsFromUserIds(userIds) {
    if (!userIds || userIds.length === 0) return "";
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .in("id", userIds);

    if (error) return "";
    console.log("fetched: ", userIds, data);

    return data.map((user) => user.email).join(", ");
  }

  const openModalForCreate = () => {
    setEventTitle("");
    setSharedWithInput("");
    setDescInput("");
    setNewStartDate(new Date());
    setNewEndDate(new Date());
    setIsModalOpen(true);
  };

  const putPanelOnTop = () => {
    setPanelOnTop(!isPanelOnTop);
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
        eventPropGetter={eventStyle}
      />
      <MFA />
      <button className="create-event-btn" onClick={openModalForCreate}>
        Create New Event
      </button>
      <button className="visual-panel-toggle" onClick={putPanelOnTop}>
        Toggle Panel
      </button>
      <VisualisationPanel
        panelOnTop={isPanelOnTop}
        events={eventsData}
        currentDate={currentDate}
        currentView={currentView}
      />
      <button className="availability-widget-btn" onClick={() => setShowAvailabilityWidget(true)}>
        Find Common Availability
      </button>
      {showAvailabilityWidget && (
        <AvailabilityWidget
          onClose={() => setShowAvailabilityWidget(false)}
          currentUserEvents={eventsData}
        />
      )}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{eventToEdit ? "Edit Event" : "Create New Event"}</h3>
            <label>Title:</label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Study with Timmy"
              className="w-full p-2 border rounded"
            />
            <label>Share With:</label>
            <input
              type="text"
              value={sharedWithInput}
              onChange={(e) => setSharedWithInput(e.target.value)}
              placeholder="user1@example.com, user2@example.com"
              className="w-full p-2 border rounded"
            />
            <label>Notes/Description:</label>
            <textarea
              type="text"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              placeholder="Meetup details, google doc link etc."
              className="w-full p-2 border rounded"
              rows={4}
            />
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
                  handleCreateEvent();
                  setIsModalOpen(false);
                  setEventToEdit(null);
                }}
              >
                Create Event
              </button>
            )}

            <button
              onClick={() => {
                setEventToEdit(null);
                setIsModalOpen(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="sidebar">
        <div className="todo-section">
          <TodoList />
        </div>
        <div className="shared-upcoming-events">
          <h3>Upcoming Shared Events </h3>
          <h4>(Next 7 Days)</h4>
          {sharedUpcomingEvents.length === 0 ? (
            <p>No upcoming shared events.</p>
          ) : (
            <div className="listcontainer">
              <ul>
                {sharedUpcomingEvents.map((event) => (
                  <li key={event.id}>
                    <strong>{event.title}</strong>
                    <br />
                    <small>
                      {event.start.toLocaleString()} →{" "}
                      {event.end.toLocaleString()}
                    </small>
                    <br />
                    {event.desc && <em>{event.desc}</em>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function eventStyle(event) {
  const isGroup = event.shared_with && event.shared_with.length > 0;
  const backgroundColor = isGroup ? "#16a34a" : "#417BFB";
  return {
    style: {
      backgroundColor,
      borderRadius: "8px",
      color: "white",
      padding: "2px 8px",
    },
  };
}

export default MonthCalendar;
