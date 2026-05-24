import { Image } from 'react-native';

const FastImage = Image;

FastImage.resizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center',
};

FastImage.priority = {
  low: 'low',
  normal: 'normal',
  high: 'high',
};

FastImage.cacheControl = {
  immutable: 'immutable',
  web: 'web',
  cacheOnly: 'cacheOnly',
};

FastImage.preload = () => {};
FastImage.clearMemoryCache = async () => {};
FastImage.clearDiskCache = async () => {};

export default FastImage;
