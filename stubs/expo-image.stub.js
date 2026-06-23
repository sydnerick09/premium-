// Stub for expo-image on web — delegates to react-native Image
const React = require('react');
const { Image: RNImage } = require('react-native');

function Image({ contentFit, transition, source, style, ...rest }) {
  const resizeMode = contentFit === 'cover' ? 'cover'
    : contentFit === 'contain' ? 'contain'
    : contentFit === 'fill' ? 'stretch'
    : contentFit === 'none' ? 'center'
    : 'contain';
  return React.createElement(RNImage, { source, style, resizeMode, ...rest });
}

module.exports = { Image };
module.exports.default = { Image };
