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
      navigate("/signin");
    } catch (err) {
      setError("An unexpected error occurred."); // Catch unexpected errors
    }
  };
  console.log(session);
  return (
    <div>
      <div className="flex">
        <div className="w-3/4 pt-8 px-20">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 shadow-lg">
            <MonthCalendar />
          </div>
        </div>

        <div className="flex">
          <div>
            <h2 className="pt-12 font-bold text-lg">
              Welcome,{" "}
              {session?.user?.user_metadata.display_name ||
                session?.user?.email}
            </h2>
            <div className="ml-8">
              <p
                onClick={handleSignOut}
                className="inline-block cursor-pointer bg-[#417BFB] text-white font-semibold rounded px-3 py-2 mt-4 shadow text-center"
              >
                Sign Out
              </p>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4 fancy-font pt-12 absolute right-8">
            LetsMeet
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
