import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Image } from 'react-native';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  variant?: 'header' | 'vertical';
  style?: StyleProp<ViewStyle>;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 40,
  showText = true,
  variant = 'header',
  style,
}) => {
  const iconContent = (
    <View
      style={[
        styles.iconBox,
        {
          width: size,
          height: size,
          borderRadius: Math.max(8, Math.round(size * 0.22)),
        },
      ]}
    >
      <Image
        source={require('../../assets/house_logo.png')}
        style={{
          width: size - 4,
          height: size - 4,
          borderRadius: Math.max(6, Math.round(size * 0.18)),
        }}
        resizeMode="contain"
      />
    </View>
  );

  if (variant === 'vertical') {
    return (
      <View style={[styles.verticalContainer, style]}>
        {iconContent}
        {showText && (
          <View style={styles.verticalTextBox}>
            <Text style={styles.verticalTitle}>Hộ kinh doanh</Text>
            <Text style={styles.verticalSubtitle}>NỀN TẢNG KINH DOANH CHO MỌI NHÀ</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.headerContainer, style]}>
      {iconContent}
      {showText && <Text style={styles.headerTitle}>Hộ kinh doanh</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    backgroundColor: '#DBF8F3',
    borderWidth: 1.2,
    borderColor: '#BFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#1E5E4F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123D32',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  verticalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalTextBox: {
    alignItems: 'center',
    marginTop: 12,
  },
  verticalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  verticalSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E5E4F',
    letterSpacing: 0.8,
    marginTop: 4,
  },
});
