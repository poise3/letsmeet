
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import "../TodoList.css";

const TodoList = () => {
  const { session } = UserAuth();
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState("");

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", session?.user?.id)
      .order("created_at", { ascending: true });

    if (error) console.error("Error loading todos:", error);
    else setTodos(data);
  };

  const addTodo = async () => {
    if (!newTask.trim()) return;
    const { error } = await supabase.from("todos").insert([
      {
        user_id: session?.user?.id,
        task: newTask,
        is_complete: false,
      },
    ]);
    if (error) console.error("Error adding todo:", error);
    setNewTask("");
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
    if (session?.user?.id) {
      fetchTodos();
    }
  }, [session]);

  return (
    <div className="todo-widget">
      <h3>📝 To-Do List</h3>
      <div className="todo-input">
        <input
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <div className="todo-list-container">
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.is_complete ? "completed" : ""}>
              <span onClick={() => toggleComplete(todo.id, todo.is_complete)}>
                {todo.task}
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
