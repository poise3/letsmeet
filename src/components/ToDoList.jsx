import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import "../TodoList.css";

const TodoList = () => {
  const { session } = UserAuth();
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState("");

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", session?.user?.id)
      .order("event_id", { ascending: true });

    if (error) console.error("Error loading todos:", error);
    else setTodos(data);
  };

  const fetchTaskEvents = async () => {
    const { data, error } = await supabase
      .from("calendar")
      .select("id, title")
      .or(
        `user_id.eq.${session?.user?.id},shared_with.cs.{"${session?.user?.id}"}`
      )
      .order("id", { ascending: true });
    if (!error) setEvents(data);
  };

  const addTodo = async () => {
    if (!newTask.trim()) return;
    const { error } = await supabase.from("todos").insert([
      {
        user_id: session?.user?.id,
        task: newTask,
        is_complete: false,
        event_id: selectedEvent || null,
      },
    ]);
    if (error) console.error("Error adding todo:", error);
    setNewTask("");
    setSelectedEvent("");
    fetchTodos();
  };

  const toggleComplete = async (id, currentStatus) => {
    const { error } = await supabase
      .from("todos")
      .update({ is_complete: !currentStatus })
      .eq("id", id);
    if (error) console.error("Error updating todo:", error);
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) console.error("Error deleting todo:", error);
    fetchTodos();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user?.id) {
        fetchTaskEvents();
        fetchTodos();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <div className="todo-widget">
      <h3>📝 Event Tasks</h3>
      <div className="todo-input">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />

        <button onClick={addTodo}>Add</button>
      </div>
      <div>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="event-selector"
        >
          <option value="">No Event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>
      <div className="todo-list-container">
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.is_complete ? "completed" : ""}>
              <span onClick={() => toggleComplete(todo.id, todo.is_complete)}>
                {todo.task}
                {}
                {todo.event_id && (
                  <span
                    className="event-link"
                    style={{ color: "#417BFB", fontSize: "0.9em" }}
                  >
                    &nbsp;(
                    {events.find((ev) => ev.id === todo.event_id)?.title ||
                      "Event"}
                    )
                  </span>
                )}
              </span>
              <button onClick={() => deleteTodo(todo.id)}>❌</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TodoList;
