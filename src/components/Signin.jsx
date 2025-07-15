import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const [showMfaPrompt, setShowMfaPrompt] = useState(false);
  const [MFACode, setMFACode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleMFAVerify = async () => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      challengeId,
      code: MFACode,
    });
    if (error) {
      setError("mfa failed: " + error.message);
      return;
    }

    setShowMfaPrompt(false);
    setMFACode("");
    navigate("/dashboard");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    const result = await signInUser(email, password);

    if (!result.success) {
      setError(result.error);
      return;
    }

    const { data: aalData, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) {
      console.log(aalError);
    } else {
      console.log("aal level:", aalData);
    }

    // prompts MFA if user has enabled it from their dashboard, otherwise logs in direct
    if (aalData.nextLevel == "aal2") {
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      if (factorsError) {
        setError("no valid MFA factor found");
        return;
      }

      const totpFactors = factorsData?.totp || [];
      if (totpFactors.length === 0) {
        setError("no valid totp MFA factor found");
        return;
      }
      const selectedFactor = totpFactors[0];

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: selectedFactor.id });

      if (challengeError) {
        console.error("mfachallenge error:", challengeError);
        setError("failed to start mfa challenge");
        return;
      }

      setFactorId(selectedFactor.id);
      setChallengeId(challengeData.id);
      setShowMfaPrompt(true);
      return;
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div>
      <h1 className=" text-center text-3xl pt-40 fancy-font">LetsMeet</h1>
      {!showMfaPrompt && (
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
        </form>
      )}
      {showMfaPrompt && (
        <div className="max-w-md m-auto pt-20">
          <p className="font-bold pb-2 text-center">
            Please enter your MFA code!
          </p>
          <div className="text-center">
            <input
              type="text"
              placeholder="6 digit code"
              value={MFACode}
              onChange={(e) => setMFACode(e.target.value)}
            />
            <button onClick={handleMFAVerify}>Verify Code</button>
          </div>
        </div>
      )}
      {error && <p className="text-red-600 text-center pt-4">{error}</p>}
    </div>
  );
};

export default Signin;
