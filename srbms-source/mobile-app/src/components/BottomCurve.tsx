import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface BottomCurveProps {
  height?: number;
  color?: string;
}

export const BottomCurve: React.FC<BottomCurveProps> = ({
  height = 55,
  color = '#4579C7',
}) => {
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <View
        style={[
          styles.curve,
          {
            backgroundColor: color,
            height: height * 2,
            borderTopLeftRadius: width * 0.45,
            borderTopRightRadius: width * 0.45,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  curve: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
