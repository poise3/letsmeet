import React, { useState } from "react";
import { supabase } from "../supabaseClient";

function MFA() {
  const [qrUrl, setQrUrl] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleEnroll = async () => {
    // this part checks for any unverified factors and then deletes them
    const { data: factorsData, error: listError } =
      await supabase.auth.mfa.listFactors();

    if (listError) {
      setMessage("failed to read factor list: " + listError.message);
      return;
    }

    const existingTOTP = (factorsData?.all || []).find(
      (f) => f.status === "unverified" && f.factor_type === "totp"
    );
    console.log("exist totp", existingTOTP);
    if (existingTOTP) {
      const { error: deleteError } = await supabase.auth.mfa.unenroll({
        factorId: existingTOTP.id,
      });
      if (deleteError) {
        console.error("failed to delete:", deleteError.message);
      }
    }

    // makes new factor, so new QR code etc.
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });

    // if already verified, open modal and give option to unenroll
    if (
      error &&
      error.message ==
        'A factor with the friendly name "" for this user already exists'
    ) {
      setVerified(true);
      setIsModalOpen(true);
      return;
    } else if (error) {
      alert("Error: ", error);
    }

    setIsModalOpen(true);
    setQrUrl(data.totp.qr_code);
    setFactorId(data.id);
    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: data.id });
    if (challengeError) return setMessage("Error: " + challengeError.message);

    setChallengeId(challengeData.id);
    setMessage("Scan the QR using your authenticator app");
  };

  const handleVerify = async () => {
    setMessage("Verifying...");
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });
    if (error) return setMessage("verification failed: " + error.message);

    setMessage("MFA setup complete!");
    setIsModalOpen(false);
    setVerified(true);
    setQrUrl("");
    setCode("");
    setChallengeId("");
    setFactorId("");
  };

  const handleUnenroll = async () => {
    const { data: factorsData, error: listError } =
      await supabase.auth.mfa.listFactors();

    if (listError) {
      setMessage("failed to read factor list: " + listError.message);
      return;
    }

    const existingTOTP = (factorsData?.all || []).find(
      (f) => f.status === "verified" && f.factor_type === "totp"
    );

    if (existingTOTP) {
      const { error: deleteError } = await supabase.auth.mfa.unenroll({
        factorId: existingTOTP.id,
      });
      if (deleteError) {
        console.error("failed to delete:", deleteError.message);
      }
    }

    setVerified(false);
    setIsModalOpen(false);
  };

  return (
    <div>
      <button className="mfa-btn" onClick={handleEnroll}>
        Enable MFA
      </button>
      {isModalOpen && !verified && (
        <div className="modal">
          <div className="modal-content">
            {qrUrl && (
              <div>
                <img src={qrUrl} />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 digit code"
                  maxLength={6}
                />
                <button onClick={handleVerify}>Verify</button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            {message && <p>{message}</p>}
          </div>
        </div>
      )}
      {isModalOpen && verified && (
        <div className="modal">
          <div className="modal-content">
            <div>
              <h2 className="mb-5">You are enrolled in MFA.</h2>
              <button onClick={handleUnenroll}>Unenroll</button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                }}
              >
                Cancel
              </button>
            </div>

            {message && <p>{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default MFA;
