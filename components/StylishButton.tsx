import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  View,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StylishButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const StylishButton: React.FC<StylishButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  // 버튼 타입에 따른 색상 설정
  const getColors = (): [string, string] => {
    switch (type) {
      case 'primary':
        return ['#4F6CFF', '#6979F8'];
      case 'secondary':
        return ['#32D74B', '#30DB5B'];
      case 'outline':
        return ['transparent', 'transparent'];
      case 'danger':
        return ['#FF453A', '#FF6961'];
      default:
        return ['#4F6CFF', '#6979F8'];
    }
  };

  // 버튼 크기에 따른 스타일 설정
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 };
    }
  };

  // 텍스트 크기에 따른 스타일 설정
  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return { fontSize: 14 };
      case 'medium':
        return { fontSize: 16 };
      case 'large':
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };

  // 버튼 타입에 따른 테두리 스타일 설정
  const getBorderStyle = (): ViewStyle => {
    if (type === 'outline') {
      return { 
        borderWidth: 1, 
        borderColor: disabled ? '#CCCCCC' : '#4F6CFF' 
      };
    }
    return {};
  };

  // 플랫폼에 따른 그림자 스타일 설정
  const getShadowStyle = (): ViewStyle => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      };
    } else if (Platform.OS === 'android') {
      return {
        elevation: 3,
      };
    } else if (Platform.OS === 'web') {
      return {
        // @ts-ignore - 웹에서만 사용되는 속성
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      };
    }
    return {};
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, getSizeStyle(), getBorderStyle(), getShadowStyle(), style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          getSizeStyle(),
          { opacity: disabled ? 0.5 : 1 }
        ]}
      >
        {loading ? (
          <ActivityIndicator 
            color={type === 'outline' ? '#4F6CFF' : '#FFFFFF'} 
            size="small" 
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              style={[
                styles.text,
                getTextSizeStyle(),
                { color: type === 'outline' ? '#4F6CFF' : '#FFFFFF' },
                textStyle
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});

export default StylishButton; 