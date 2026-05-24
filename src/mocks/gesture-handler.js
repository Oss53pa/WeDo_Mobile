import { View } from 'react-native';

export const GestureHandlerRootView = View;
export const ScrollView = View;
export const FlatList = View;
export const State = {};
export const PanGestureHandler = View;
export const TapGestureHandler = View;
export const LongPressGestureHandler = View;
export const PinchGestureHandler = View;
export const RotationGestureHandler = View;
export const FlingGestureHandler = View;
export const NativeViewGestureHandler = View;
export const gestureHandlerRootHOC = (Component) => Component;
export const Directions = {};
export const Gesture = {
  Pan: () => ({}),
  Tap: () => ({}),
  LongPress: () => ({}),
  Pinch: () => ({}),
  Rotation: () => ({}),
  Fling: () => ({}),
  Native: () => ({}),
  Simultaneous: () => ({}),
  Exclusive: () => ({}),
  Race: () => ({}),
};
export const GestureDetector = View;

export default {
  GestureHandlerRootView,
  ScrollView,
  State,
  PanGestureHandler,
  TapGestureHandler,
  gestureHandlerRootHOC,
};
