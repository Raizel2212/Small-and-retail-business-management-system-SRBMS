import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface WelcomeIllustrationProps {
  size?: number;
}

export const WelcomeIllustration: React.FC<WelcomeIllustrationProps> = ({ size = 320 }) => {
  const height = Math.round(size * (303 / 466));

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/welcome_illustration.png')}
        style={{ width: size, height: height }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
