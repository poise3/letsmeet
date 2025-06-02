import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import MonthCalendar from "./MonthCalendar";

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();

    try {
      await signOut();
      navigate("/");
    } catch (err) {
      setError("An unexpected error occurred."); // Catch unexpected errors
    }
  };
  console.log(session);
  return (
    <div>
      <div className="flex gap-10 ">
        <div className="w-3/4 pt-8 px-20">
          <div className="bg-emerald-50 rounded-2xl p-10">
            <MonthCalendar />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-4 fancy-font pt-20">LetsMeet</h1>
          <h2>Welcome, {session?.user?.user_metadata.display_name}</h2>
          <div>
            <p
              onClick={handleSignOut}
              className="hover:cursor-pointer  border inline-block px-4 py-3 mt-4 "
            >
              Sign out
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
