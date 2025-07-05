import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);

  const signUpNewUser = async (displayName, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      options: {
        data: {
          display_name: displayName,
        },
      },
      email: email.toLowerCase(),
      password: password,
    });

    if (error) {
      console.error("Error signing up: ", error);
      return { success: false, error };
    }

    let userId = null;
    if (data.user && data.user.id) {
      userId = data.user.id;
    } else if (data.session && data.session.user && data.session.user.id) {
      userId = data.session.user.id;
    }

    if (!userId) {
      console.warn(
        "User ID not available after sign-up. Will sync on first sign-in."
      );
      return { success: true, data };
    }

    const { error: insertError } = await supabase.from("users").insert([
      {
        id: userId,
        email: email.toLowerCase(),
      },
    ]);

    if (insertError) {
      console.error("Error adding user to public users table:", insertError);
    }

    return { success: true, data };
  };

  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      if (error) {
        console.error("Sign-in error:", error.message);
        return { success: false, error: error.message };
      }

      console.log("Sign-in success:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Unexpected error during sign-in:", err.message);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <AuthContext.Provider
      value={{ signUpNewUser, signInUser, session, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
