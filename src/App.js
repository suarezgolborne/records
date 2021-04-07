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
  const [device, setDevice] = useState(false);
  const [bgImage, setBgImage] = useState(null);

  const token = Cookies.get("spotifyAuthToken");

  const redirect_uri = "https://records-4fbw6u5lj-suarezgolborne.vercel.app/";
  var s = new spotifyApi();
  s.setAccessToken(token);

  const getArtistImage = (data) => {
    s.getArtist(data.items[0].track.artists[0].id, function (err, data) {
      if (err) console.error(err);
      else {
        setBgImage(data.images[0].url);
        console.log(data.images[0].url);
      }
    });
  };
  useEffect(() => {
    s.getPlaylist("5Y1aNHCMgst2Yf7Kog6bOk", function (err, data) {
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
              getArtistImage(data);
            }
          }
        );
      }
    });
  }, []);

  s.getMyDevices(function (err, data) {
    if (err) console.error(err);
    else {
      let activeDevice = data.devices.find((device) => device.is_active);
      let inactiveDevice = data.devices.find((device) => !device.is_active);

      // sort by type and by active status
      if (data.devices.length > 0) {
        if (activeDevice?.is_active) {
          setDevice(activeDevice.id);
        } else {
          setDevice(inactiveDevice.id);
          s.transferMyPlayback(inactiveDevice);
        }
      }
    }
  });

  const startAlbum = (uri, token) => {
    console.log(uri, token, device, "tok");

    const PlayParameterObject = {
      context_uri: uri,
      position_ms: position,
      device_id: device,
    };

    console.log(position);

    if (device) {
      s.play(PlayParameterObject, function (err, data) {
        if (err) console.error(err);
        else {
          setPlaying(true);
          console.log("State", data, data.progress_ms);
        }
      });
    } else {
      window.open(currentAlbum?.album.external_urls.spotify, "name");
    }

    return;
  };

  const pauseAlbum = () => {
    s.getMyCurrentPlaybackState(function (err, data) {
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

  const shuffleAlbum = () => {
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
          getArtistImage(data);
          setPlaying(false);
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
              <button
                onClick={() =>
                  pauseAlbum(currentAlbum?.album.external_urls.spotify, token)
                }
              >
                <Pause
                  color={"#ffffff"}
                  title={"Pausa"}
                  height="50px"
                  width="50px"
                />
              </button>
            ) : (
              <button
                onClick={() =>
                  startAlbum(currentAlbum?.album.external_urls.spotify, token)
                }
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
            <button
              onClick={() =>
                shuffleAlbum(currentAlbum?.album.external_urls.spotify, token)
              }
            >
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
          <SpotifyAuth
            redirectUri={REACT_APP_REDIRECT_URI}
            clientID={REACT_APP_CLIENT_ID}
            scopes={[
              Scopes.playlistReadPrivate,
              Scopes.userModifyPlaybackState,
              Scopes.userReadCurrentlyPlaying,
              Scopes.userReadPlaybackState,
            ]} // either style will work
          />
        </>
      )}

      {!currentAlbum && (
        <div className="header">
          <h1>{`Sebastian Suarez-Golbornes ${totalAlbums} bästa skivor`}</h1>
        </div>
      )}
      <svg width="0" height="0">
        <defs>
          <clipPath id="myCurve" clipPathUnits="objectBoundingBox">
            <path
              d="M 0,1
									L 0,0
									L 1,0
									L 1,1
									C .65 .8, .35 .8, 0 1
									Z"
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

export default App;
