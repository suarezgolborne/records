import _defineProperty from "@babel/runtime/helpers/defineProperty";
import React from "react";
import PropTypes from "prop-types";
import ApiRequest from "../node_modules/react-spotify-api/dist/ApiRequest/ApiRequest.js";

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key)
        );
      });
    }
  }
  return target;
}

export function Pause(props) {
  let url = "https://api.spotify.com/v1/me/player/pause".concat(props.id);

  let options = _objectSpread({}, props.options);

  return React.createElement(
    ApiRequest,
    {
      url: url,
      options: options,
    },
    props.children
  );
}

function Play(props) {
  let url = "https://api.spotify.com/v1/me/player/play".concat(props.id);

  let options = _objectSpread({}, props.options);

  return React.createElement(
    ApiRequest,
    {
      url: url,
      options: options,
    },
    props.children
  );
}

Play.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
  options: PropTypes.shape({
    fields: PropTypes.string,
    market: PropTypes.string,
  }),
};
Play.defaultProps = {
  options: {},
};
export default Play;
