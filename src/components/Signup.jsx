import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signUpNewUser(displayName, email, password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className=" text-center text-3xl pt-40 fancy-font">LetsMeet</h1>
      <form onSubmit={handleSignUp} className="max-w-md m-auto pt-20">
        <p className="font-bold pb-2 text-center">
          Already have an account? <Link to="/">Sign in</Link>
        </p>

        <div className="flex flex-col py-4">
          <input
            onChange={(e) => setDisplayName(e.target.value)}
            className="p-3 mt-2"
            type="text"
            name="displayName"
            id="displayName"
            placeholder="Display Name"
          />
        </div>

        <div className="flex flex-col py-4">
          <input
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 mt-2"
            type="email"
            name="email"
            id="email"
            placeholder="Email"
          />
        </div>
        <div className="flex flex-col py-4">
          <input
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 mt-2"
            type="password"
            name="password"
            id="password"
            placeholder="Password"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full mt-4">
          Sign Up
        </button>
        {error && <p className="text-red-600 text-center pt-4">{error}</p>}
      </form>
    </div>
  );
};

export default Signup;
