import "./App.css";

import React from "react";
import { SpotifyApiContext, Playlist, PlaylistTracks } from "react-spotify-api";
import Cookies from "js-cookie";

import { SpotifyAuth, Scopes } from "react-spotify-auth";
import "react-spotify-auth/dist/index.css";

function App() {
  const token = Cookies.get("spotifyAuthToken");

  const redirect_uri = "http://localhost:3000";

  return (
    <div className="app">
      {token ? (
        <SpotifyApiContext.Provider value={token}>
          <Playlist id={"5Y1aNHCMgst2Yf7Kog6bOk"}>
            {({ data, loading, error }) =>
              data ? (
                <div>
                  <h1>Listen to this</h1>
                  <PlaylistTracks
                    id={"5Y1aNHCMgst2Yf7Kog6bOk"}
                    options={{
                      limit: 1,
                      offset: Math.floor(Math.random() * data.tracks.total),
                    }}
                  >
                    {({ data, loading, error }) =>
                      data ? (
                        <div>
                          <a
                            href={
                              data.items[0].track.album.external_urls.spotify
                            }
                          >
                            <img
                              src={data.items[0].track.album.images[0].url}
                              width={data.items[0].track.album.images[0].width}
                            />
                            <h1>
                              {`${data.items[0].track.artists[0].name} - ${
                                data.items[0].track.album.name
                              } (${new Date(
                                data.items[0].track.album.release_date
                              ).getFullYear()})`}
                            </h1>
                          </a>
                        </div>
                      ) : null
                    }
                  </PlaylistTracks>
                </div>
              ) : null
            }
          </Playlist>
        </SpotifyApiContext.Provider>
      ) : (
        // Display the login page
        <SpotifyAuth
          redirectUri={redirect_uri}
          clientID="8fcc5bf3662a4b01a488c24d4ddab908"
          scopes={[Scopes.playlistReadPrivate, Scopes.userModifyPlaybackState]} // either style will work
        />
      )}
    </div>
  );
}

export default App;
