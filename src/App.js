import "./App.scss";
import { Play, Pause, Dice } from "react-ionicons";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import spotifyApi from "spotify-web-api-js";
import { SpotifyAuth, Scopes } from "react-spotify-auth";
import "react-spotify-auth/dist/index.css";
import "@fontsource/merriweather-sans/300.css";
import "@fontsource/merriweather/300.css";

const { REACT_APP_CLIENT_ID, REACT_APP_REDIRECT_URI } = process.env;

const App = () => {
  const [position, setPosition] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [totalAlbums, setTotalAlbums] = useState("");
  const [albumChartPosition, setAlbumChartPosition] = useState(null);
  const [device, setDevice] = useState();
  const [bgImage, setBgImage] = useState(null);
  const [token, setToken] = useState();

  const s = new spotifyApi();
  s.setAccessToken(token);

  useEffect(() => {
    setToken(Cookies.get("spotifyAuthToken"));
  }, []);

  //
  // const getArtistImage = (data) => {
  //   console.log("getimage");
  //   s.getArtist(data.items[0].track.artists[0].id, function (err, data) {
  //     if (err) console.error(err);
  //     else {
  //       setBgImage(data.images[0].url);
  //       console.log("gett image", data.images[0].url);
  //     }
  //   });
  // };

  // const getArtistImage = useCallback(() => {
  //   if (currentAlbum) {
  //     console.log("getimage");
  //     s.getArtist(currentAlbum.artists[0].id, function (err, data) {
  //       if (err) console.error(err);
  //       else {
  //         setBgImage(data.images[0].url);
  //         console.log("gett image", data.images[0].url);
  //       }
  //     });
  //   }
  // }, [currentAlbum]);

  useEffect(() => {
    console.log("useeffect", typeof token, token);

    console.log("useeffect if", typeof token, token);
    s.getMyDevices(function (err, data) {
      if (err) console.error(err);
      else {
        let activeDevice = data.devices.find((device) => device.is_active);
        let inactiveDevice = data.devices.find((device) => !device.is_active);

        // sort by type and by active status?
        if (data.devices.length > 0) {
          if (activeDevice?.is_active) {
            setDevice(activeDevice.id);
            s.transferMyPlayback([activeDevice.id]);
          } else {
            setDevice(inactiveDevice.id);
            s.transferMyPlayback([inactiveDevice.id]);
          }
        }
      }
    });

    s.getPlaylist("5Y1aNHCMgst2Yf7Kog6bOk", function (err, data) {
      console.log("getplaylist");

      if (err) console.error(err);
      else {
        setTotalAlbums(data.tracks.total);
        s.getPlaylistTracks(
          "5Y1aNHCMgst2Yf7Kog6bOk",
          {
            limit: 1,
            offset: Math.floor(Math.random() * data.tracks.total),
          },
          function (err, data) {
            if (err) console.error(err);
            else {
              setCurrentAlbum(data.items[0].track);
              setAlbumChartPosition(data.offset);
              // getArtistImage();
              // s.getArtist(
              //   data.items[0].track.artists[0].id,
              //   function (err, data) {
              //     if (err) console.error(err);
              //     else {
              //       setBgImage(data.images[0].url);
              //       console.log("gett image", data.images[0].url);
              //     }
              //   }
              // );

              console.log("firstsuccess");
            }
          }
        );
      }
    });
  }, [token]);

  useEffect(() => {
    if (currentAlbum) {
      console.log("getimage", albumChartPosition, token);
      s.getArtist(currentAlbum.artists[0].id, function (err, data) {
        if (err) console.error(err);
        else {
          setBgImage(data.images[0].url);
          console.log("gett image", data.images[0].url);
        }
      });
    }
  }, [albumChartPosition]);

  // useEffect(() => {
  //   s.getPlaylist("5Y1aNHCMgst2Yf7Kog6bOk", function (err, data) {
  //     console.log("getplaylist");

  //     if (err) console.error(err);
  //     else {
  //       setTotalAlbums(data.tracks.total);
  //       s.getPlaylistTracks(
  //         "5Y1aNHCMgst2Yf7Kog6bOk",
  //         {
  //           limit: 1,
  //           offset: Math.floor(Math.random() * data.tracks.total),
  //         },
  //         function (err, data) {
  //           if (err) console.error(err);
  //           else {
  //             setCurrentAlbum(data.items[0].track);
  //             setAlbumChartPosition(data.offset);
  //             getArtistImage(data);
  //           }
  //         }
  //       );
  //     }
  //   });
  // }, [token]);

  const startAlbum = (position, device, currentAlbum) => {
    console.log("startalbum");

    const PlayParameterObject = {
      context_uri: currentAlbum?.album.external_urls.spotify,
      position_ms: position,
      device_id: device,
    };

    if (device) {
      s.play(PlayParameterObject, function (err, data) {
        if (err) console.error(err);
        else {
          setPlaying(true);
          console.log("start album is device", data, data.progress_ms);
        }
      });
    } else {
      window.open(currentAlbum?.album.external_urls.spotify, "name");
    }

    return;
  };

  const pauseAlbum = () => {
    console.log("pause");

    s.getMyCurrentPlaybackState(function (err, data) {
      console.log("get playback state");
      if (err) console.error(err);
      else {
        setPosition(data.progress_ms);
        console.log("State", data, data.progress_ms);
      }
    });

    s.pause(function (err, data) {
      if (err) console.error(err);
      else {
        setPlaying(false);
        console.log("State", data, data.progress_ms);
      }
    });

    return;
  };

  const shuffleAlbum = (totalAlbums) => {
    console.log("shuffle");
    s.getPlaylistTracks(
      "5Y1aNHCMgst2Yf7Kog6bOk",
      {
        limit: 1,
        offset: Math.floor(Math.random() * totalAlbums),
      },
      function (err, data) {
        if (err) console.error(err);
        else {
          setCurrentAlbum(data.items[0].track);
          setAlbumChartPosition(data.offset);
          // getArtistImage(data);
          setPlaying(false);
          setPosition(0);
          console.log(data);
        }
      }
    );
  };

  return (
    <div className="app">
      {token ? (
        <>
          <div
            className="bg"
            style={{ backgroundImage: `url(${bgImage})` }}
          ></div>
          <div className="bgtint"></div>

          <div className="controls">
            {isPlaying ? (
              <button onClick={() => pauseAlbum()}>
                <Pause
                  color={"#ffffff"}
                  title={"Pausa"}
                  height="50px"
                  width="50px"
                />
              </button>
            ) : (
              <button
                onClick={() => startAlbum(position, device, currentAlbum)}
              >
                <Play
                  color={"#ffffff"}
                  title={"Starta"}
                  height="50px"
                  width="50px"
                />
              </button>
            )}
            <div>
              <img
                className="cover"
                src={currentAlbum?.album.images[0].url}
                width={currentAlbum?.album.images[0].width}
                alt=""
              />
            </div>
            <button onClick={() => shuffleAlbum(totalAlbums)}>
              <Dice
                color={"#ffffff"}
                title={"Shuffle album"}
                height="50px"
                width="50px"
              />
            </button>
          </div>

          <div className="headerBlock">
            <span className="heading">{`Världens ${totalAlbums} bästa skivor`}</span>
            <span className="subHeading">
              {albumChartPosition && `Nummer ${albumChartPosition}`}
            </span>
          </div>

          {currentAlbum && (
            <div className="albumTitleBlock">
              <span className="heading">{currentAlbum?.artists[0].name}</span>
              <span className="subHeading">{`${
                currentAlbum?.album.name
              } (${new Date(
                currentAlbum?.album.release_date
              ).getFullYear()})`}</span>
            </div>
          )}
        </>
      ) : (
        // Display the login page
        <>
          {!currentAlbum && (
            <div className="header">
              <h1>{`Sebastian Suarez-Golbornes ${totalAlbums} bästa skivor`}</h1>
            </div>
          )}

          <SpotifyAuth
            redirectUri={REACT_APP_REDIRECT_URI}
            clientID={REACT_APP_CLIENT_ID}
            title={"Fortsätt med Spotify"}
            scopes={[
              Scopes.playlistReadPrivate,
              Scopes.userModifyPlaybackState,
              Scopes.userReadCurrentlyPlaying,
              Scopes.userReadPlaybackState,
            ]} // either style will work
          />
        </>
      )}
    </div>
  );
};

export default App;
