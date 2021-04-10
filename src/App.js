import "./App.scss";
import { Play, Pause, Dice } from "react-ionicons";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import spotifyApi from "spotify-web-api-js";
import { SpotifyAuth, Scopes } from "react-spotify-auth";
import "react-spotify-auth/dist/index.css";
import { getAverageColor } from "fast-average-color-node";
import { BgTint, BgImage, CoverImage } from "./App.styled";
import { AnimatePresence } from "framer-motion";

const {
  REACT_APP_CLIENT_ID,
  REACT_APP_REDIRECT_URI,
  REACT_APP_SPOTIFY_LIST,
} = process.env;

const App = () => {
  const [token, setToken] = useState();
  const [device, setDevice] = useState();
  const [position, setPosition] = useState(0);
  const [isPlaying, setPlaying] = useState();

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
  const [previousBgColor, setPreviousBgColor] = useState();

  const [totalAlbums, setTotalAlbums] = useState("");

  const s = new spotifyApi();
  s.setAccessToken(token);

  // set token
  useEffect(() => {
    setToken(Cookies.get("spotifyAuthToken"));
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
          let offset = Math.floor(Math.random() * data.tracks.total);
          let nextOffset = Math.floor(Math.random() * data.tracks.total);
          setCurrentAlbumChartPosition(offset);
          // setNextAlbumChartPosition(nextOffset);

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
                            setPreviousBgColor(bgColor);
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
    }
  }, [token]);

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
    setBgColor(nextBgColor);
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
          getBgColor(
            data.items[0].track.album.images[0].url,
            function (dataUrl) {
              getAverageColor(dataUrl).then((color) => {
                setNextBgColor(
                  `rgba(${color.value[0]},${color.value[1]},${color.value[2]},0.6)`
                );
                setPreviousBgColor(bgColor);
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

  // const variantsBgTint = bgColor &&
  //   nextBgColor && {
  //     enter: () => {
  //       return {
  //         backgroundColor: `rgba(${nextBgColor[0]},${nextBgColor[1]},${nextBgColor[2]},0.6)`,
  //       };
  //     },
  //     center: {
  //       backgroundColor: `rgba(${bgColor[0]},${bgColor[1]},${bgColor[2]},0.6)`,
  //     },
  //     exit: () => {
  //       return {
  //         backgroundColor: `rgba(${bgColor[0]},${bgColor[1]},${bgColor[2]},0.6)`,
  //       };
  //     },
  //   };

  // initial="enter"
  // exit="exit"
  // bgColor={bgColor}

  console.log(bgColor);

  return (
    <div className="app">
      {token ? (
        <>
          {/* <motion.div
          layoutId="outline"
          className="outline"
          initial={false}
          animate={{ backgroundColor: bgColor }}
          transition={{
            backgroundColor: { duration: 2.4 },
          }}
        /> */}

          {/* <BgTint
            key={`${currentAlbumChartPosition}${bgColor}`}
            initial={false}
            variants={variantsBgTint}
            animate="animate"
            enter="enter"
            exit="exit"
            transition={{
              backgroundColor: { duration: 2.4 },
            }}
          /> */}
          <AnimatePresence initial={false}>
            <BgImage
              BgImage={bgImage}
              key={`${currentAlbumChartPosition}${bgColor}`}
              variants={variantsBgTint}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.6 },
              }}
            />
            <BgTint bgColor={bgColor} />
          </AnimatePresence>

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
              variants={variantsCover}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                y: { type: "spring", stiffness: 250, damping: 25 },
                opacity: { duration: 0.9 },
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
