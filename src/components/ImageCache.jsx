import { Image } from 'react-native';

const imageCache = new Map();

export const preloadImage = (url) => {
  return new Promise((resolve) => {
    if (imageCache.has(url)) {
      resolve(imageCache.get(url));
      return;
    }

    Image.prefetch(url)
      .then(() => {
        imageCache.set(url, true);
        resolve(true);
      })
      .catch(() => {
        imageCache.set(url, false);
        resolve(false);
      });
  });
};
