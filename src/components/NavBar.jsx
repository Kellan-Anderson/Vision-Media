import React, { useContext, useEffect, useState } from "react";
import FirebaseContext from "../context/firebase";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

export default function NavBar() {
  // Get a reference to the firebase app
  const getFirebaseApp = useContext(FirebaseContext);
  const app = getFirebaseApp();

  // Get a reference to the user auth and reset it if it changes
  const auth = getAuth(app);
  const [authUser, loading, error] = useAuthState(auth);
  const [user, setUser] = useState(authUser);
  useEffect(() => {
    setUser(authUser);
  }, [authUser, loading]);

  // Get a reference to the navigate function from react router
  const navigate = useNavigate();

  return (
    <>
      {/* Display the navbar only if a user has signed in */}
      {user && 
        <nav 
          className="w-full h-12 flex justify-between items-center py-8 md:py-1 absolute top-0 
                   bg-stone-800"
        >
          <h2 className="ml-6 text-lg font-semibold">Hello, {user.displayName.split(" ")[0]}</h2>
          <div className="flex flex-row">
            <button onClick={() => navigate("/")} className="btn-primary w-fit bg-stone-900">
              Home
            </button>
            <button onClick={() => auth.signOut()} className="btn-primary w-fit mr-4 bg-stone-900">
              Sign Out
            </button>
          </div>
        </nav>
      }
    </>
  );
}
