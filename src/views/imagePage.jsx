import React from "react";
import { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc } from "firebase/firestore";
import FirebaseContext from "../context/firebase";
import { useDocument } from "react-firebase-hooks/firestore";
import Loading from "../components/Loading";
import { useAuthState } from "react-firebase-hooks/auth";
import SignIn from "../components/signin";
import ImageAnnotations from "../components/ImageAnnotations";

/**
 * Image page: a full page for one image.
 * Handles /images/:id,
 * Gets the firebase document, calls ImageAnnotations, and has metadata below for web detection.
 */
export default function ImagePage() {
  // Get the firebase app reference
  const getFirebaseApp = useContext(FirebaseContext);
  const app = getFirebaseApp();
  const auth = getAuth(app);
  const { id } = useParams();

  // Get the auth instance and reset it if it changes
  const [authUser, authLoading, authError] = useAuthState(auth);
  const [user, setUser] = useState(authUser);
  const [userId, setUserId] = useState('dummy-do-not-delete');
  useEffect(() => {
    setUser(authUser);
    setUserId(authUser !== null ? authUser.uid : userId);
  }, [authLoading, authUser]);

  // Get the firestore instance and reset its value if it changes
  const [val, loading, error] = useDocument(doc(getFirestore(app), userId, id));
  const [image, setImage] = useState(val);
  useEffect(() => {
    setImage(val)
  }, [val]);

  const maxScore = val ? Math.max(...val.data().webDetection.webEntities.map(entity => entity.score)) : 0;

  // Get the url from the firebase data
  let path, filename;
  let labels = [];
  let url = '';
  if (image) {
    // Get the data
    const data = image.data();
    // Get the guesses
    labels = data.labelAnnotations;
    // Get the filename and use it to get the image url
    [path, filename] = data.uri.split("/");
    // must be on a single line to avoid a newline
    url = `https://firebasestorage.googleapis.com/v0/b/vision-media-b5556.appspot.com/o/${path}%2F${filename}?alt=media`;
  }
  return (
    <>
      {user ?
        <div className="flex flex-col justify-center items-center w-full">
          {loading ? <Loading /> :
            <>
              {/* Show the iamge annotations */}
              <ImageAnnotations url={url} doc={val}></ImageAnnotations>
              <h1 className="mt-7 mb-10">{filename}</h1>
              {val.data().webDetection.bestGuessLabels && <p>🤔 I think this is a "{val.data().webDetection.bestGuessLabels[0].label}"</p>}
              <section className="px-20 mb-6 w-full">
                <div
                  id="image-description"
                  className="mt-1 grid md:grid-cols-2 justify-center rounded-xl"
                >
                  {/* Map over the labels in the code and show the guess */}
                  <div>
                    <h2 className="text-center">Labels</h2>
                    {labels.map((label) => {
                      // Get the width for the guess
                      const width = (label.score * 100).toFixed(3);
                      return (
                        <div className="h-12 my-2 mx-3 bg-gray-700 rounded-lg first:mt-4 last:mb-4">
                          <div
                            className="flex items-center justify-between h-full px-2 bg-blue-700 
                        rounded-xl"
                            style={{ width: `${width}%` }}
                          >
                            <h2>{label.description}</h2>
                            <h2>{width}%</h2>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div>
                    <h2 className="text-center">Web Detection Entities (non-normalized scores)</h2>

                    {val.data().webDetection.webEntities.filter(entity => entity.description != "").map((entity) => {
                      const width = ((entity.score / maxScore) * 100).toFixed(2);
                      return (
                        <div className="h-12 my-2 mx-3 bg-gray-700 rounded-lg first:mt-4 last:mb-4">
                          <div
                            className="flex items-center justify-between h-full px-2 bg-red-700 
                        rounded-xl"
                            style={{ width: `${width}%` }}
                          >
                            <h2>{entity.description}</h2>
                            <h2>{entity.score.toFixed(2)}</h2>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                </div>
              </section>
              {/** 
               * This section contains code for visually similar images, partially matching images, and pages with matching images.
               * A lot of this code is repeated. Basically, it's a map over all three.
               * Partially matching and matching are the same code. Pages with matching images has a URL attached to it.
               */}
                <div>
                {
                  val.data().webDetection.visuallySimilarImages.length != 0 &&
                  <>
                <h1>Visually similar images:</h1>
                <grid className="grid md:grid-cols-4 sm:grid-cols-2">
                  {val.data().webDetection.visuallySimilarImages.map(image => <img key={image.url} className="w-60 h-60 object-scale-down" src={image.url}></img>)}
                </grid>
                </>
                }
                {
                  val.data().webDetection.partialMatchingImages.length != 0 && 
                  <>
                <h1>Partially matching images:</h1>
                <grid className="grid md:grid-cols-4 sm:grid-cols-2">
                  {val.data().webDetection.partialMatchingImages.map(image => <img key={image.url} className="w-60 h-60 object-scale-down" src={image.url}></img>)}
                </grid>
                  </>
                }
                {
                  val.data().webDetection.pagesWithMatchingImages.length != 0 &&
                  <>
                  <h1>Pages with matching images:</h1>
                  <grid className="grid md:grid-cols-2">
                    {val.data().webDetection.pagesWithMatchingImages.map(image =>
                    {
                      const imageUrl = image.partialMatchingImages.length != 0 ? image?.partialMatchingImages?.[0]?.url : image?.fullMatchingImages?.[0]?.url
                      return <>
                      <div className="bg-neutral-800 m-10">
                        <a href={image.url}>
                        {/** replace <b> and </b> with an empty string, it comes up in the page title a lot. */}
                          <p>{image.pageTitle.replace(/<\/?b>/g, "")}</p>
                          <img key={image.url} className="w-60 h-60 object-scale-down" src={imageUrl}></img>
                        </a>
                      </div>
                        </>
                      })}
                  </grid>
                  </>                  
                }
                </div>
            </>
          }
        </div>
        :
        <div className="flex flex-col justify-center items-center">
          <h1 className="mb-8">Please sign in to view this page</h1>
          <SignIn />
        </div>
      }
    </>
  );
}
