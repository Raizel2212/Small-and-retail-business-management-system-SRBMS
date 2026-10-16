import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 96, showText = true }) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Khung ngôi nhà màu xanh dương đậm */}
        <Path
          d="M 50 18 L 18 45 L 23 49 L 26 46 L 26 80 L 74 80 L 74 68 L 79 72 L 79 46 L 82 49 L 85 45 Z"
          fill="none"
          stroke="#1E56A0"
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Mũi tên tăng trưởng màu cam vượt khỏi mái nhà */}
        <Path
          d="M 30 70 L 46 52 L 58 62 L 80 32"
          fill="none"
          stroke="#F37021"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Đầu mũi tên cam */}
        <Polygon
          points="84,26 83,38 72,32"
          fill="#F37021"
        />

        {/* Chiếc lá xanh non ở góc trên bên phải mũi tên */}
        <Path
          d="M 83 20 C 80 14, 88 12, 91 16 C 94 20, 88 24, 83 20 Z"
          fill="#22C55E"
          stroke="#16A34A"
          strokeWidth="1.2"
        />
      </Svg>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.title}>HỘ KINH DOANH</Text>
          <Text style={styles.subtitle}>NỀN TẢNG KINH DOANH CHO MỌI NHÀ</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E56A0',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },
});
