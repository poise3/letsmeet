import { Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, addDays, isWithinInterval } from 'date-fns';
import React, { useState, useEffect } from "react";

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const VisualisationPanel = ({ panelOnTop, events, currentDate, currentView }) => {
  const getDateRange = () => {
    switch (currentView) {
      case 'day':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate)
        };
      case 'work_week':
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 })
        };
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        };
      case 'agenda':
      return {
        start: currentDate,
        end: addDays(currentDate, 31)
      };
      default:
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        };
    }
  };

  const { start, end } = getDateRange();


  const filteredEvents = events.filter(event => 
    isWithinInterval(event.start, { start, end }) || 
    isWithinInterval(event.end, { start, end })
  );

  const now = new Date();
  const passedEvents = filteredEvents.filter(event => event.end < now);
  const upcomingEvents = filteredEvents.filter(event => event.end >= now);
  
  const pieData = {
    labels: ['Passed Events', 'Upcoming Events'],
    datasets: [
      {
        data: [passedEvents.length, upcomingEvents.length],
        backgroundColor: ['#FF6384', '#36A2EB'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB'],
      },
    ],
  };

  const daysInRange = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const dailyEventCounts = Array(daysInRange).fill(0);
  const dailyEventDurations = Array(daysInRange).fill(0);
  
  filteredEvents.forEach(event => {
    const eventDay = Math.floor((event.start - start) / (1000 * 60 * 60 * 24));
    if (eventDay >= 0 && eventDay < daysInRange) {
      dailyEventCounts[eventDay]++;
      dailyEventDurations[eventDay] += (event.end - event.start) / (1000 * 60 * 60); 
    }
  });

  const lineData = {
    labels: Array.from({ length: daysInRange }, (_, i) => 
      format(addDays(start, i), 'MMM dd')),
    datasets: [
      {
        label: 'Number of Events',
        data: dailyEventCounts,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Total Duration (hours)',
        data: dailyEventDurations,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y1',
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Event Frequency and Duration',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div>
    {panelOnTop && (
    <div className="visualisation-panel">
      <div className="chart-container">
        <h3>Event Distribution</h3>
        <div style={{ height: '300px' }}>
          <Pie data={pieData} />
        </div>
      </div>
      <div className="chart-container">
        <h3>Event Timeline</h3>
        <div style={{ height: '300px' }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>
    </div>
  )}
  </div>
  );
};

export default VisualisationPanel;