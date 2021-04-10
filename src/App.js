import "./App.scss";
import { Play, Pause, Dice } from "react-ionicons";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import spotifyApi from "spotify-web-api-js";
import { SpotifyAuth, Scopes } from "react-spotify-auth";
import "react-spotify-auth/dist/index.css";
import { getAverageColor } from "fast-average-color-node";
import { BgTint, BgImage, CoverImage } from "./App.styled";

const {
  REACT_APP_CLIENT_ID,
  REACT_APP_REDIRECT_URI,
  REACT_APP_SPOTIFY_LIST,
} = process.env; //TODO add playlist

const App = () => {
  const [token, setToken] = useState();
  const [device, setDevice] = useState();
  const [position, setPosition] = useState(0);
  const [isPlaying, setPlaying] = useState(false);

  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [currentAlbumChartPosition, setCurrentAlbumChartPosition] = useState(
    null
  );
  const [currentAlbumCover, setCurrentAlbumCover] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [bgColor, setBgColor] = useState(null);

  const [nextAlbum, setNextAlbum] = useState(null);
  const [nextAlbumChartPosition, setNextAlbumChartPosition] = useState(null);
  const [nextAlbumCover, setNextAlbumCover] = useState(null);
  const [nextAlbumBgImage, setNextAlbumBg] = useState(null);

  const [totalAlbums, setTotalAlbums] = useState("");

  const s = new spotifyApi();
  s.setAccessToken(token);

  // set token
  useEffect(() => {
    setToken(Cookies.get("spotifyAuthToken"));
  }, []);

  // get devices and first album
  useEffect(() => {
    if (token) {
      s.getMyDevices(function (err, data) {
        if (err) console.error(err);
        else {
          let activeDevice = data.devices.find((device) => device.is_active);
          let inactiveDevice = data.devices.find((device) => !device.is_active);

          // sort by type and by active status?
          if (data.devices.length > 0) {
            if (activeDevice?.is_active) {
              setDevice(activeDevice.id);
              // s.transferMyPlayback([activeDevice.id]);
            } else {
              setDevice(inactiveDevice.id);
              s.transferMyPlayback([inactiveDevice.id]);
            }
          }
        }
      });

      s.getPlaylist(REACT_APP_SPOTIFY_LIST, function (err, data) {
        if (err) console.error(err);
        else {
          setTotalAlbums(data.tracks.total);
          const offset = Math.floor(Math.random() * data.tracks.total);
          const nextOffset = Math.floor(Math.random() * data.tracks.total);
          setCurrentAlbumChartPosition(offset);
          setNextAlbumChartPosition(nextOffset);

          s.getPlaylistTracks(
            REACT_APP_SPOTIFY_LIST,
            {
              limit: 1,
              offset: offset,
            },
            function (err, data) {
              if (err) console.error(err);
              else {
                setCurrentAlbum(data.items[0].track);
                setCurrentAlbumCover(data.items[0].track.album.images[0].url);

                s.getArtist(
                  data.items[0].track.artists[0].id,
                  function (err, data) {
                    if (err) console.error(err);
                    else {
                      data.images && setBgImage(data.images[0].url);
                    }
                  }
                );

                s.getPlaylistTracks(
                  REACT_APP_SPOTIFY_LIST,
                  {
                    limit: 1,
                    offset: nextOffset,
                  },
                  function (err, data) {
                    if (err) console.error(err);
                    else {
                      setNextAlbum(data.items[0].track);

                      const img = new Image();
                      img.src = data.items[0].track.album.images[0].url;
                      setNextAlbumCover(img.src);
                      s.getArtist(
                        data.items[0].track.artists[0].id,
                        function (err, data) {
                          if (err) console.error(err);
                          else {
                            setNextAlbumBg(data.images[0].url);
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }
      });
    }
  }, [token]);

  // average color
  useEffect(() => {
    function toDataURL(src, callback, outputFormat) {
      var img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = function () {
        var canvas = document.createElement("CANVAS");
        var ctx = canvas.getContext("2d");
        var dataURL;
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
      };
      img.src = src;
      if (img.complete || img.complete === undefined) {
        img.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        img.src = src;
      }
    }

    toDataURL(currentAlbum?.album.images[0].url, function (dataUrl) {
      getAverageColor(dataUrl).then((color) => {
        setBgColor(color.value);
      });
    });
  }, [currentAlbum?.album.images]);

  const startAlbum = (position, device, currentAlbum) => {
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
      }
    });

    s.pause(function (err, data) {
      if (err) console.error(err);
      else {
        setPlaying(false);
      }
    });

    return;
  };

  const shuffleAlbum = () => {
    // switch to queued album
    setCurrentAlbum(nextAlbum);
    setCurrentAlbumChartPosition(nextAlbumChartPosition);
    setCurrentAlbumCover(nextAlbumCover);
    setBgImage(nextAlbumBgImage);
    setPlaying(false);
    setPosition(0);

    // queue next album
    const nextOffset = Math.floor(Math.random() * totalAlbums);
    setNextAlbumChartPosition(nextOffset);
    s.getPlaylistTracks(
      REACT_APP_SPOTIFY_LIST,
      {
        limit: 1,
        offset: nextOffset,
      },
      function (err, data) {
        if (err) console.error(err);
        else {
          setNextAlbum(data.items[0].track);
          const img = new Image();
          img.src = data.items[0].track.album.images[0].url;
          setNextAlbumCover(img.src);

          s.getArtist(data.items[0].track.artists[0].id, function (err, data) {
            if (err) console.error(err);
            else {
              data.images && setNextAlbumBg(data.images[0].url);
            }
          });
        }
      }
    );
  };

  // Animation options
  const variants = {
    enter: () => {
      return {
        y: -1000,
        opacity: 0,
        zIndex: 0,
      };
    },
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
    },
    exit: () => {
      return {
        zIndex: 0,
        y: 1000,
        opacity: 0,
      };
    },
  };

  return (
    <div className="app">
      {token ? (
        <>
          <BgImage BgImage={bgImage} />
          <BgTint bgColor={bgColor} />
          <div className="controls">
            {isPlaying ? (
              <div className="button" onClick={() => pauseAlbum()}>
                <Pause
                  color={"#ffffff"}
                  title={"Pausa"}
                  height="50px"
                  width="50px"
                />
              </div>
            ) : (
              <div
                className="button"
                onClick={() => startAlbum(position, device, currentAlbum)}
              >
                <Play
                  color={"#ffffff"}
                  title={"Starta"}
                  height="50px"
                  width="50px"
                />
              </div>
            )}

            <CoverImage
              src={currentAlbumCover}
              key={currentAlbumChartPosition}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                y: { type: "spring", stiffness: 250, damping: 25 },
                opacity: { duration: 0.7 },
              }}
            />

            <div className="button" onClick={() => shuffleAlbum(totalAlbums)}>
              <Dice
                color={"#ffffff"}
                title={"Slumpa ett nytt album"}
                height="50px"
                width="50px"
              />
            </div>
          </div>
          <div className="headerBlock">
            <span className="heading">{`Världens ${totalAlbums} bästa skivor`}</span>
            <span className="subHeading">
              {currentAlbumChartPosition &&
                `Nummer ${currentAlbumChartPosition}`}
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
            title={"Fortsätt med Spotify "}
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
