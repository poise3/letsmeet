import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { session, error } = await signInUser(email, password);

    if (error) {
      setError(error);

      setTimeout(() => {
        setError("");
      }, 3000);
    } else {
      navigate("/dashboard");
    }

    if (session) {
      closeModal();
      setError("");
    }
  };

  return (
    <div>
      <h1 className=" text-center text-3xl pt-40 fancy-font">LetsMeet</h1>
      <form onSubmit={handleSignIn} className="max-w-md m-auto pt-20">
        <p className="font-bold pb-2 text-center">
          Don't have an account yet? <Link to="/signup">Sign up</Link>
        </p>
        <div className="flex flex-col py-4 ">
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
        <button className="w-full mt-4">Sign In</button>
        {error && <p className="text-red-600 text-center pt-4">{error}</p>}
      </form>
    </div>
  );
};

export default Signin;
