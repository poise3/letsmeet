import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import events from "./events";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

moment.locale("en-GB");
const localizer = momentLocalizer(moment);

function MonthCalendar() {
  const { session } = UserAuth(); // get current user
  const [eventsData, setEventsData] = useState([]);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchEvents = async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from("calendar")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error loading events:", error);
    } else {
      setEventsData(data);
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
        onSelectEvent={handleDelete}
        onSelectSlot={handleSelect}
        onView={handleViewChange}
        onNavigate={handleDateChange}
      />
    </div>
  );
}

export default MonthCalendar;
