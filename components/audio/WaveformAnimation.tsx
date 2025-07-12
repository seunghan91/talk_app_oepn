// components/audio/WaveformAnimation.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface WaveformAnimationProps {
  isActive: boolean;
  barCount?: number;
  barWidth?: number;
  barSpacing?: number;
  minHeight?: number;
  maxHeight?: number;
  animationDuration?: number;
  color?: string;
  style?: ViewStyle;
}

export const WaveformAnimation: React.FC<WaveformAnimationProps> = ({
  isActive,
  barCount = 30,
  barWidth = 3,
  barSpacing = 2,
  minHeight = 4,
  maxHeight = 40,
  animationDuration = 200,
  color = '#007AFF',
  style,
}) => {
  const animatedValues = useRef<Animated.Value[]>(
    Array(barCount).fill(0).map(() => new Animated.Value(0))
  );

  useEffect(() => {
    if (isActive) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [isActive]);

  const startAnimation = () => {
    const animations = animatedValues.current.map((value, index) => {
      // 각 바에 약간의 지연을 주어 물결 효과 생성
      const delay = index * 20;

      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: Math.random(),
            duration: animationDuration,
            delay,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: animationDuration,
            useNativeDriver: false,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();
  };

  const stopAnimation = () => {
    animatedValues.current.forEach(value => {
      value.stopAnimation();
      Animated.timing(value, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  return (
    <View style={[styles.container, style]}>
      {animatedValues.current.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: barWidth,
              marginHorizontal: barSpacing / 2,
              backgroundColor: color,
              height: value.interpolate({
                inputRange: [0, 1],
                outputRange: [minHeight, maxHeight],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  bar: {
    borderRadius: 2,
  },
}); 