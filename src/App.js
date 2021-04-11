import "./App.scss";
import { Play, Pause, Dice } from "react-ionicons";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import spotifyApi from "spotify-web-api-js";
import { SpotifyAuth, Scopes } from "react-spotify-auth";
// import "react-spotify-auth/dist/index.css";
import { getAverageColor } from "fast-average-color-node";
import { BgTint, BgImage, CoverImage, LoginWrapper } from "./App.styled";
import { AnimatePresence } from "framer-motion";
import request from "request";

const {
  REACT_APP_CLIENT_ID,
  REACT_APP_REDIRECT_URI,
  REACT_APP_SPOTIFY_LIST,
  REACT_APP_CLIENT_SECRET,
} = process.env;

const App = () => {
  const [token, setToken] = useState(null);
  const [hasScopes, setHasScopes] = useState(false);
  const [device, setDevice] = useState();
  const [position, setPosition] = useState(0);
  const [isPlaying, setPlaying] = useState();
  const [totalAlbums, setTotalAlbums] = useState("");

  const [currentAlbum, setCurrentAlbum] = useState();
  const [currentAlbumChartPosition, setCurrentAlbumChartPosition] = useState();
  const [currentAlbumCover, setCurrentAlbumCover] = useState();
  const [bgImage, setBgImage] = useState();
  const [bgColor, setBgColor] = useState();

  const [nextAlbum, setNextAlbum] = useState();
  const [nextAlbumChartPosition, setNextAlbumChartPosition] = useState();
  const [nextAlbumCover, setNextAlbumCover] = useState();
  const [nextAlbumBgImage, setNextAlbumBg] = useState();
  const [nextBgColor, setNextBgColor] = useState();

  const s = new spotifyApi();

  useEffect(() => {
    if (!Cookies.get("spotifyAuthToken")) {
      var client_id = REACT_APP_CLIENT_ID;
      var client_secret = REACT_APP_CLIENT_SECRET;

      var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
          Authorization:
            "Basic " +
            new Buffer(client_id + ":" + client_secret).toString("base64"),
        },
        form: {
          grant_type: "client_credentials",
        },
        json: true,
      };

      request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          setToken(body.access_token);
          s.setAccessToken(body.access_token);
          setHasScopes(false);
        }
      });
    } else {
      setHasScopes(true);
      setToken(Cookies.get("spotifyAuthToken"));
      s.setAccessToken(Cookies.get("spotifyAuthToken"));
      window.history.pushState("", document.title, "/");
    }
  }, []);

  const getBgColor = (src, callback, outputFormat) => {
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
  };

  const persistentTrackOffset = (offset) => {
    !hasScopes
      ? Cookies.set("persistentTrackOffset", offset)
      : Cookies.remove("persistentTrackOffset");
  };

  // get devices and first album
  useEffect(() => {
    if (token) {
      s.getPlaylist(REACT_APP_SPOTIFY_LIST, function (err, data) {
        if (err) console.error(err);
        else {
          setTotalAlbums(data.tracks.total);
          let offset = Math.floor(Math.random() * data.tracks.total);
          let nextOffset = Math.floor(Math.random() * data.tracks.total);
          setCurrentAlbumChartPosition(
            parseInt(Cookies.get("persistentTrackOffset")) || offset
          );
          setNextAlbumChartPosition(nextOffset);

          s.getPlaylistTracks(
            REACT_APP_SPOTIFY_LIST,
            {
              limit: 1,
              offset: Cookies.get("persistentTrackOffset") || offset,
            },
            function (err, data) {
              if (err) console.error(err);
              else {
                setCurrentAlbum(data.items[0].track);
                setCurrentAlbumCover(data.items[0].track.album.images[0].url);

                persistentTrackOffset(data.offset);
                setPlaying(false);
                getBgColor(
                  data.items[0].track.album.images[0].url,
                  function (dataUrl) {
                    getAverageColor(dataUrl).then((color) => {
                      setBgColor(
                        `rgba(${color.value[0]},${color.value[1]},${color.value[2]},0.6)`
                      );
                    });
                  }
                );

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

                      getBgColor(
                        data.items[0].track.album.images[0].url,
                        function (dataUrl) {
                          getAverageColor(dataUrl).then((color) => {
                            setNextBgColor(
                              `rgba(${color.value[0]},${color.value[1]},${color.value[2]},0.6)`
                            );
                          });
                        }
                      );

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

      // setToken(Cookies.get("spotifyAuthToken"));
      // setHasScopes(true);
    }
  }, [token]);

  const startAlbum = (position, device, currentAlbum) => {
    if (!device) {
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

              const PlayParameterObject = {
                context_uri: currentAlbum?.album.external_urls.spotify,
                position_ms: position,
                device_id: activeDevice.id,
              };

              s.play(PlayParameterObject, function (err, data) {
                if (err) console.error(err);
                else {
                  setPlaying(true);
                }
              });
            } else {
              setDevice(inactiveDevice.id);
              s.transferMyPlayback([inactiveDevice.id]);

              const PlayParameterObject = {
                context_uri: currentAlbum?.album.external_urls.spotify,
                position_ms: position,
                device_id: inactiveDevice.id,
              };

              s.play(PlayParameterObject, function (err, data) {
                if (err) console.error(err);
                else {
                  setPlaying(true);
                }
              });
            }
          } else {
            window.open(currentAlbum?.album.external_urls.spotify, "name");

            // setDevice(inactiveDevice.id);
            // s.transferMyPlayback([inactiveDevice.id]);
          }
        }
      });
    } else {
      const PlayParameterObject = {
        context_uri: currentAlbum?.album.external_urls.spotify,
        position_ms: position,
        device_id: device,
      };
      s.play(PlayParameterObject, function (err, data) {
        if (err) console.error(err);
        else {
          setPlaying(true);
        }
      });
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
    setBgColor(nextBgColor);
    setBgImage(nextAlbumBgImage);
    setPlaying(false);
    setPosition(0);

    persistentTrackOffset(nextAlbumChartPosition);

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

          getBgColor(
            data.items[0].track.album.images[0].url,
            function (dataUrl) {
              getAverageColor(dataUrl).then((color) => {
                setNextBgColor(
                  `rgba(${color.value[0]},${color.value[1]},${color.value[2]},0.6)`
                );
              });
            }
          );

          s.getArtist(data.items[0].track.artists[0].id, function (err, data) {
            if (err) console.error(err);
            else {
              data.images[0]?.url && setNextAlbumBg(data.images[0].url);
            }
          });
        }
      }
    );
  };

  // Animation options
  const variantsCover = {
    enter: () => {
      return {
        y: -1000,
        opacity: 1,
      };
    },
    center: {
      y: 0,
      opacity: 1,
    },
    exit: () => {
      return {
        y: 1000,
        opacity: 0,
      };
    },
  };

  const variantsBgTint = bgColor && {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  return (
    <div className="app">
      <>
        <AnimatePresence initial={false}>
          <BgImage
            BgImage={bgImage}
            key={`${currentAlbumChartPosition}${bgColor}`}
            variants={variantsBgTint}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              opacity: { duration: 0.3 },
            }}
          />
        </AnimatePresence>
        <AnimatePresence initial={false}>
          <BgTint
            key={`${currentAlbumChartPosition}${bgColor}`}
            variants={variantsBgTint}
            initial="enter"
            animate="center"
            exit="exit"
            bgColor={bgColor}
            transition={{
              opacity: { duration: 0.6 },
            }}
          />
        </AnimatePresence>

        <div className="controls">
          {hasScopes ? (
            <>
              {isPlaying ? (
                <div className="button" onClick={() => pauseAlbum()}>
                  <Pause
                    color={"#ffffffde"}
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
                    color={"#ffffffde"}
                    title={"Starta"}
                    height="50px"
                    width="50px"
                  />
                </div>
              )}
            </>
          ) : (
            <LoginWrapper>
              <SpotifyAuth
                redirectUri={REACT_APP_REDIRECT_URI}
                clientID={REACT_APP_CLIENT_ID}
                title={""}
                logoClassName={"login"}
                btnClassName={"btnlogin"}
                scopes={[
                  Scopes.playlistReadPrivate,
                  Scopes.userModifyPlaybackState,
                  Scopes.userReadCurrentlyPlaying,
                  Scopes.userReadPlaybackState,
                ]}
                onClick={() => setHasScopes(true)}
              />
            </LoginWrapper>
          )}
          <CoverImage
            src={currentAlbumCover}
            key={currentAlbumChartPosition}
            variants={variantsCover}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 300, damping: 25 },
              delay: 3.5,
            }}
          />

          <div className="button" onClick={() => shuffleAlbum(totalAlbums)}>
            <Dice
              color={"#ffffffde"}
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
              `Nummer ${
                parseInt(Cookies.get("persistentTrackOffset")) + 1 ||
                currentAlbumChartPosition + 1
              }`}
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
    </div>
  );
};

export default App;
