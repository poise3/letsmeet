import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);

  // Sign up
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

    // Step 2: Extract the user ID from the returned data
    // (Supabase v2: data.user, sometimes just data.user if returned synchronously, or data.session.user if returned after email confirmation)
    let userId = null;
    if (data.user && data.user.id) {
      userId = data.user.id;
    } else if (data.session && data.session.user && data.session.user.id) {
      userId = data.session.user.id;
    }

    if (!userId) {
      // If the user ID isn't available yet (email confirmation needed), skip for now.
      // You might want to populate the users table on their first sign-in as a fallback.
      console.warn(
        "User ID not available after sign-up. Will sync on first sign-in."
      );
      return { success: true, data };
    }

    // Step 3: Insert into the 'users' table
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: userId,
        email: email.toLowerCase(),
      },
    ]);

    if (insertError) {
      // Not critical, but log it
      console.error("Error adding user to public users table:", insertError);
    }

    return { success: true, data };
  };

  // Sign in
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      // Handle Supabase error explicitly
      if (error) {
        console.error("Sign-in error:", error.message); // Log the error for debugging
        return { success: false, error: error.message }; // Return the error
      }

      // If no error, return success
      console.log("Sign-in success:", data);
      return { success: true, data }; // Return the user data
    } catch (error) {
      // Handle unexpected issues
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

  // Sign out
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
