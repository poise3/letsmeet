import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import events from "./events";
import "react-big-calendar/lib/css/react-big-calendar.css";

moment.locale("en-GB");
const localizer = momentLocalizer(moment);

function MonthCalendar() {
  const [eventsData, setEventsData] = useState(events);
  const [currentView, setCurrentView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleViewChange = (newView) => {
    setCurrentView(newView); // Update the current view state
  };

  const handleDateChange = (newDate) => {
    console.log("I am running + ${newDate}", currentDate);
    setCurrentDate(newDate); // Update the current view state
  };

  const handleDelete = (event) => {
    const index = eventsData.findIndex((e) => e.id === event.id);
    const removal = confirm("Are you sure you want to delete this event?");
    if (removal)
      if (index !== -1) {
        setEventsData((prevEventsData) =>
          prevEventsData.filter((e, i) => i !== index)
        );
      }
  };

  const handleSelect = ({ start, end }) => {
    console.log(start);
    console.log(end);
    const title = window.prompt("New Event name");
    if (title)
      setEventsData([
        ...eventsData,
        {
          start,
          end,
          title,
        },
      ]);
  };

  useEffect(() => {
    console.log("Calendar View or Events Updated!" + { currentView });
  }, [currentView, eventsData]);

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
