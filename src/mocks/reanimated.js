/**
 * Web mock for react-native-reanimated.
 * Animations are no-ops on web (the native app uses the real library); this
 * shim just needs to provide the same API surface so the bundle runs.
 */
import React from 'react';
import {View, Text, Image, ScrollView as RNScrollView, FlatList} from 'react-native';

export const useSharedValue = initialValue => ({value: initialValue});
export const useAnimatedStyle = styleFunc => styleFunc();
export const useAnimatedProps = propsFunc => propsFunc();
export const useDerivedValue = derivedFunc => ({value: derivedFunc()});
export const useAnimatedGestureHandler = handlers => handlers;
export const useAnimatedScrollHandler = handlers => handlers;
export const useAnimatedRef = () => ({current: null});
export const useAnimatedReaction = () => {};
export const useFrameCallback = () => ({setActive: () => {}});
export const useScrollViewOffset = () => ({value: 0});
export const withTiming = toValue => toValue;
export const withSpring = toValue => toValue;
export const withDecay = config => config?.velocity || 0;
export const withDelay = (delay, animation) => animation;
export const withSequence = (...animations) => animations[animations.length - 1];
export const withRepeat = animation => animation;
export const cancelAnimation = () => {};
export const runOnJS = fn => fn;
export const runOnUI = fn => fn;
export const interpolate = (value, inputRange, outputRange) =>
  Array.isArray(outputRange) ? outputRange[0] : 0;
export const Extrapolate = {CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity'};
export const Extrapolation = Extrapolate;
export const interpolateColor = () => '#000000';

export const Easing = {
  linear: t => t,
  ease: t => t,
  quad: t => t,
  cubic: t => t,
  poly: () => t => t,
  sin: t => t,
  circle: t => t,
  exp: t => t,
  elastic: () => t => t,
  back: () => t => t,
  bounce: t => t,
  bezier: () => t => t,
  in: easing => easing,
  out: easing => easing,
  inOut: easing => easing,
};

// Chainable no-op builder so `FadeInDown.delay(80).duration(420).springify()`
// works exactly like the real layout-animation builders.
const makeChain = () =>
  new Proxy(function () {}, {
    get: () => () => makeChain(),
    apply: () => makeChain(),
  });

export const FadeIn = makeChain();
export const FadeOut = makeChain();
export const FadeInDown = makeChain();
export const FadeInUp = makeChain();
export const FadeInLeft = makeChain();
export const FadeInRight = makeChain();
export const FadeOutDown = makeChain();
export const FadeOutUp = makeChain();
export const SlideInRight = makeChain();
export const SlideOutRight = makeChain();
export const SlideInLeft = makeChain();
export const SlideOutLeft = makeChain();
export const SlideInDown = makeChain();
export const SlideInUp = makeChain();
export const ZoomIn = makeChain();
export const ZoomOut = makeChain();
export const Layout = makeChain();
export const LinearTransition = makeChain();
export const Keyframe = function () {
  return makeChain();
};

// Strip animation-only props so they never reach the DOM.
const strip = Comp =>
  React.forwardRef(({entering, exiting, layout, animatedProps, ...rest}, ref) =>
    React.createElement(Comp, {ref, ...rest, ...(animatedProps || {})}),
  );

export const createAnimatedComponent = Component => strip(Component);

const Animated = {
  View: strip(View),
  Text: strip(Text),
  Image: strip(Image),
  ScrollView: strip(RNScrollView),
  FlatList: strip(FlatList),
  createAnimatedComponent,
};

export default Animated;
